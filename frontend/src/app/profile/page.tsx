"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { motion } from "framer-motion";
import { User, Key, Mail, Calendar, ShieldCheck, ArrowLeft, Loader2, CheckCircle, Github, Linkedin } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage({ text: "Passwords do not match", type: "error" });
      return;
    }
    setLoading(true);
    try {
      await axios.patch("/api/user/update-password", { password });
      setMessage({ text: "Password updated successfully!", type: "success" });
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || "Failed to update", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <h2 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Access Restricted</h2>
        <p className="text-slate-400 text-xs font-bold mb-6 uppercase tracking-widest">Please sign in to manage your profile</p>
        <Link href="/" className="bg-orange-500 text-white px-8 py-3 rounded-2xl font-black shadow-lg">Return to Lab</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans">
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tight text-slate-900">
            Cuisine<span className="text-orange-500">AI</span>
          </Link>
          <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-orange-500 transition-all flex items-center gap-2">
            <ArrowLeft className="w-3 h-3" /> Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-28 pb-12">
        <div className="grid md:grid-cols-12 gap-8 items-start">
          
          {/* User Status Card */}
          <div className="md:col-span-5 space-y-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-orange-500" />
                <div className="w-20 h-20 bg-orange-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-orange-50">
                    <User className="text-orange-500 w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{session.user?.name || "Neural User"}</h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 italic">Verified Gourmet Creator</p>
                
                <div className="mt-10 space-y-4 text-left border-t border-slate-50 pt-8">
                   <div className="flex items-center gap-4 text-slate-600">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                         <Mail className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Email Address</span>
                         <span className="text-xs font-bold text-slate-900">{session.user?.email}</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-4 text-slate-600">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                         <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Neural Link Date</span>
                         <span className="text-xs font-bold text-slate-900">April 2026</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-4 text-slate-600">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                         <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Security Status</span>
                         <span className="text-xs font-bold text-green-600">Encrypted Lab Access</span>
                      </div>
                   </div>
                </div>
            </motion.div>
          </div>

          {/* Security Management Form */}
          <div className="md:col-span-7">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-8 md:p-12 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100">
               <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                     <Key className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Security Protocol</h3>
               </div>

               <form onSubmit={handleUpdatePassword} className="space-y-6">
                   <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">New Access Key</label>
                       <input 
                         type="password" 
                         value={password}
                         onChange={(e) => setPassword(e.target.value)}
                         placeholder="••••••••"
                         required
                         className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all text-sm font-bold"
                       />
                   </div>
                   <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Verify Protocol</label>
                       <input 
                         type="password" 
                         value={confirmPassword}
                         onChange={(e) => setConfirmPassword(e.target.value)}
                         placeholder="••••••••"
                         required
                         className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all text-sm font-bold"
                       />
                   </div>

                   {message.text && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold uppercase tracking-widest ${message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                         {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                         {message.text}
                      </motion.div>
                   )}

                   <button 
                     disabled={loading}
                     className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-xl shadow-slate-900/10 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                   >
                     {loading ? <Loader2 className="w-4 h-4 animate-spin text-orange-500" /> : "Update Credentials"}
                   </button>
               </form>
            </motion.div>
          </div>
        </div>
      </main>

      <footer className="bg-[#0f172a] text-slate-400 min-h-[320px] md:min-h-[240px] flex flex-col justify-center items-center px-6 py-12 md:py-16 mt-24 relative border-t border-white/5 overflow-hidden">
        <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-orange-500/5 rounded-full blur-[100px] pointer-events-none"/>
        <div className="absolute bottom-[-100px] left-[-100px] w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"/>

        <div className="max-w-4xl w-full relative z-10 text-center flex flex-col items-center gap-6">
          <div className="space-y-3">
            <Link href="/" className="text-4xl font-black text-white tracking-tighter inline-block hover:opacity-80 transition-opacity">
              Cuisine<span className="text-orange-500">AI</span>
            </Link>
            <p className="text-[13px] leading-relaxed opacity-40 font-medium italic max-w-2xl mx-auto px-4 md:px-8">
              Turning every culinary vision into a data-driven discovery. Our advanced neural synthesis platform decodes dish complexity with surgical precision.
            </p>
          </div>

          <div className="flex gap-6 items-center justify-center py-2">
            <a href="https://github.com/GautamKumar2005/" target="_blank" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all ring-1 ring-white/10 group">
              <Github className="w-5 h-5 group-hover:scale-110 transition-transform"/>
            </a>
            <a href="https://www.linkedin.com/in/gautam-kumar-489903281/" target="_blank" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all ring-1 ring-white/10 group">
              <Linkedin className="w-5 h-5 group-hover:scale-110 transition-transform"/>
            </a>
          </div>

          <div className="w-full flex flex-col items-center gap-2">
            <p className="text-[13px] font-black uppercase tracking-[0.4em] text-white/40 leading-none">
              MADE BY <span className="text-orange-500">GAUTAM KUMAR</span>
            </p>
            <p className="text-[10px] font-bold opacity-10 uppercase tracking-[0.3em] text-center">
              © 2024 NEURAL GASTRONOMY LABS • ALL RIGHTS RESERVED
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
