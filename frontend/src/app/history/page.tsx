"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Utensils, Calendar, ChevronRight, ArrowLeft, Loader2, SearchX, Github, Linkedin, X, Share2, Check, User } from "lucide-react";
import Link from "next/link";

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyShareLink = async (id: string) => {
    const url = `${window.location.origin}/?historyId=${id}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    if (session) {
      axios.get("/api/history")
        .then(res => setHistory(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [session, status]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-slate-200/50">
          <Utensils className="w-8 h-8 text-slate-300" />
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">Private History</h2>
        <p className="text-slate-500 mb-6 max-w-xs text-sm">Please sign in to revisit your culinary deconstructions and recipes.</p>
        <Link href="/login" className="bg-orange-500 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition tracking-widest uppercase text-xs">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] px-4 md:px-6 py-12 md:py-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 pb-6 border-b border-slate-200/50">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-orange-500 font-black text-[10px] mb-4 transition-all uppercase tracking-widest">
              <ArrowLeft className="w-3 h-3" /> Dashboard
            </Link>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-none">Your <span className="text-orange-500">History</span></h1>
            <p className="text-slate-500 mt-2 text-sm font-bold opacity-60">Revisit your past deconstructions ({history.length} records).</p>
          </div>
        </div>

        {history.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((item, i) => (
              <motion.div 
                key={item._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group relative bg-white rounded-3xl overflow-hidden shadow-lg shadow-slate-200/40 border border-slate-100 flex flex-col hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300"
              >
                <div className="aspect-[16/10] relative overflow-hidden">
                  <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/30">
                    Recipe
                  </div>
                  <button 
                    onClick={async (e) => {
                        e.preventDefault();
                        if (confirm("Permanently delete this culinary record?")) {
                            await axios.delete(`/api/history/${item._id}`);
                            setHistory(prev => prev.filter(h => h._id !== item._id));
                        }
                    }}
                    className="absolute top-3 right-3 bg-red-500/80 backdrop-blur-md text-white hover:bg-red-600 transition-all w-8 h-8 rounded-xl flex items-center justify-center shadow-lg border border-white/20 z-10 active:scale-90"
                    title="Delete History"
                  >
                    <X className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
                
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black mb-2 uppercase tracking-widest opacity-60">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                  
                  <h3 className="text-xl font-black text-slate-900 mb-4 tracking-tight group-hover:text-orange-500 transition-colors">{item.title}</h3>
                  
                  <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <button 
                            onClick={() => copyShareLink(item._id)}
                            className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter transition-all ${copiedId === item._id ? 'text-green-500' : 'text-slate-400 hover:text-orange-500'}`}
                          >
                            {copiedId === item._id ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
                            {copiedId === item._id ? "Copied" : "Share"}
                          </button>
                          <Link 
                            href={`/?historyId=${item._id}`}
                            className="text-orange-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all border-l border-slate-100 pl-3"
                          >
                            Details <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                      </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
            <SearchX className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-black text-slate-900 mb-1">Archive Empty</h3>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No past analysis found</p>
          </div>
        )}
      </div>

      <footer className="bg-[#0f172a] text-slate-400 h-[240px] flex flex-col justify-center items-center px-6 mt-16 relative border-t border-white/5 overflow-hidden">
        {/* Subtle Decorative Orbs */}
        <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-orange-500/5 rounded-full blur-[100px] pointer-events-none"/>
        <div className="absolute bottom-[-100px] left-[-100px] w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"/>

        <div className="max-w-4xl w-full relative z-10 text-center flex flex-col items-center gap-5">
          <div className="space-y-2">
            <Link href="/" className="text-4xl font-black text-white tracking-tighter inline-block">
              Cuisine<span className="text-orange-500">AI</span>
            </Link>
            <p className="text-[13px] leading-relaxed opacity-40 font-medium italic max-w-2xl mx-auto px-8">
              Turning every culinary vision into a data-driven discovery. Our advanced neural synthesis platform decodes dish complexity with surgical precision.
            </p>
          </div>

          <div className="flex gap-5 items-center justify-center py-1">
            <a href="https://github.com/GautamKumar2005/" target="_blank" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all ring-1 ring-white/10 group">
              <Github className="w-5 h-5 group-hover:scale-110 transition-transform"/>
            </a>
            <a href="https://www.linkedin.com/in/gautam-kumar-489903281/" target="_blank" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all ring-1 ring-white/10 group">
              <Linkedin className="w-5 h-5 group-hover:scale-110 transition-transform"/>
            </a>
          </div>

          <div className="w-full flex flex-col items-center gap-1.5">
            <p className="text-[13px] font-black uppercase tracking-[0.4em] text-white/40 leading-none">
              MADE BY <span className="text-orange-500">GAUTAM KUMAR</span>
            </p>
            <p className="text-[9px] font-bold opacity-10 uppercase tracking-[0.3em]">
              © 2024 NEURAL GASTRONOMY LABS • ALL RIGHTS RESERVED
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
