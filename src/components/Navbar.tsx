// src/components/Navbar.tsx
import { Shield, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import SignIn from "./SignIn";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [user, setUser] = useState<any>(null);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
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

            {/* Desktop buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {!user ? (
                <button
                  onClick={() => setShowSignIn(true)}
                  className="text-white/80 hover:text-white transition-colors px-3 py-2"
                >
                  Sign In
                </button>
              ) : (
                <div className="flex items-center space-x-3">
                  {user.photoURL && (
                    <img
                      src={user.photoURL}
                      alt="User Avatar"
                      className="w-8 h-8 rounded-full border border-white/30"
                    />
                  )}
                  <span className="text-white font-medium">
                    {user.displayName || user.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="text-white/70 hover:text-red-400 transition-colors px-3 py-2"
                  >
                    Sign Out
                  </button>
                </div>
              )}

              <button
                onClick={() => scrollToSection("contact")}
                className="bg-[#3b82f6] text-white px-6 py-2 rounded-full hover:bg-[#2563eb] transition-all duration-300 transform hover:scale-105 font-medium"
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
            <div className="md:hidden py-4 space-y-3 animate-fadeIn">
              {!user ? (
                <button
                  onClick={() => setShowSignIn(true)}
                  className="block w-full text-left text-white/80 hover:text-white transition-colors px-3 py-2"
                >
                  Sign In
                </button>
              ) : (
                <div className="px-3 space-y-2">
                  {user.photoURL && (
                    <img
                      src={user.photoURL}
                      alt="User Avatar"
                      className="w-10 h-10 rounded-full border border-white/30"
                    />
                  )}
                  <span className="block text-white">
                    {user.displayName || user.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left text-red-400 hover:text-red-300 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}

              <button
                onClick={() => scrollToSection("contact")}
                className="block w-full bg-[#3b82f6] text-white px-6 py-2 rounded-full hover:bg-[#2563eb] transition-colors font-medium"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Sign-In Modal */}
      {showSignIn && <SignIn onClose={() => setShowSignIn(false)} />}
    </>
  );
}
