// src/components/Navbar.tsx
import { Shield, Menu, X, User } from "lucide-react";
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
      if (currentUser?.photoURL) {
        console.log("✅ User logged in with photo:", currentUser.photoURL);
      }
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
                  {/* Profile Picture */}
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Profile"
                      className="w-8 h-8 rounded-full border-2 border-white/30 object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        console.log("Image load error, hiding image");
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#2563eb] border-2 border-white/30 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <span className="text-white font-medium">
                    {user.displayName || user.email?.split('@')[0] || 'User'}
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
                  <div className="flex items-center space-x-3">
                    {/* Profile Picture Mobile */}
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Profile"
                        className="w-10 h-10 rounded-full border-2 border-white/30 object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#2563eb] border-2 border-white/30 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                    
                    <span className="block text-white font-medium">
                      {user.displayName || user.email?.split('@')[0] || 'User'}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left text-red-400 hover:text-red-300 transition-colors py-2"
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