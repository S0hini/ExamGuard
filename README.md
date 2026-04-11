# 📚 ExamGuard — Smart AI-Powered Proctoring System

ExamGuard is an intelligent online proctoring web application that ensures fair examinations using real-time face detection, eye-tracking, behavioral monitoring, and automated alerts — all running directly in the browser.

---

## 🚀 Features

### 🎥 Real-Time Monitoring
- Live webcam streaming
- Face detection (single & multiple)
- No-face detection alerts
- Eye-tracking via MediaPipe Iris
- Look-away detection
- Suspicious behavior tracking

### ⚠️ Automated Alerts
- Look-away from screen
- No face detected
- Multiple faces in frame
- Mouth opening (talking detection)
- Frequent head movement
- Mobile device usage (if model enabled)

All alerts are logged in Firebase with precise timestamps.

### 📊 Student Behavior Analytics
- Total alert count
- Look-away frequency
- No-face occurrences
- Multiple-face detections
- Mouth-open count
- Overall exam integrity score

### ☁️ Cloud Integration (Firebase)
- User authentication
- Firestore alert logging
- Real-time updates
- Secure session management

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, TypeScript, TailwindCSS, Vite |
| AI / ML | TensorFlow.js, MediaPipe FaceMesh, BlazeFace, Iris Tracking |
| Backend | Firebase Authentication, Firestore |
| Build Tools | ESLint, Prettier, Vite |

---

## 📦 Installation

```bash
git clone https://github.com/S0hini/ExamGuard.git
cd ExamGuard
npm install
npm install firebase
npm install react-router-dom
npm install @tensorflow/tfjs @tensorflow-models/blazeface @tensorflow-models/face-landmarks-detection @tensorflow-models/coco-ssd
```

---

## ▶️ Usage

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Log in with your registered student account.
3. Start an exam session.
4. ExamGuard will:
   - Access your webcam
   - Run live AI-based proctoring
   - Detect and flag suspicious behavior
   - Log all alerts to Firebase
5. End the exam to view the generated integrity report.

---

## 🗂️ Project Structure

```
ExamGuard/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/            # Route-level pages (Login, Exam, Report)
│   ├── hooks/            # Custom React hooks (webcam, detection)
│   ├── utils/            # Helper functions
│   └── firebase/         # Firebase config & services
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

---

## 🧭 Roadmap

- [ ] Audio classification for noise detection
- [ ] Teacher dashboard for monitoring multiple students
- [ ] Complete exam-session report generation
- [ ] Head pose estimation integration
- [ ] Video recording & playback
- [ ] Mobile version compatibility

---

## 🤝 Contributors

| Contributor | GitHub |
|-------------|--------|
| Sohini | [@S0hini](https://github.com/S0hini) |
| Sayantani | [@Sayantani01](https://github.com/Sayantani01) |

---

## 📄 License

This project is open source under the [MIT License](LICENSE).

---

## 🌐 Live Demo

👉 [exam-guard-blue.vercel.app](https://exam-guard-blue.vercel.app)

---

> If you find this project useful, consider giving it a ⭐ on GitHub!
