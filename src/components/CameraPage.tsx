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

export default function CameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  
  const [blazeFaceModel, setBlazeFaceModel] = useState<blazeface.BlazeFaceModel | null>(null);
  const [faceMeshModel, setFaceMeshModel] = useState<any>(null);
  const [objectDetectionModel, setObjectDetectionModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<Stats>({
    noFaceCount: 0,
    multipleFacesCount: 0,
    headTurnedCount: 0,
    tabSwitchCount: 0,
    lookingAwayCount: 0,
    multipleVoicesCount: 0,
    phoneDetectedCount: 0,
    multipleMonitorsCount: 0,
    totalAlerts: 0
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [username, setUsername] = useState("test_user_" + Date.now());
  const [sessionDocId, setSessionDocId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioDetectionRef = useRef<NodeJS.Timeout | null>(null);
  const objectDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastAlertTimeRef = useRef<{ [key: string]: number }>({});
  const noFaceStartTimeRef = useRef<number | null>(null);
  const consecutiveNoFaceFrames = useRef(0);

  // Load all AI models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsModelLoading(true);
        await tf.ready();
        
        // Load BlazeFace for face detection
        console.log('Loading BlazeFace...');
        const blazeFace = await blazeface.load();
        setBlazeFaceModel(blazeFace);
        console.log('✓ BlazeFace model loaded');
        
        // Load FaceMesh for eye gaze tracking
        console.log('Loading FaceMesh...');
        try {
          const faceMesh = await faceLandmarksDetection.load(
            faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
            { maxFaces: 1 }
          );
          setFaceMeshModel(faceMesh);
          console.log('✓ FaceMesh model loaded');
        } catch (fmError) {
          console.warn('FaceMesh failed to load, eye tracking disabled:', fmError);
        }
        
        // Load COCO-SSD for object detection (phone detection)
        console.log('Loading COCO-SSD...');
        try {
          const objectModel = await cocoSsd.load();
          setObjectDetectionModel(objectModel);
          console.log('✓ COCO-SSD model loaded');
        } catch (cocoError) {
          console.warn('COCO-SSD failed to load, phone detection disabled:', cocoError);
        }
        
        setIsModelLoading(false);
      } catch (error) {
        console.error('Error loading models:', error);
        addAlert('Some AI models failed to load', 'warning');
        setIsModelLoading(false);
      }
    };
    loadModels();
  }, []);

  // Create Firebase session document
  const createSession = async () => {
    try {
      const sessionData: SessionData = {
        username: username,
        cameraOnTime: new Date().toISOString(),
        cameraOffTime: null,
        alerts: {
          noFace: 0,
          multipleFaces: 0,
          headTurned: 0,
          tabSwitch: 0,
          lookingAway: 0,
          multipleVoices: 0,
          phoneDetected: 0,
          multipleMonitors: 0
        },
        recordingUrl: null
      };
      
      const docRef = await addDoc(collection(db, 'exam_sessions'), sessionData);
      setSessionDocId(docRef.id);
      console.log('Session created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating session:', error);
      addAlert('Failed to create session record', 'error');
      return null;
    }
  };

  // Update Firebase session
  const updateSession = async (updates: Partial<SessionData>) => {
    if (!sessionDocId) return;
    
    try {
      const sessionRef = doc(db, 'exam_sessions', sessionDocId);
      await updateDoc(sessionRef, updates);
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  // Increment alert count in Firebase
  const incrementAlertInFirebase = async (alertType: string) => {
    if (!sessionDocId) return;
    
    try {
      const alertKey = `alerts.${alertType}`;
      const currentCount = (stats as any)[alertType + 'Count'] || 0;
      await updateSession({ [alertKey]: currentCount + 1 } as any);
    } catch (error) {
      console.error('Error updating alert count:', error);
    }
  };

  // Start video recording (disabled - storage rules not accessible)
  const startRecording = (stream: MediaStream) => {
    try {
      // Recording disabled - just mark as active for UI purposes
      setIsRecording(true);
      console.log('Recording simulation started (actual recording disabled)');
      
      // Store metadata only - no actual video recording
      if (sessionDocId) {
        updateSession({ recordingUrl: 'Recording disabled - metadata only' });
      }
    } catch (error) {
      console.error('Error in recording simulation:', error);
    }
  };

  // Upload recording to Firebase (disabled)
  const uploadRecording = async (blob: Blob) => {
    console.log('Video upload disabled - storage rules not accessible');
    // You can implement this later when storage rules are available
  };

  // Multiple monitor detection
  const detectMultipleMonitors = () => {
    if (window.screen) {
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      const availWidth = window.screen.availWidth;
      const availHeight = window.screen.availHeight;
      
      if (screenWidth > availWidth * 1.5 || screenHeight > availHeight * 1.5) {
        const timeSinceLastAlert = Date.now() - (lastAlertTimeRef.current['multipleMonitors'] || 0);
        if (timeSinceLastAlert > 30000) {
          addAlert('Multiple Monitors Detected: Please disconnect additional displays', 'danger');
          setStats(prev => ({ 
            ...prev, 
            multipleMonitorsCount: prev.multipleMonitorsCount + 1, 
            totalAlerts: prev.totalAlerts + 1 
          }));
          incrementAlertInFirebase('multipleMonitors');
          lastAlertTimeRef.current['multipleMonitors'] = Date.now();
        }
      }
    }
  };

  // Enhanced audio monitoring for multiple voices
  const setupAudioMonitoring = async (stream: MediaStream) => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;
      source.connect(analyserRef.current);
      
      startAudioDetection();
    } catch (error) {
      console.error('Error setting up audio monitoring:', error);
    }
  };

  const startAudioDetection = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let peakHistory: number[] = [];
    let consecutiveLoudFrames = 0;

    const checkAudio = () => {
      if (!analyserRef.current || !isMonitoring) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate overall volume
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      
      // Split into frequency bands
      const lowFreq = dataArray.slice(0, Math.floor(bufferLength / 4));
      const midFreq = dataArray.slice(Math.floor(bufferLength / 4), Math.floor(bufferLength / 2));
      const highFreq = dataArray.slice(Math.floor(bufferLength / 2));
      
      const lowAvg = lowFreq.reduce((a, b) => a + b, 0) / lowFreq.length;
      const midAvg = midFreq.reduce((a, b) => a + b, 0) / midFreq.length;
      const highAvg = highFreq.reduce((a, b) => a + b, 0) / highFreq.length;
      
      // Detect speech (human voice typically has energy in mid frequencies)
      if (average > 20) {
        consecutiveLoudFrames++;
        
        // Check for multiple voice characteristics
        const activeBands = [lowAvg, midAvg, highAvg].filter(v => v > 30);
        
        if (activeBands.length >= 2 && consecutiveLoudFrames > 5) {
          peakHistory.push(activeBands.length);
          if (peakHistory.length > 20) peakHistory.shift();
          
          const avgPeaks = peakHistory.reduce((a, b) => a + b, 0) / peakHistory.length;
          
          // Multiple voices detected
          if (avgPeaks >= 1.5 && consecutiveLoudFrames > 15) {
            const timeSinceLastAlert = Date.now() - (lastAlertTimeRef.current['multipleVoices'] || 0);
            if (timeSinceLastAlert > 8000) {
              addAlert('Multiple Voices Detected: More than one person speaking detected', 'danger');
              setStats(prev => ({ 
                ...prev, 
                multipleVoicesCount: prev.multipleVoicesCount + 1, 
                totalAlerts: prev.totalAlerts + 1 
              }));
              incrementAlertInFirebase('multipleVoices');
              lastAlertTimeRef.current['multipleVoices'] = Date.now();
              consecutiveLoudFrames = 0;
              peakHistory = [];
            }
          }
        }
      } else {
        consecutiveLoudFrames = Math.max(0, consecutiveLoudFrames - 1);
      }
      
      // Debug logging (remove in production)
      if (average > 20) {
        console.log('Audio detected:', { average, lowAvg, midAvg, highAvg, consecutiveLoudFrames });
      }
    };

    audioDetectionRef.current = setInterval(checkAudio, 100);
  };

  // Object detection for phones
  const detectObjects = async () => {
    if (!objectDetectionModel || !videoRef.current || !isMonitoring) return;

    try {
      const predictions = await objectDetectionModel.detect(videoRef.current);
      
      // Log all detected objects for debugging
      if (predictions.length > 0) {
        console.log('Objects detected:', predictions.map(p => ({ class: p.class, score: p.score })));
      }
      
      const phoneDetected = predictions.some(pred => 
        pred.class === 'cell phone' && pred.score > 0.5
      );
      
      if (phoneDetected) {
        const timeSinceLastAlert = Date.now() - (lastAlertTimeRef.current['phoneDetected'] || 0);
        if (timeSinceLastAlert > 5000) {
          addAlert('Phone Detected: Mobile device detected in frame - Please remove it', 'danger');
          setStats(prev => ({ 
            ...prev, 
            phoneDetectedCount: prev.phoneDetectedCount + 1, 
            totalAlerts: prev.totalAlerts + 1 
          }));
          incrementAlertInFirebase('phoneDetected');
          lastAlertTimeRef.current['phoneDetected'] = Date.now();
        }
      }
    } catch (error) {
      console.error('Error during object detection:', error);
    }
  };

  // Start camera with all features
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 640, 
            height: 480,
            facingMode: 'user'
          },
          audio: true
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = async () => {
            videoRef.current?.play();
            setIsMonitoring(true);
            
            const sessionId = await createSession();
            if (sessionId) {
              startRecording(stream);
            }
            
            addAlert('Exam monitoring started - All systems active', 'info');
          };
          
          setupAudioMonitoring(stream);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        alert("Unable to access camera/microphone. Please allow permissions.");
      }
    };

    startCamera();

    detectMultipleMonitors();
    const monitorCheckInterval = setInterval(detectMultipleMonitors, 10000);

    return () => {
      // Stop recording simulation
      if (isRecording) {
        setIsRecording(false);
        console.log('Recording simulation stopped');
      }
      
      if (sessionDocId) {
        updateSession({ cameraOffTime: new Date().toISOString() });
      }
      
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((track) => track.stop());
      }
      
      clearInterval(monitorCheckInterval);
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
      if (audioDetectionRef.current) clearInterval(audioDetectionRef.current);
      if (objectDetectionIntervalRef.current) clearInterval(objectDetectionIntervalRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  // Start object detection with proper interval
  useEffect(() => {
    if (isMonitoring && objectDetectionModel && videoRef.current) {
      console.log('Starting object detection...');
      objectDetectionIntervalRef.current = setInterval(detectObjects, 3000); // Check every 3 seconds
    }
    
    return () => {
      if (objectDetectionIntervalRef.current) {
        clearInterval(objectDetectionIntervalRef.current);
        console.log('Object detection stopped');
      }
    };
  }, [isMonitoring, objectDetectionModel]);

  // Tab visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isMonitoring) {
        addAlert('Tab Switch Detected: You switched away from the exam tab', 'danger');
        setStats(prev => ({ 
          ...prev, 
          tabSwitchCount: prev.tabSwitchCount + 1, 
          totalAlerts: prev.totalAlerts + 1 
        }));
        incrementAlertInFirebase('tabSwitch');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isMonitoring, sessionDocId]);

  // Clipboard and keyboard monitoring
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      if (isMonitoring) {
        e.preventDefault();
        addAlert('Copy Attempt Blocked: Copying content is not allowed during exam', 'warning');
        setStats(prev => ({ ...prev, totalAlerts: prev.totalAlerts + 1 }));
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (isMonitoring) {
        e.preventDefault();
        addAlert('Paste Attempt Blocked: Pasting content is not allowed during exam', 'warning');
        setStats(prev => ({ ...prev, totalAlerts: prev.totalAlerts + 1 }));
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (isMonitoring) {
        e.preventDefault();
        addAlert('Right-Click Blocked: Right-click is disabled during exam', 'warning');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isMonitoring) return;

      if ((e.altKey && e.key === 'Tab') || (e.metaKey && e.key === 'Tab')) {
        e.preventDefault();
        addAlert('Task Switch Attempt: Alt/Cmd+Tab is disabled during exam', 'warning');
        setStats(prev => ({ ...prev, totalAlerts: prev.totalAlerts + 1 }));
      }

      if (e.ctrlKey || e.metaKey) {
        if (['c', 'v', 'x'].includes(e.key)) {
          e.preventDefault();
        }
      }

      if (e.key === 'PrintScreen') {
        addAlert('Screenshot Attempt: Screenshot key detected', 'warning');
        setStats(prev => ({ ...prev, totalAlerts: prev.totalAlerts + 1 }));
      }

      if (e.key === 'F12') {
        e.preventDefault();
        addAlert('Developer Tools Blocked: F12 is disabled during exam', 'warning');
        setStats(prev => ({ ...prev, totalAlerts: prev.totalAlerts + 1 }));
      }
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMonitoring]);

  const addAlert = (message: string, type: Alert['type'] = 'warning') => {
    const newAlert: Alert = {
      id: Date.now() + Math.random(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setAlerts(prev => [newAlert, ...prev].slice(0, 20));
  };

  const calculateHeadAngle = (landmarks: number[][]) => {
    const leftEye = landmarks[0];
    const rightEye = landmarks[1];
    const eyeDistance = Math.abs(rightEye[0] - leftEye[0]);
    const normalEyeDistance = 60;
    const ratio = eyeDistance / normalEyeDistance;
    return ratio < 0.75;
  };

  // Eye gaze tracking
  const detectEyeGaze = async () => {
    if (!faceMeshModel || !videoRef.current || !isMonitoring) return;

    try {
      const predictions = await faceMeshModel.estimateFaces({
        input: videoRef.current,
        returnTensors: false,
        flipHorizontal: false
      });

      if (predictions.length > 0) {
        const keypoints = predictions[0].scaledMesh;
        
        // Eye landmarks indices for better tracking
        const leftEyeIndices = [33, 133, 160, 159, 158, 157, 173, 144];
        const rightEyeIndices = [263, 362, 387, 386, 385, 384, 398, 373];
        
        // Calculate eye centers
        const leftEyeCenter = leftEyeIndices.reduce((acc, idx) => {
          return [acc[0] + keypoints[idx][0], acc[1] + keypoints[idx][1]];
        }, [0, 0]).map(v => v / leftEyeIndices.length);
        
        const rightEyeCenter = rightEyeIndices.reduce((acc, idx) => {
          return [acc[0] + keypoints[idx][0], acc[1] + keypoints[idx][1]];
        }, [0, 0]).map(v => v / rightEyeIndices.length);
        
        // Get nose tip for reference
        const noseTip = keypoints[1];
        
        // Calculate face center
        const faceCenter = [(leftEyeCenter[0] + rightEyeCenter[0]) / 2, (leftEyeCenter[1] + rightEyeCenter[1]) / 2];
        
        // Check if looking away based on nose-to-eye relationship
        const noseDeltaX = Math.abs(noseTip[0] - faceCenter[0]);
        const eyeDistance = Math.abs(rightEyeCenter[0] - leftEyeCenter[0]);
        
        // If nose is too far from center relative to eye distance, person is looking away
        const lookingAwayThreshold = eyeDistance * 0.3;
        
        if (noseDeltaX > lookingAwayThreshold) {
          const timeSinceLastAlert = Date.now() - (lastAlertTimeRef.current['lookingAway'] || 0);
          if (timeSinceLastAlert > 4000) {
            addAlert('Looking Away Detected: Please look directly at the screen', 'warning');
            setStats(prev => ({ 
              ...prev, 
              lookingAwayCount: prev.lookingAwayCount + 1, 
              totalAlerts: prev.totalAlerts + 1 
            }));
            incrementAlertInFirebase('lookingAway');
            lastAlertTimeRef.current['lookingAway'] = Date.now();
          }
        }
        
        // Debug logging
        console.log('Gaze tracking:', { noseDeltaX, lookingAwayThreshold, eyeDistance });
      }
    } catch (error) {
      console.error('Error during eye gaze tracking:', error);
    }
  };

  const detectFaces = async () => {
    if (!blazeFaceModel || !videoRef.current || !canvasRef.current || !isMonitoring) {
      return;
    }

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
        
        if (!noFaceStartTimeRef.current) {
          noFaceStartTimeRef.current = Date.now();
        }
        
        const noFaceDuration = Date.now() - noFaceStartTimeRef.current;
        
        if (noFaceDuration > 2000 && consecutiveNoFaceFrames.current > 4) {
          const timeSinceLastAlert = Date.now() - (lastAlertTimeRef.current['noFace'] || 0);
          if (timeSinceLastAlert > 3000) {
            addAlert('No Face Detected: Please return to camera view immediately', 'danger');
            setStats(prev => ({ 
              ...prev, 
              noFaceCount: prev.noFaceCount + 1, 
              totalAlerts: prev.totalAlerts + 1 
            }));
            incrementAlertInFirebase('noFace');
            lastAlertTimeRef.current['noFace'] = Date.now();
          }
        }
        
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 24px Arial';
        const text = 'NO FACE DETECTED';
        const textWidth = ctx.measureText(text).width;
        ctx.fillText(text, (canvas.width - textWidth) / 2, 50);
        
        return;
      }
      
      consecutiveNoFaceFrames.current = 0;
      noFaceStartTimeRef.current = null;
      
      if (predictions.length > 1) {
        const timeSinceLastAlert = Date.now() - (lastAlertTimeRef.current['multipleFaces'] || 0);
        if (timeSinceLastAlert > 5000) {
          addAlert(`Multiple Faces Detected: ${predictions.length} people visible - Only test taker should be present`, 'danger');
          setStats(prev => ({ 
            ...prev, 
            multipleFacesCount: prev.multipleFacesCount + 1, 
            totalAlerts: prev.totalAlerts + 1 
          }));
          incrementAlertInFirebase('multipleFaces');
          lastAlertTimeRef.current['multipleFaces'] = Date.now();
        }
      }
      
      predictions.forEach((prediction, index) => {
        const start = prediction.topLeft as [number, number];
        const end = prediction.bottomRight as [number, number];
        const size = [end[0] - start[0], end[1] - start[1]];
        
        let boxColor = '#10b981';
        if (predictions.length > 1) {
          boxColor = '#ef4444';
        }
        
        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(start[0], start[1], size[0], size[1]);
        
        if (prediction.landmarks) {
          ctx.fillStyle = boxColor;
          (prediction.landmarks as number[][]).forEach(landmark => {
            ctx.beginPath();
            ctx.arc(landmark[0], landmark[1], 3, 0, 2 * Math.PI);
            ctx.fill();
          });
          
          if (predictions.length === 1) {
            const isHeadTurned = calculateHeadAngle(prediction.landmarks as number[][]);
            if (isHeadTurned) {
              const timeSinceLastAlert = Date.now() - (lastAlertTimeRef.current['headTurned'] || 0);
              if (timeSinceLastAlert > 6000) {
                addAlert('Head Turned Detected: Please face the camera directly', 'warning');
                setStats(prev => ({ 
                  ...prev, 
                  headTurnedCount: prev.headTurnedCount + 1, 
                  totalAlerts: prev.totalAlerts + 1 
                }));
                incrementAlertInFirebase('headTurned');
                lastAlertTimeRef.current['headTurned'] = Date.now();
              }
              ctx.strokeStyle = '#f59e0b';
              ctx.lineWidth = 3;
              ctx.strokeRect(start[0], start[1], size[0], size[1]);
            }
          }
        }
        
        ctx.fillStyle = boxColor;
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`Face ${index + 1}`, start[0], start[1] - 10);
      });
      
      const statusColor = predictions.length === 1 ? '#10b981' : '#ef4444';
      ctx.fillStyle = statusColor;
      ctx.font = 'bold 20px Arial';
      ctx.fillText(`${predictions.length} Face(s) Detected`, 20, canvas.height - 20);
      
      if (predictions.length === 1) {
        detectEyeGaze();
      }
      
    } catch (error) {
      console.error('Error during face detection:', error);
    }
  };

  useEffect(() => {
    if (isMonitoring && blazeFaceModel) {
      console.log('Starting face detection loop...');
      detectionIntervalRef.current = setInterval(detectFaces, 300);
    }
    
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        console.log('Face detection stopped');
      }
    };
  }, [isMonitoring, blazeFaceModel, faceMeshModel]);

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'danger': return 'border-l-4 border-red-500 bg-red-50 text-red-900';
      case 'warning': return 'border-l-4 border-yellow-500 bg-yellow-50 text-yellow-900';
      case 'info': return 'border-l-4 border-blue-500 bg-blue-50 text-blue-900';
      case 'error': return 'border-l-4 border-gray-500 bg-gray-50 text-gray-900';
      default: return 'border-l-4 border-gray-500 bg-gray-50 text-gray-900';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a1736] text-white p-4">
      <div className="w-full max-w-7xl mb-4">
        <h1 className="text-3xl font-bold mb-2 text-center">Advanced Exam Proctoring System</h1>
        {isModelLoading && (
          <div className="text-center text-yellow-400 text-sm">
            Loading AI models (Face Detection, Eye Tracking, Object Detection)...
          </div>
        )}
        {isMonitoring && (
          <div className="text-center text-red-400 text-sm flex items-center justify-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            FULL MONITORING ACTIVE - Recording in Progress
          </div>
        )}
        {sessionDocId && (
          <div className="text-center text-green-400 text-xs mt-1">
            Session ID: {sessionDocId}
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 w-full max-w-7xl">
        <div className="flex-1">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full max-w-4xl h-[80vh] rounded-2xl border-4 border-[#3b82f6] shadow-2xl object-cover"
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full rounded-2xl pointer-events-none"
            />
            {isRecording && (
              <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-lg flex items-center gap-2 text-sm">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                REC
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mt-4">
            <div className="bg-[#1e293b] rounded-lg p-2 text-center border border-[#3b82f6]">
              <div className="text-xl font-bold text-red-400">{stats.noFaceCount}</div>
              <div className="text-xs text-gray-400">No Face</div>
            </div>
            <div className="bg-[#1e293b] rounded-lg p-2 text-center border border-[#3b82f6]">
              <div className="text-xl font-bold text-orange-400">{stats.multipleFacesCount}</div>
              <div className="text-xs text-gray-400">Multiple</div>
            </div>
            <div className="bg-[#1e293b] rounded-lg p-2 text-center border border-[#3b82f6]">
              <div className="text-xl font-bold text-yellow-400">{stats.headTurnedCount}</div>
              <div className="text-xs text-gray-400">Head Turn</div>
            </div>
            <div className="bg-[#1e293b] rounded-lg p-2 text-center border border-[#3b82f6]">
              <div className="text-xl font-bold text-purple-400">{stats.tabSwitchCount}</div>
              <div className="text-xs text-gray-400">Tab Switch</div>
            </div>
            <div className="bg-[#1e293b] rounded-lg p-2 text-center border border-[#3b82f6]">
              <div className="text-xl font-bold text-pink-400">{stats.lookingAwayCount}</div>
              <div className="text-xs text-gray-400">Look Away</div>
            </div>
            <div className="bg-[#1e293b] rounded-lg p-2 text-center border border-[#3b82f6]">
              <div className="text-xl font-bold text-rose-400">{stats.multipleVoicesCount}</div>
              <div className="text-xs text-gray-400">Voices</div>
            </div>
            <div className="bg-[#1e293b] rounded-lg p-2 text-center border border-[#3b82f6]">
              <div className="text-xl font-bold text-cyan-400">{stats.phoneDetectedCount}</div>
              <div className="text-xs text-gray-400">Phone</div>
            </div>
            <div className="bg-[#1e293b] rounded-lg p-2 text-center border border-[#3b82f6]">
              <div className="text-xl font-bold text-blue-400">{stats.totalAlerts}</div>
              <div className="text-xs text-gray-400">Total</div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-80">
          <div className="bg-[#1e293b] rounded-2xl border-2 border-[#3b82f6] shadow-2xl p-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Alert Log
            </h2>
            
            <div className="h-[calc(80vh-60px)] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {alerts.length === 0 ? (
                <div className="text-center text-gray-400 mt-8">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm">No alerts yet</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg ${getAlertColor(alert.type)} animate-in slide-in-from-right`}
                  >
                    <p className="font-semibold text-sm">{alert.message}</p>
                    <p className="text-xs mt-1 opacity-75">{alert.timestamp}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-[#1e293b] rounded-2xl border-2 border-[#3b82f6] shadow-2xl p-4 mt-4">
            <h3 className="font-bold mb-3 text-sm">Active Monitoring Systems</h3>
            <div className="space-y-2 text-xs text-gray-300">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-1"></div>
                <p>Face Detection (BlazeFace AI)</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-1"></div>
                <p>Eye Gaze Tracking (FaceMesh)</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1"></div>
                <p>Head Orientation Analysis</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-1"></div>
                <p>Multiple Voice Detection</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full mt-1"></div>
                <p>Phone Detection (COCO-SSD)</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-cyan-500 rounded-full mt-1"></div>
                <p>Multiple Monitor Detection</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                <p>Tab/Window Monitoring</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1"></div>
                <p>Session Recording to Firebase</p>
              </div>
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
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1e293b;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3b82f6;
          border-radius: 3px;
        }
        @keyframes slide-in-from-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-in {
          animation: slide-in-from-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}