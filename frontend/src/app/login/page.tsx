"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Utensils, Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import axios from "axios";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        const res = await signIn("credentials", {
          redirect: false,
          email: formData.email,
          password: formData.password,
        });

        if (res?.error) {
          setError("Invalid email or password");
        } else {
          router.push("/");
          router.refresh();
        }
      } else {
        await axios.post("/api/register", formData);
        setIsLogin(true);
        setError("Account created! Please sign in.");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"/>
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-700"/>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 p-10 relative z-10 border border-slate-100"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/30 rotate-6">
            <Utensils className="text-white w-8 h-8"/>
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-slate-400 mt-2 font-medium">
            {isLogin ? "Continue your AI culinary journey" : "Join the world's most intelligent kitchen"}
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-4 rounded-2xl text-sm font-bold mb-6 text-center ${error.includes("created") ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="name"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="relative"
              >
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <User className="w-5 h-5"/>
                </span>
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-transparent focus:border-orange-500/50 focus:bg-white rounded-2xl outline-none transition-all font-semibold"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Mail className="w-5 h-5"/>
            </span>
            <input
              type="email"
              placeholder="Email Address"
              required
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-transparent focus:border-orange-500/50 focus:bg-white rounded-2xl outline-none transition-all font-semibold"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Lock className="w-5 h-5"/>
            </span>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
              className="w-full pl-12 pr-14 py-4 bg-slate-50 border border-transparent focus:border-orange-500/50 focus:bg-white rounded-2xl outline-none transition-all font-semibold"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-500 transition-colors focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin"/>
            ) : (
              <>
                {isLogin ? "Sign In" : "Get Started"}
                <ArrowRight className="w-5 h-5"/>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(""); }}
            className="text-slate-400 hover:text-orange-500 font-bold transition-all text-sm"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
