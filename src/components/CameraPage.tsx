import { useEffect, useRef, useState } from "react";
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';

interface Alert {
  id: number;
  message: string;
  type: 'danger' | 'warning' | 'info' | 'error';
  timestamp: string;
}

interface Stats {
  noFaceCount: number;
  multipleFacesCount: number;
  headTurnedCount: number;
  tabSwitchCount: number;
  lookingAwayCount: number;
  multipleVoicesCount: number;
  phoneDetectedCount: number;
  multipleMonitorsCount: number;
  totalAlerts: number;
}

interface SessionData {
  username: string;
  cameraOnTime: string;
  cameraOffTime: string | null;
  alerts: { [key: string]: number };
  recordingUrl: string | null;
}

// ─── Point deductions per alert sub-type ─────────────────────────────────────
// head_turn / look_away → 3 pts (strictly < 5)
// voices               → 0 pts (no deduction)
// danger               → 10 pts
// warning              → 5 pts
const ALERT_POINT_DEDUCTIONS: Record<string, number> = {
  danger:    10,
  warning:    5,
  head_turn:  3,
  look_away:  3,
  voices:     0,
  info:       0,
  error:      0,
};

const MAX_POINTS = 100;

// Invigilator audio thresholds — beep fires once when points drop below each value
const ALERT_THRESHOLDS = [70, 50, 35];

