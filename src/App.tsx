import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { db } from "./firebase";
console.log("Firebase connected:", db);

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
//import Features from "./components/Features";
import Research from "./components/Research";
import TechDeepDive from "./components/TechDeepDive";
//import Contact from "./components/Contact";
import Footer from "./components/Footer";
import CameraPage from "./components/CameraPage";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-[#0a1736] via-[#1b2e5a] to-[#0a1736]">
        <Navbar />
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Hero />
                <HowItWorks />
                
                <Research />
                <TechDeepDive />
                
                <Footer />
              </>
            }
          />
          <Route path="/camera" element={<CameraPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;