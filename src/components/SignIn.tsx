// src/components/SignIn.tsx
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useState } from "react";

interface SignInProps {
  onClose: () => void;
}

export default function SignIn({ onClose }: SignInProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#0a1736] text-white rounded-2xl p-6 w-[90%] max-w-md shadow-xl">
        <h2 className="text-2xl font-semibold mb-4 text-center">Sign In</h2>

        <button
          onClick={handleGoogleSignIn}
          className="w-full bg-white text-black py-2 rounded-lg font-medium hover:bg-gray-200 transition mb-4"
        >
          Sign in with Google
        </button>

        <form onSubmit={handleEmailSignIn} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-md bg-[#142b5b] border border-white/20 focus:outline-none focus:border-[#3b82f6]"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-md bg-[#142b5b] border border-white/20 focus:outline-none focus:border-[#3b82f6]"
          />
          <button
            type="submit"
            className="w-full bg-[#3b82f6] hover:bg-[#2563eb] transition text-white font-semibold py-2 rounded-lg"
          >
            Sign In with Email
          </button>
        </form>

        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

        <button
          onClick={onClose}
          className="mt-4 w-full text-white/60 hover:text-white text-sm underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