export default function CameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Which thresholds have already fired (so they only beep once each)
  const thresholdsTriggeredRef = useRef<Set<number>>(new Set());

  const [blazeFaceModel, setBlazeFaceModel] = useState<blazeface.BlazeFaceModel | null>(null);
  const [faceMeshModel, setFaceMeshModel] = useState<any>(null);
  const [objectDetectionModel, setObjectDetectionModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<Stats>({
    noFaceCount: 0, multipleFacesCount: 0, headTurnedCount: 0,
    tabSwitchCount: 0, lookingAwayCount: 0, multipleVoicesCount: 0,
    phoneDetectedCount: 0, multipleMonitorsCount: 0, totalAlerts: 0
  });
  const [points, setPoints] = useState<number>(MAX_POINTS);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [username] = useState("test_user_" + Date.now());
  const [sessionDocId, setSessionDocId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const [showFinalModal, setShowFinalModal] = useState(false);
  const [finalPoints, setFinalPoints] = useState<number>(MAX_POINTS);
  const [finalStats, setFinalStats] = useState<Stats | null>(null);

  const isMonitoringRef = useRef(false);
  useEffect(() => { isMonitoringRef.current = isMonitoring; }, [isMonitoring]);

  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioDetectionRef = useRef<NodeJS.Timeout | null>(null);
  const objectDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastAlertTimeRef = useRef<{ [key: string]: number }>({});
  const noFaceStartTimeRef = useRef<number | null>(null);
  const consecutiveNoFaceFrames = useRef(0);

  const pointsRef = useRef<number>(MAX_POINTS);
  useEffect(() => { pointsRef.current = points; }, [points]);

  const statsRef = useRef<Stats>({
    noFaceCount: 0, multipleFacesCount: 0, headTurnedCount: 0,
    tabSwitchCount: 0, lookingAwayCount: 0, multipleVoicesCount: 0,
    phoneDetectedCount: 0, multipleMonitorsCount: 0, totalAlerts: 0
  });
  useEffect(() => { statsRef.current = stats; }, [stats]);

  // ─── Invigilator beep ─────────────────────────────────────────────────────────
  // Uses a temporary AudioContext to avoid interfering with the mic analyser.
  // Beep count and frequency escalate as the score drops lower.
  const playInvigilatorAlert = (threshold: number) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const beepCount = threshold <= 35 ? 3 : threshold <= 50 ? 2 : 1;
      const freq      = threshold <= 35 ? 880 : threshold <= 50 ? 660 : 440;

      for (let i = 0; i < beepCount; i++) {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.35;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.6, t + 0.02);
        gain.gain.setValueAtTime(0.6, t + 0.18);
        gain.gain.linearRampToValueAtTime(0, t + 0.28);
        osc.start(t);
        osc.stop(t + 0.30);
      }
      setTimeout(() => ctx.close(), (beepCount * 0.35 + 0.4) * 1000);
    } catch (e) {
      console.warn('Invigilator beep failed:', e);
    }
  };

  // Fire beep the first time points cross below each threshold
  useEffect(() => {
    for (const threshold of ALERT_THRESHOLDS) {
      if (points < threshold && !thresholdsTriggeredRef.current.has(threshold)) {
        thresholdsTriggeredRef.current.add(threshold);
        playInvigilatorAlert(threshold);
      }
    }
  }, [points]);

  // ─── Stop monitoring ──────────────────────────────────────────────────────────
  const stopMonitoring = () => {
    isMonitoringRef.current = false;
    setIsMonitoring(false);
    setIsRecording(false);
    setFinalPoints(pointsRef.current);
    setFinalStats(statsRef.current);

    if (videoRef.current?.srcObject)
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());

    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    if (audioDetectionRef.current) clearInterval(audioDetectionRef.current);
    if (objectDetectionIntervalRef.current) clearInterval(objectDetectionIntervalRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    if (sessionDocId) updateSession({ cameraOffTime: new Date().toISOString() });

    setShowFinalModal(true);
  };

  // ─── Load AI models ───────────────────────────────────────────────────────────
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsModelLoading(true);
        await tf.ready();
        setBlazeFaceModel(await blazeface.load());
        try { setFaceMeshModel(await faceLandmarksDetection.load(faceLandmarksDetection.SupportedPackages.mediapipeFacemesh, { maxFaces: 1 })); }
        catch (e) { console.warn('FaceMesh unavailable:', e); }
        try { setObjectDetectionModel(await cocoSsd.load()); }
        catch (e) { console.warn('COCO-SSD unavailable:', e); }
        setIsModelLoading(false);
      } catch (error) {
        console.error('Model load error:', error);
        addAlert('Some AI models failed to load', 'warning');
        setIsModelLoading(false);
      }
    };
    loadModels();
  }, []);

  // ─── Firebase helpers ─────────────────────────────────────────────────────────
  const createSession = async () => {
    try {
      const docRef = await addDoc(collection(db, 'exam_sessions'), {
        username, cameraOnTime: new Date().toISOString(), cameraOffTime: null,
        alerts: { noFace:0, multipleFaces:0, headTurned:0, tabSwitch:0, lookingAway:0, multipleVoices:0, phoneDetected:0, multipleMonitors:0 },
        recordingUrl: null
      } as SessionData);
      setSessionDocId(docRef.id);
      return docRef.id;
    } catch (e) {
      console.error('Session create error:', e);
      addAlert('Failed to create session record', 'error');
      return null;
    }
  };

  const updateSession = async (updates: Partial<SessionData>) => {
    if (!sessionDocId) return;
    try { await updateDoc(doc(db, 'exam_sessions', sessionDocId), updates); }
    catch (e) { console.error('Session update error:', e); }
  };

  const incrementAlertInFirebase = async (alertType: string) => {
    if (!sessionDocId) return;
    try { await updateSession({ [`alerts.${alertType}`]: ((stats as any)[alertType+'Count'] || 0) + 1 } as any); }
    catch (e) { console.error('Alert increment error:', e); }
  };

  const startRecording = (stream: MediaStream) => {
    try {
      setIsRecording(true);
      if (sessionDocId) updateSession({ recordingUrl: 'Recording disabled - metadata only' });
    } catch (e) { console.error('Recording error:', e); }
  };

  // ─── Add alert + deduct points ────────────────────────────────────────────────
  // subtype can be 'danger' | 'warning' | 'head_turn' | 'look_away' | 'voices' | 'info' | 'error'
  const addAlert = (message: string, subtype: string = 'warning') => {
    const displayType: Alert['type'] =
      subtype === 'head_turn' || subtype === 'look_away' ? 'warning' :
      subtype === 'voices' ? 'info' :
      subtype as Alert['type'];

    setAlerts(prev => [{
      id: Date.now() + Math.random(), message, type: displayType,
      timestamp: new Date().toLocaleTimeString()
    }, ...prev].slice(0, 20));

    const deduction = ALERT_POINT_DEDUCTIONS[subtype] ?? 0;
    if (deduction > 0) setPoints(prev => Math.max(0, prev - deduction));
  };

  // ─── Multiple monitor detection ───────────────────────────────────────────────
  const detectMultipleMonitors = () => {
    const { width, height, availWidth, availHeight } = window.screen;
    if (width > availWidth * 1.5 || height > availHeight * 1.5) {
      const timeSince = Date.now() - (lastAlertTimeRef.current['multipleMonitors'] || 0);
      if (timeSince > 30000) {
        addAlert('Multiple Monitors Detected: Please disconnect additional displays', 'danger');
        setStats(prev => ({ ...prev, multipleMonitorsCount: prev.multipleMonitorsCount+1, totalAlerts: prev.totalAlerts+1 }));
        incrementAlertInFirebase('multipleMonitors');
        lastAlertTimeRef.current['multipleMonitors'] = Date.now();
      }
    }
  };

  // ─── Audio monitoring ─────────────────────────────────────────────────────────
  const setupAudioMonitoring = async (stream: MediaStream) => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;
      source.connect(analyserRef.current);
      startAudioDetection();
    } catch (e) { console.error('Audio setup error:', e); }
  };

  const startAudioDetection = () => {
    if (!analyserRef.current) return;
    analyserRef.current.fftSize = 4096;
    analyserRef.current.smoothingTimeConstant = 0.5;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let voiceEventBuffer: number[] = [];
    const VOICE_EVENT_WINDOW = 15, VOICE_EVENT_THRESHOLD = 8;
    const getSampleRate = () => audioContextRef.current?.sampleRate ?? 44100;

    const checkAudio = () => {
      if (!analyserRef.current || !isMonitoringRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      const hzPerBin = getSampleRate() / analyserRef.current.fftSize;
      const hzToBin = (hz: number) => Math.round(hz / hzPerBin);
      if (dataArray.reduce((a,b) => a+b, 0) / bufferLength < 15) {
        voiceEventBuffer.push(0);
        if (voiceEventBuffer.length > VOICE_EVENT_WINDOW) voiceEventBuffer.shift();
        return;
      }
      const voiceSlice = Array.from(dataArray.slice(hzToBin(80), hzToBin(3400)));
      const NOISE_FLOOR = 40, MIN_PEAK_DIST = hzToBin(80);
      const peaks: number[] = [];
      for (let i = 1; i < voiceSlice.length-1; i++) {
        if (voiceSlice[i] > NOISE_FLOOR && voiceSlice[i] > voiceSlice[i-1] && voiceSlice[i] > voiceSlice[i+1]) {
          if (!peaks.length || i - peaks[peaks.length-1] >= MIN_PEAK_DIST) peaks.push(i);
          else if (voiceSlice[i] > voiceSlice[peaks[peaks.length-1]]) peaks[peaks.length-1] = i;
        }
      }
      voiceEventBuffer.push(peaks.length >= 2 ? 1 : 0);
      if (voiceEventBuffer.length > VOICE_EVENT_WINDOW) voiceEventBuffer.shift();
      if (voiceEventBuffer.reduce((a,b) => a+b, 0) >= VOICE_EVENT_THRESHOLD) {
        const timeSince = Date.now() - (lastAlertTimeRef.current['multipleVoices'] || 0);
        if (timeSince > 6000) {
          // 'voices' subtype → 0 pts deducted
          addAlert('Multiple Voices Detected: More than one person speaking detected', 'voices');
          setStats(prev => ({ ...prev, multipleVoicesCount: prev.multipleVoicesCount+1, totalAlerts: prev.totalAlerts+1 }));
          incrementAlertInFirebase('multipleVoices');
          lastAlertTimeRef.current['multipleVoices'] = Date.now();
          voiceEventBuffer = [];
        }
      }
    };
    audioDetectionRef.current = setInterval(checkAudio, 100);
  };

  // ─── Phone detection (canvas snapshot, threshold 0.15) ────────────────────────
  const phoneCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const getPhoneCanvas = () => {
    if (!phoneCanvasRef.current) phoneCanvasRef.current = document.createElement('canvas');
    return phoneCanvasRef.current;
  };

  const detectObjects = async () => {
    if (!objectDetectionModel || !videoRef.current || !isMonitoringRef.current) return;
    const video = videoRef.current;
    if (video.readyState < 2) return;
    try {
      const snap = getPhoneCanvas();
      snap.width = video.videoWidth || 640;
      snap.height = video.videoHeight || 480;
      const ctx = snap.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, snap.width, snap.height);
      const preds = await objectDetectionModel.detect(snap);
      if (preds.some(p => (p.class === 'cell phone' || p.class === 'remote') && p.score > 0.15)) {
        const timeSince = Date.now() - (lastAlertTimeRef.current['phoneDetected'] || 0);
        if (timeSince > 800) {
          addAlert('Phone Detected: Mobile device detected in frame - Please remove it', 'danger');
          setStats(prev => ({ ...prev, phoneDetectedCount: prev.phoneDetectedCount+1, totalAlerts: prev.totalAlerts+1 }));
          incrementAlertInFirebase('phoneDetected');
          lastAlertTimeRef.current['phoneDetected'] = Date.now();
        }
      }
    } catch (e) { console.error('Object detection error:', e); }
  };

  // ─── Start camera ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' }, audio: true
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = async () => {
            videoRef.current?.play();
            isMonitoringRef.current = true;
            setIsMonitoring(true);
            const sessionId = await createSession();
            if (sessionId) startRecording(stream);
            await setupAudioMonitoring(stream);
            addAlert('Exam monitoring started - All systems active', 'info');
          };
        }
      } catch (err) {
        console.error('Camera error:', err);
        alert('Unable to access camera/microphone. Please allow permissions.');
      }
    };
    startCamera();
    detectMultipleMonitors();
    const monitorInterval = setInterval(detectMultipleMonitors, 10000);
    return () => {
      if (videoRef.current?.srcObject)
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      clearInterval(monitorInterval);
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
      if (audioDetectionRef.current) clearInterval(audioDetectionRef.current);
      if (objectDetectionIntervalRef.current) clearInterval(objectDetectionIntervalRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (isMonitoring && objectDetectionModel && videoRef.current)
      objectDetectionIntervalRef.current = setInterval(detectObjects, 300);
    return () => { if (objectDetectionIntervalRef.current) clearInterval(objectDetectionIntervalRef.current); };
  }, [isMonitoring, objectDetectionModel]);

  // ─── Tab visibility ───────────────────────────────────────────────────────────
  useEffect(() => {
    const handle = () => {
      if (document.hidden && isMonitoring) {
        addAlert('Tab Switch Detected: You switched away from the exam tab', 'danger');
        setStats(prev => ({ ...prev, tabSwitchCount: prev.tabSwitchCount+1, totalAlerts: prev.totalAlerts+1 }));
        incrementAlertInFirebase('tabSwitch');
      }
    };
    document.addEventListener('visibilitychange', handle);
    return () => document.removeEventListener('visibilitychange', handle);
  }, [isMonitoring, sessionDocId]);

  // ─── Clipboard / keyboard ─────────────────────────────────────────────────────
  useEffect(() => {
    const onCopy = (e: ClipboardEvent) => { if (isMonitoring) { e.preventDefault(); addAlert('Copy Attempt Blocked: Copying is not allowed', 'warning'); setStats(prev => ({ ...prev, totalAlerts: prev.totalAlerts+1 })); } };
    const onPaste = (e: ClipboardEvent) => { if (isMonitoring) { e.preventDefault(); addAlert('Paste Attempt Blocked: Pasting is not allowed', 'warning'); setStats(prev => ({ ...prev, totalAlerts: prev.totalAlerts+1 })); } };
    const onCtxMenu = (e: MouseEvent) => { if (isMonitoring) e.preventDefault(); };
    const onKey = (e: KeyboardEvent) => {
      if (!isMonitoring) return;
      if ((e.altKey || e.metaKey) && e.key === 'Tab') { e.preventDefault(); addAlert('Task Switch Attempt: Alt/Cmd+Tab is disabled', 'warning'); setStats(prev => ({ ...prev, totalAlerts: prev.totalAlerts+1 })); }
      if ((e.ctrlKey || e.metaKey) && ['c','v','x'].includes(e.key)) e.preventDefault();
      if (e.key === 'PrintScreen') { addAlert('Screenshot Attempt: Screenshot key detected', 'warning'); setStats(prev => ({ ...prev, totalAlerts: prev.totalAlerts+1 })); }
      if (e.key === 'F12') { e.preventDefault(); addAlert('Developer Tools Blocked: F12 is disabled', 'warning'); setStats(prev => ({ ...prev, totalAlerts: prev.totalAlerts+1 })); }
    };
    document.addEventListener('copy', onCopy);
    document.addEventListener('paste', onPaste);
    document.addEventListener('contextmenu', onCtxMenu);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('contextmenu', onCtxMenu);
      document.removeEventListener('keydown', onKey);
    };
  }, [isMonitoring]);

  // ─── Head angle ───────────────────────────────────────────────────────────────
  const calculateHeadAngle = (landmarks: number[][]): { isTurned: boolean; yawRatio: number } => {
    const yawRatio = Math.abs(landmarks[1][0] - landmarks[0][0]) / 60;
    return { isTurned: yawRatio < 0.60, yawRatio };
  };

  // ─── Eye gaze tracking ────────────────────────────────────────────────────────
  const detectEyeGaze = async (blazePrediction?: any, yawRatio?: number) => {
    if (!videoRef.current || !isMonitoringRef.current) return;
    if (yawRatio !== undefined && yawRatio < 0.70) return;
    try {
      let isLookingAway = false;
      if (faceMeshModel) {
        const preds = await faceMeshModel.estimateFaces({ input: videoRef.current, returnTensors: false, flipHorizontal: false });
        if (preds.length > 0) {
          const mesh = preds[0].scaledMesh ?? preds[0].mesh;
          if (mesh && mesh.length > 477) {
            const pt = (i: number): [number,number] => [mesh[i][0], mesh[i][1]];
            const li=pt(468),lo=pt(33),lin=pt(133),ri=pt(473),ro=pt(263),rin=pt(362);
            const lw=Math.abs(lin[0]-lo[0]), rw=Math.abs(rin[0]-ro[0]);
            const avg = ((lw>2?(li[0]-lo[0])/lw:0.5) + (rw>2?(ri[0]-ro[0])/rw:0.5)) / 2;
            isLookingAway = avg < 0.30 || avg > 0.70;
          } else if (mesh && mesh.length > 400) {
            if (yawRatio !== undefined && yawRatio < 0.80) return;
            const pt = (i: number): [number,number] => [mesh[i][0], mesh[i][1]];
            const lIdx=[33,133,160,159,158,157,173,144], rIdx=[263,362,387,386,385,384,398,373];
            const lE=lIdx.map(pt).reduce((a,b)=>[a[0]+b[0],a[1]+b[1]],[0,0]).map(v=>v/lIdx.length);
            const rE=rIdx.map(pt).reduce((a,b)=>[a[0]+b[0],a[1]+b[1]],[0,0]).map(v=>v/rIdx.length);
            const nose=pt(1), eyeDist=Math.abs(rE[0]-lE[0]);
            isLookingAway = Math.abs(nose[0]-(lE[0]+rE[0])/2) > eyeDist*0.25;
          }
        }
      } else if (blazePrediction?.landmarks) {
        if (yawRatio !== undefined && yawRatio < 0.80) return;
        const lm = blazePrediction.landmarks as number[][];
        const eyeDist = Math.abs(lm[0][0]-lm[1][0]);
        isLookingAway = Math.abs(lm[2][0]-(lm[0][0]+lm[1][0])/2) > eyeDist*0.25;
      }
      if (isLookingAway && Date.now()-(lastAlertTimeRef.current['lookingAway']||0) > 4000) {
        // 'look_away' subtype → 3 pts deducted (strictly < 5)
        addAlert('Looking Away Detected: Please look directly at the screen', 'look_away');
        setStats(prev => ({ ...prev, lookingAwayCount: prev.lookingAwayCount+1, totalAlerts: prev.totalAlerts+1 }));
        incrementAlertInFirebase('lookingAway');
        lastAlertTimeRef.current['lookingAway'] = Date.now();
      }
    } catch (e) { console.error('Eye gaze error:', e); }
  };

  // ─── Face detection ───────────────────────────────────────────────────────────
  const detectFaces = async () => {
    if (!blazeFaceModel || !videoRef.current || !canvasRef.current || !isMonitoringRef.current) return;
    try {
      const predictions = await blazeFaceModel.estimateFaces(videoRef.current, false);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (predictions.length === 0) {
        consecutiveNoFaceFrames.current++;
        if (!noFaceStartTimeRef.current) noFaceStartTimeRef.current = Date.now();
        if (Date.now()-noFaceStartTimeRef.current > 2000 && consecutiveNoFaceFrames.current > 4) {
          if (Date.now()-(lastAlertTimeRef.current['noFace']||0) > 3000) {
            addAlert('No Face Detected: Please return to camera view immediately', 'danger');
            setStats(prev => ({ ...prev, noFaceCount: prev.noFaceCount+1, totalAlerts: prev.totalAlerts+1 }));
            incrementAlertInFirebase('noFace');
            lastAlertTimeRef.current['noFace'] = Date.now();
          }
        }
        ctx.strokeStyle='#ef4444'; ctx.lineWidth=4;
        ctx.strokeRect(10,10,canvas.width-20,canvas.height-20);
        ctx.fillStyle='#ef4444'; ctx.font='bold 24px Arial';
        const t='NO FACE DETECTED';
        ctx.fillText(t,(canvas.width-ctx.measureText(t).width)/2,50);
        return;
      }

      consecutiveNoFaceFrames.current = 0;
      noFaceStartTimeRef.current = null;

      if (predictions.length > 1 && Date.now()-(lastAlertTimeRef.current['multipleFaces']||0) > 5000) {
        addAlert(`Multiple Faces Detected: ${predictions.length} people visible - Only test taker should be present`, 'danger');
        setStats(prev => ({ ...prev, multipleFacesCount: prev.multipleFacesCount+1, totalAlerts: prev.totalAlerts+1 }));
        incrementAlertInFirebase('multipleFaces');
        lastAlertTimeRef.current['multipleFaces'] = Date.now();
      }

      predictions.forEach((prediction, index) => {
        const start = prediction.topLeft as [number,number];
        const end = prediction.bottomRight as [number,number];
        const size = [end[0]-start[0], end[1]-start[1]];
        let boxColor = predictions.length > 1 ? '#ef4444' : '#10b981';
        ctx.strokeStyle=boxColor; ctx.lineWidth=3;
        ctx.strokeRect(start[0],start[1],size[0],size[1]);

        if (prediction.landmarks) {
          ctx.fillStyle=boxColor;
          (prediction.landmarks as number[][]).forEach(lm => {
            ctx.beginPath(); ctx.arc(lm[0],lm[1],3,0,2*Math.PI); ctx.fill();
          });
          if (predictions.length === 1) {
            const { isTurned, yawRatio } = calculateHeadAngle(prediction.landmarks as number[][]);
            (prediction as any).__yawRatio = yawRatio;
            if (isTurned && Date.now()-(lastAlertTimeRef.current['headTurned']||0) > 6000) {
              // 'head_turn' subtype → 3 pts deducted (strictly < 5)
              addAlert('Head Turned Detected: Please face the camera directly', 'head_turn');
              setStats(prev => ({ ...prev, headTurnedCount: prev.headTurnedCount+1, totalAlerts: prev.totalAlerts+1 }));
              incrementAlertInFirebase('headTurned');
              lastAlertTimeRef.current['headTurned'] = Date.now();
              ctx.strokeStyle='#f59e0b'; ctx.lineWidth=3;
              ctx.strokeRect(start[0],start[1],size[0],size[1]);
            }
          }
        }
        ctx.fillStyle=boxColor; ctx.font='bold 16px Arial';
        ctx.fillText(`Face ${index+1}`,start[0],start[1]-10);
      });

      ctx.fillStyle = predictions.length===1 ? '#10b981' : '#ef4444';
      ctx.font='bold 20px Arial';
      ctx.fillText(`${predictions.length} Face(s) Detected`,20,canvas.height-20);
      if (predictions.length===1) detectEyeGaze(predictions[0],(predictions[0] as any).__yawRatio);
    } catch (e) { console.error('Face detection error:', e); }
  };

  useEffect(() => {
    if (isMonitoring && blazeFaceModel)
      detectionIntervalRef.current = setInterval(detectFaces, 300);
    return () => { if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current); };
  }, [isMonitoring, blazeFaceModel, faceMeshModel]);

  // ─── Style helpers ────────────────────────────────────────────────────────────
  const getAlertColor = (type: Alert['type']) =>
    type==='danger'  ? 'border-l-4 border-red-500 bg-red-50 text-red-900' :
    type==='warning' ? 'border-l-4 border-yellow-500 bg-yellow-50 text-yellow-900' :
    type==='info'    ? 'border-l-4 border-blue-500 bg-blue-50 text-blue-900' :
                       'border-l-4 border-gray-500 bg-gray-50 text-gray-900';

  const getPointsColor = (p: number) =>
    p>=80?'text-emerald-400':p>=50?'text-yellow-400':p>=25?'text-orange-400':'text-red-400';
  const getPointsBarColor = (p: number) =>
    p>=80?'bg-emerald-500':p>=50?'bg-yellow-500':p>=25?'bg-orange-500':'bg-red-500';
  const getPointsGrade = (p: number) =>
    p>=90?{grade:'A',label:'Excellent',color:'text-emerald-400'}:
    p>=75?{grade:'B',label:'Good',     color:'text-blue-400'   }:
    p>=60?{grade:'C',label:'Average',  color:'text-yellow-400' }:
    p>=40?{grade:'D',label:'Poor',     color:'text-orange-400' }:
          {grade:'F',label:'Failed',   color:'text-red-400'    };

  const displayStats = finalStats ?? stats;

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a1736] text-white p-4">

      {/* ── Final Score Modal ── */}
      {showFinalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f1f45] border-2 border-[#3b82f6] rounded-3xl shadow-2xl p-10 w-full max-w-md text-center modal-slide-up">
            <div className="text-5xl mb-3">🎓</div>
            <h2 className="text-2xl font-bold mb-1 text-white">Exam Session Ended</h2>
            <p className="text-gray-400 text-sm mb-6">Here's your integrity score summary</p>
            <div className="relative w-36 h-36 mx-auto mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#1e293b" strokeWidth="10"/>
                <circle cx="60" cy="60" r="50" fill="none"
                  stroke={finalPoints>=80?'#10b981':finalPoints>=50?'#f59e0b':finalPoints>=25?'#f97316':'#ef4444'}
                  strokeWidth="10"
                  strokeDasharray={`${2*Math.PI*50}`}
                  strokeDashoffset={`${2*Math.PI*50*(1-finalPoints/100)}`}
                  strokeLinecap="round"
                  style={{ transition:'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-black ${getPointsColor(finalPoints)}`}>{finalPoints}</span>
                <span className="text-xs text-gray-400">/ 100</span>
              </div>
            </div>
            {(() => { const g=getPointsGrade(finalPoints); return (
              <div className={`inline-block px-5 py-1 rounded-full border text-sm font-bold mb-6 ${g.color} border-current`}>
                Grade {g.grade} — {g.label}
              </div>
            ); })()}
            <div className="grid grid-cols-4 gap-2 mb-8 text-xs">
              {[
                {label:'No Face',   value:displayStats.noFaceCount,        color:'text-red-400'   },
                {label:'Multi Face',value:displayStats.multipleFacesCount,  color:'text-orange-400'},
                {label:'Head Turn', value:displayStats.headTurnedCount,     color:'text-yellow-400'},
                {label:'Tab Switch',value:displayStats.tabSwitchCount,      color:'text-purple-400'},
                {label:'Look Away', value:displayStats.lookingAwayCount,    color:'text-pink-400'  },
                {label:'Voices',    value:displayStats.multipleVoicesCount, color:'text-rose-400'  },
                {label:'Phone',     value:displayStats.phoneDetectedCount,  color:'text-cyan-400'  },
                {label:'Total',     value:displayStats.totalAlerts,         color:'text-blue-400'  },
              ].map(item => (
                <div key={item.label} className="bg-[#1e293b] rounded-lg p-2">
                  <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
                  <div className="text-gray-500 text-[10px]">{item.label}</div>
                </div>
              ))}
            </div>
            <button onClick={() => { setShowFinalModal(false); window.location.href='/'; }}
              className="w-full py-3 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold text-base transition-colors duration-200">
              Return to Home
            </button>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="w-full max-w-7xl mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-center flex-1">Advanced Exam Proctoring System</h1>

          {/* End Session — compact, one place only */}
          {isMonitoring && (
            <button onClick={stopMonitoring}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold px-3.5 py-2 rounded-lg transition-all duration-150 shadow-md ml-4 text-sm whitespace-nowrap">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="5" y="5" width="14" height="14" rx="2"/>
              </svg>
              End Session
            </button>
          )}
        </div>
        {isModelLoading && (
          <div className="text-center text-yellow-400 text-sm mt-2">
            Loading AI models (Face Detection, Eye Tracking, Object Detection)...
          </div>
        )}
        {isMonitoring && (
          <div className="text-center text-red-400 text-sm flex items-center justify-center gap-2 mt-1">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            FULL MONITORING ACTIVE — Recording in Progress
          </div>
        )}
        {sessionDocId && <div className="text-center text-green-400 text-xs mt-1">Session ID: {sessionDocId}</div>}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 w-full max-w-7xl">
        {/* ── Left ── */}
        <div className="flex-1">
          <div className="relative">
            <video ref={videoRef} autoPlay playsInline muted
              className="w-full max-w-4xl h-[80vh] rounded-2xl border-4 border-[#3b82f6] shadow-2xl object-cover"/>
            <canvas ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full rounded-2xl pointer-events-none"/>
            {isRecording && (
              <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-lg flex items-center gap-2 text-sm">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>REC
              </div>
            )}
            <div className="absolute top-4 left-4 bg-[#0a1736]/90 border border-[#3b82f6] rounded-xl px-4 py-3 min-w-[130px] backdrop-blur-sm">
              <div className="text-xs text-gray-400 mb-1 font-medium tracking-wide uppercase">Integrity Score</div>
              <div className={`text-3xl font-black leading-none ${getPointsColor(points)}`}>
                {points}<span className="text-base font-normal text-gray-500"> / 100</span>
              </div>
              <div className="mt-2 h-2 bg-[#1e293b] rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${getPointsBarColor(points)}`}
                  style={{ width:`${points}%` }}/>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mt-4">
            {[
              {v:stats.noFaceCount,       c:'text-red-400',   l:'No Face'  },
              {v:stats.multipleFacesCount, c:'text-orange-400',l:'Multiple' },
              {v:stats.headTurnedCount,    c:'text-yellow-400',l:'Head Turn'},
              {v:stats.tabSwitchCount,     c:'text-purple-400',l:'Tab Switch'},
              {v:stats.lookingAwayCount,   c:'text-pink-400',  l:'Look Away'},
              {v:stats.multipleVoicesCount,c:'text-rose-400',  l:'Voices'   },
              {v:stats.phoneDetectedCount, c:'text-cyan-400',  l:'Phone'    },
              {v:stats.totalAlerts,        c:'text-blue-400',  l:'Total'    },
            ].map(({v,c,l}) => (
              <div key={l} className="bg-[#1e293b] rounded-lg p-2 text-center border border-[#3b82f6]">
                <div className={`text-xl font-bold ${c}`}>{v}</div>
                <div className="text-xs text-gray-400">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right ── */}
        <div className="w-full lg:w-80">
          <div className="bg-[#1e293b] rounded-2xl border-2 border-[#3b82f6] shadow-2xl p-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              Alert Log
            </h2>
            <div className="h-[calc(80vh-60px)] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {alerts.length === 0 ? (
                <div className="text-center text-gray-400 mt-8">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p className="text-sm">No alerts yet</p>
                </div>
              ) : alerts.map(alert => (
                <div key={alert.id} className={`p-3 rounded-lg ${getAlertColor(alert.type)} alert-slide-in`}>
                  <p className="font-semibold text-sm">{alert.message}</p>
                  <p className="text-xs mt-1 opacity-75">{alert.timestamp}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1e293b] rounded-2xl border-2 border-[#3b82f6] shadow-2xl p-4 mt-4">
            <h3 className="font-bold mb-3 text-sm">Active Monitoring Systems</h3>
            <div className="space-y-2 text-xs text-gray-300">
              {[
                {color:'bg-red-500',   label:'Face Detection (BlazeFace AI)'},
                {color:'bg-orange-500',label:'Eye Gaze Tracking (FaceMesh)'  },
                {color:'bg-yellow-500',label:'Head Orientation Analysis'     },
                {color:'bg-purple-500',label:'Multiple Voice Detection'      },
                {color:'bg-pink-500',  label:'Phone Detection (COCO-SSD)'   },
                {color:'bg-cyan-500',  label:'Multiple Monitor Detection'    },
                {color:'bg-blue-500',  label:'Tab/Window Monitoring'         },
                {color:'bg-green-500', label:'Session Recording to Firebase' },
              ].map(({color,label}) => (
                <div key={label} className="flex items-start gap-2">
                  <div className={`w-2 h-2 ${color} rounded-full mt-1`}></div>
                  <p>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Updated deduction legend */}
          <div className="bg-[#1e293b] rounded-2xl border-2 border-[#3b82f6] shadow-2xl p-4 mt-4">
            <h3 className="font-bold mb-2 text-sm">Point Deductions</h3>
            <div className="space-y-1 text-xs text-gray-300">
              <div className="flex justify-between"><span>🔴 No face / Phone / Tab switch</span><span className="text-red-400 font-bold">−10 pts</span></div>
              <div className="flex justify-between"><span>🟡 Copy / Paste / Screenshot</span><span className="text-yellow-400 font-bold">−5 pts</span></div>
              <div className="flex justify-between"><span>🟠 Head turn / Look away</span><span className="text-orange-400 font-bold">−3 pts</span></div>
              <div className="flex justify-between"><span>🔵 Multiple voices</span><span className="text-gray-400 font-bold">0 pts</span></div>
            </div>
            <div className="mt-3 pt-2 border-t border-[#3b82f6]/30 space-y-1 text-xs">
              <p className="font-semibold text-gray-300 mb-1">🔔 Invigilator audio alerts</p>
              <div className="flex justify-between text-gray-400"><span>Score drops below 70</span><span>1 beep</span></div>
              <div className="flex justify-between text-gray-400"><span>Score drops below 50</span><span>2 beeps</span></div>
              <div className="flex justify-between text-gray-400"><span>Score drops below 35</span><span>3 beeps</span></div>
            </div>
          </div>

          <div className="bg-[#1e293b] rounded-2xl border-2 border-[#3b82f6] shadow-2xl p-4 mt-4">
            <h3 className="font-bold mb-2 text-sm">Session Info</h3>
            <div className="space-y-1 text-xs text-gray-300">
              <p><span className="text-gray-400">User:</span> {username}</p>
              <p><span className="text-gray-400">Status:</span> {isRecording ? '🔴 Recording' : '⚫ Stopped'}</p>
              <p><span className="text-gray-400">Models:</span> {isModelLoading ? 'Loading...' : '✓ Loaded'}</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1e293b; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3b82f6; border-radius: 3px; }
        @keyframes alert-slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes modal-slide-up {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .alert-slide-in { animation: alert-slide-in 0.3s ease-out; }
        .modal-slide-up { animation: modal-slide-up 0.4s ease-out; }
      `}</style>
    </div>
  );
}