# 📚 ExamGuard — Smart AI-Powered Proctoring System

ExamGuard is an intelligent online-proctoring web application designed to ensure fair examinations using real-time face detection, eye-tracking, behavioral monitoring, and automated alerts.  
Built with **React**, **TypeScript**, **TensorFlow.js**, **MediaPipe**, and **Firebase**, ExamGuard offers a seamless, secure, and efficient proctoring experience.

---

## 🚀 Features

### 🎥 Real-Time Monitoring
- Live webcam streaming  
- Face detection  
- Multiple face detection  
- No-face detection  
- Eye-tracking (Mediapipe Iris)  
- Look-away detection  
- Suspicious behavior tracking  

### ⚠️ Automated Alerts
- Looks away from screen  
- No face detected  
- Multiple faces  
- Mouth opening (talking detection)  
- Frequent head movement  
- Mobile usage (if model enabled)

All alerts are logged and stored in the database with timestamps.

### 📊 Student Behavior Analytics
- Total alerts  
- Look-away count  
- No-face occurrences  
- Multiple-face alerts  
- Mouth-open frequency  
- Overall exam integrity score  

### ☁️ Cloud Integration (Firebase)
- Authentication  
- Firestore logging  
- Realtime updates  
- Secure user session handling  

### 💻 Modern Web Tech
- React + TypeScript  
- Vite bundler  
- TensorFlow.js models  
- MediaPipe FaceMesh & Iris  
- Hot reloading  
- Modular architecture  

---

## 🛠️ Tech Stack

**Frontend:**  
React • TypeScript • TailwindCSS • Vite

**AI / ML:**  
TensorFlow.js • MediaPipe FaceMesh • BlazeFace • Iris Tracking

**Backend:**  
Firebase Authentication • Firestore Database

**Build Tools:**  
ESLint • Prettier • Vite

---

## 📦 Installation

```bash
git clone https://github.com/<your-username>/ExamGuard.git
cd ExamGuard
npm install
npm install firebase
npm install react router dom
npm install @tensorflow/tfjs @tensorflow-models/blazeface @tensorflow-models/face-landmarks-detection @tensorflow-models/coco-ssd firebase
npm run dev
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
   - Access the webcam  
   - Run live AI-based proctoring  
   - Detect suspicious behavior  
   - Log alerts to Firebase  
5. End the exam to review the generated report.

---

## 🧭 Roadmap

- [ ] Add audio classification for noise detection  
- [ ] Teacher dashboard for monitoring multiple students  
- [ ] Complete exam-session report generation  
- [ ] Integration of head pose estimation  
- [ ] Add video recording & playback  
- [ ] Mobile version compatibility  

---

## 🤝 Contributors

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/S0hini">
        <img src="https://avatars.githubusercontent.com/u/127102875" width="100px;" alt=""/>
        <br /><sub><b>Sohini</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/Sayantani01">
        <img src="https://avatars.githubusercontent.com/u/143098994" width="100px;" alt=""/>
        <br /><sub><b>Sayantani</b></sub>
      </a>
    </td>
  </tr>
</table>

---

## 📄 License

This project is **Open Source** under the **MIT License**

---

## ⭐ Support This Project

If you like this project, consider giving it a **⭐ star** on GitHub!
