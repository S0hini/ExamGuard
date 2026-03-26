import { Shield, Menu, X, User } from "lucide-react";
import { useState, useEffect } from "react";
import SignIn from "./SignIn";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a1736]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => scrollToSection("hero")}
            >
              <Shield className="w-8 h-8 text-[#3b82f6]" />
              <span className="text-xl font-bold text-white">ExamGuard</span>
            </div>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center space-x-1">
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="text-white/70 hover:text-white transition-colors px-3 py-2 text-sm"
              >
                How it works
              </button>
              <button
                onClick={() => scrollToSection("research")}
                className="text-white/70 hover:text-white transition-colors px-3 py-2 text-sm"
              >
                Research
              </button>
              <button
                onClick={() => scrollToSection("tech")}
                className="text-white/70 hover:text-white transition-colors px-3 py-2 text-sm"
              >
                Tech deep dive
              </button>

              <div className="w-px h-5 bg-white/20 mx-2" />

              {!user ? (
                <button
                  onClick={() => setShowSignIn(true)}
                  className="text-white/80 hover:text-white transition-colors px-3 py-2 text-sm"
                >
                  Sign In
                </button>
              ) : (
                <div className="flex items-center space-x-3">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Profile"
                      className="w-8 h-8 rounded-full border-2 border-white/30 object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#2563eb] border-2 border-white/30 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <span className="text-white text-sm font-medium">
                    {user.displayName || user.email?.split("@")[0] || "User"}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="text-white/70 hover:text-red-400 transition-colors px-3 py-2 text-sm"
                  >
                    Sign Out
                  </button>
                </div>
              )}

              <a
                href="https://github.com/S0hini"
                target="_blank"
                rel="noreferrer"
                className="text-white/70 hover:text-white transition-colors px-3 py-2 text-sm flex items-center gap-1"
              >
                GitHub →
              </a>

              <button
                onClick={() => navigate("/camera")}
                className="bg-[#3b82f6] text-white px-5 py-2 rounded-full hover:bg-[#2563eb] transition-all duration-300 transform hover:scale-105 font-medium text-sm ml-2"
              >
                Get Started
              </button>
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-white p-2"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="md:hidden py-4 space-y-1 animate-fadeIn border-t border-white/10">
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="block w-full text-left text-white/80 hover:text-white transition-colors px-3 py-2 text-sm"
              >
                How it works
              </button>
              <button
                onClick={() => scrollToSection("research")}
                className="block w-full text-left text-white/80 hover:text-white transition-colors px-3 py-2 text-sm"
              >
                Research
              </button>
              <button
                onClick={() => scrollToSection("tech")}
                className="block w-full text-left text-white/80 hover:text-white transition-colors px-3 py-2 text-sm"
              >
                Tech deep dive
              </button>
              <a
                href="https://github.com/S0hini/ExamGuard"
                target="_blank"
                rel="noreferrer"
                className="block w-full text-left text-white/80 hover:text-white transition-colors px-3 py-2 text-sm"
              >
                GitHub →
              </a>

              <div className="pt-2 border-t border-white/10">
                {!user ? (
                  <button
                    onClick={() => setShowSignIn(true)}
                    className="block w-full text-left text-white/80 hover:text-white transition-colors px-3 py-2 text-sm"
                  >
                    Sign In
                  </button>
                ) : (
                  <div className="px-3 space-y-2">
                    <div className="flex items-center space-x-3">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt="Profile"
                          className="w-9 h-9 rounded-full border-2 border-white/30 object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#2563eb] border-2 border-white/30 flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <span className="text-white text-sm font-medium">
                        {user.displayName || user.email?.split("@")[0] || "User"}
                      </span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left text-red-400 hover:text-red-300 transition-colors py-2 text-sm"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => navigate("/camera")}
                className="block w-full bg-[#3b82f6] text-white px-6 py-2 rounded-full hover:bg-[#2563eb] transition-colors font-medium text-sm mt-2"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </nav>

      {showSignIn && <SignIn onClose={() => setShowSignIn(false)} />}
    </>
  );
}