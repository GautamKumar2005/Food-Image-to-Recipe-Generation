"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Utensils, Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, Sparkles } from "lucide-react";
import axios from "axios";

export default function AuthPage() {
  const { data: session, status } = useSession();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

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
          // Use window.location.replace for a robust redirect that ensures 
          // session cookies are properly picked up by the browser on HF.
          window.location.replace("/");
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
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden selection:bg-orange-500/30 selection:text-orange-200">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 -left-20 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] animate-pulse"/>
      <div className="absolute bottom-0 -right-20 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse delay-700"/>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none"/>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-slate-900/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] p-10 relative z-10 border border-slate-800"
      >
        <div className="text-center mb-10">
          <div className="relative inline-block">
             <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(249,115,22,0.4)] rotate-3 hover:rotate-0 transition-transform duration-500">
               <Utensils className="text-white w-8 h-8"/>
             </div>
             <Sparkles className="absolute -top-2 -right-2 text-orange-400 w-5 h-5 animate-bounce" />
          </div>
          
          <h1 className="text-4xl font-black tracking-tighter text-white mb-2">
            {isLogin ? "Welcome Back" : "Start Journey"}
          </h1>
          <p className="text-slate-400 font-bold text-sm tracking-tight opacity-80 uppercase tracking-[0.1em]">
            {isLogin ? "Access your digital kitchen" : "Join the AI culinary elite"}
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-4 rounded-2xl text-xs font-black mb-6 text-center border ${error.includes("created") ? "bg-green-500/10 border-green-500/50 text-green-400" : "bg-red-500/10 border-red-500/50 text-red-400"}`}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="name"
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="relative"
              >
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 z-20">
                  <User className="w-5 h-5"/>
                </div>
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  className="w-full pl-12 pr-6 py-4 bg-slate-950/50 border border-slate-800 focus:border-orange-500 text-white rounded-2xl outline-none transition-all font-bold placeholder:text-slate-600 placeholder:font-medium"
                  value={formData.name}
                  suppressHydrationWarning
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 z-20">
              <Mail className="w-5 h-5"/>
            </div>
            <input
              type="email"
              placeholder="Email Address"
              required
              className="w-full pl-12 pr-6 py-4 bg-slate-950/50 border border-slate-800 focus:border-orange-500 text-white rounded-2xl outline-none transition-all font-bold placeholder:text-slate-600 placeholder:font-medium"
              value={formData.email}
              suppressHydrationWarning
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 z-20">
              <Lock className="w-5 h-5"/>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Secure Password"
              required
              className="w-full pl-12 pr-14 py-4 bg-slate-950/50 border border-slate-800 focus:border-orange-500 text-white rounded-2xl outline-none transition-all font-bold placeholder:text-slate-600 placeholder:font-medium"
              value={formData.password}
              suppressHydrationWarning
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-orange-500 transition-colors focus:outline-none z-20"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-orange-500/20"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin"/>
            ) : (
              <>
                {isLogin ? "Sign In" : "Explore"}
                <ArrowRight className="w-5 h-5"/>
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-slate-800 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(""); }}
            className="text-slate-500 hover:text-orange-400 font-bold transition-all text-xs uppercase tracking-widest"
          >
            {isLogin ? (
                <>New to CuisineAI? <span className="text-orange-500 underline decoration-orange-500/30 underline-offset-4">Join Now</span></>
            ) : (
                <>Already a member? <span className="text-orange-500 underline decoration-orange-500/30 underline-offset-4">Log In</span></>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
