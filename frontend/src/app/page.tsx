"use client";

import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { Upload, ChevronRight, Utensils, BookOpen, Linkedin, Github, ArrowLeft, Play, Loader2, Share2, User, Settings, Check, Sparkles, Menu, X as CloseIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function Dashboard() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isHistoryView, setIsHistoryView] = useState(false);
  
  const [currentStepIndex, setCurrentStepIndex] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const copyShareLink = async (id: string) => {
    const url = `${window.location.origin}/?historyId=${id}`;
    await navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const speakStep = (index: number) => {
    if (!result || !result.recipe) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(result.recipe[index]);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      setCurrentStepIndex(index);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentStepIndex(null);
    };
    window.speechSynthesis.speak(utterance);
  };

  const startAutomatedGuide = async () => {
    if (!result || !result.recipe) return;
    
    for (let i = 0; i < result.recipe.length; i++) {
        setCurrentStepIndex(i);
        const utterance = new SpeechSynthesisUtterance(`Step ${i + 1}: ${result.recipe[i]}`);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        
        const speakPromise = new Promise((resolve) => {
            utterance.onend = resolve;
            utterance.onerror = resolve;
        });

        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
        await speakPromise;
    }
    setIsSpeaking(false);
    setCurrentStepIndex(null);
  };

  const stopVoiceAssistant = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setCurrentStepIndex(null);
  };

  useEffect(() => {
    const historyId = searchParams.get("historyId");
    if (historyId) {
      setLoading(true);
      setIsHistoryView(true);
      axios.get(`/api/history/${historyId}`)
        .then(res => {
          setResult(res.data);
          setPreview(res.data.imageUrl);
        })
        .catch(err => console.error("Error loading history", err))
        .finally(() => setLoading(false));
    } else {
      setIsHistoryView(false);
    }
  }, [searchParams]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handlePredict = async () => {
    if (!image) return;
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("imagefile", image);

    try {
      const res = await axios.post("/api/predict", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      if (session) {
        const historyData = {
          ...res.data,
          imageUrl: res.data.imageUrl
        };
        // Save and get the persistent ID
        const savedHistory = await axios.post("/api/history", historyData);
        setResult(savedHistory.data);
      } else {
        // Guest user mode - result has no persistent ID for sharing
        setResult(res.data);
      }
    } catch (error) {
      console.error(error);
      alert("Error generating recipe. Please check your backend.");
    } finally {
      setLoading(false);
    }
  };

  const [showMoreAbout, setShowMoreAbout] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans selection:bg-orange-100 selection:text-orange-600">
      <nav className="fixed top-0 w-full z-[100] bg-white/90 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl md:text-2xl font-black tracking-tight cursor-pointer hover:opacity-80 transition-opacity z-[110]">
            <span className="text-orange-500">Cuisine</span>AI
          </Link>
          
          <div className="hidden md:flex items-center gap-6 lg:gap-8 font-bold text-slate-800 text-sm">
            <Link href="/history" className="hover:text-orange-500 transition-colors">History</Link>
            {session ? (
                <div className="flex items-center gap-3">
                    <Link href="/profile" className="flex items-center gap-2 bg-orange-50 border border-orange-200/50 px-3 py-1.5 rounded-2xl hover:bg-orange-100 hover:shadow-md transition-all group">
                        <div className="w-7 h-7 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-xs shadow-md shadow-orange-500/30">
                            {session.user?.name?.charAt(0).toUpperCase() || <User className="w-3.5 h-3.5" />}
                        </div>
                        <div className="hidden lg:flex flex-col">
                            <span className="text-[9px] uppercase tracking-widest font-black text-orange-400">Signed in as</span>
                            <span className="text-xs font-black text-slate-900 leading-tight max-w-[100px] truncate">{session.user?.name || session.user?.email}</span>
                        </div>
                    </Link>
                    <button onClick={() => signOut()} className="bg-slate-900 text-white px-5 py-2 rounded-2xl text-[10px] uppercase font-black tracking-widest hover:bg-slate-800 transition-colors border border-transparent active:scale-95">Logout</button>
                </div>
            ) : (
                <button onClick={() => signIn()} className="bg-orange-500 text-white px-5 py-2 rounded-2xl text-[10px] uppercase font-black tracking-widest hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 active:scale-95">Sign In</button>
            )}
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-slate-800 hover:bg-slate-50 rounded-xl transition-colors z-[110]">
             {isMenuOpen ? <CloseIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
            {isMenuOpen && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute top-0 left-0 w-full bg-white border-b border-slate-200 shadow-2xl p-6 pt-20 flex flex-col gap-4 md:hidden z-[90]"
                >
                    <Link href="/history" onClick={() => setIsMenuOpen(false)} className="text-sm font-black uppercase tracking-widest text-slate-900 py-3 border-b border-slate-50">History</Link>
                    {session ? (
                        <>
                            <div className="flex items-center gap-3 py-3 border-b border-slate-50">
                                <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-orange-500/30">
                                    {session.user?.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div>
                                    <p className="text-xs text-orange-400 font-black uppercase tracking-widest">Signed in as</p>
                                    <p className="text-sm font-black text-slate-900">{session.user?.name || session.user?.email}</p>
                                </div>
                            </div>
                            <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="text-sm font-black uppercase tracking-widest text-slate-900 py-3 border-b border-slate-50">My Profile</Link>
                            <button onClick={() => { signOut(); setIsMenuOpen(false); }} className="text-sm font-black uppercase tracking-widest text-red-500 py-3 text-left">Logout</button>
                        </>
                    ) : (
                        <button onClick={() => { signIn(); setIsMenuOpen(false); }} className="bg-orange-500 text-white px-6 py-4 rounded-2xl text-xs uppercase font-black tracking-widest shadow-lg shadow-orange-500/20 mt-2">Sign In</button>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-12 overflow-x-hidden">
        {/* About Us Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 bg-white/60 backdrop-blur-xl p-6 md:p-8 lg:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-orange-500/10 shadow-2xl shadow-orange-500/5 relative overflow-hidden group w-full"
        >
          <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-orange-500/5 rounded-full blur-[80px] group-hover:bg-orange-500/10 transition-colors duration-700 pointer-events-none"/>
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start lg:items-center">
             <div className="w-full md:flex-1 space-y-4 text-center md:text-left order-2 md:order-1">
                <div className="flex items-center justify-center md:justify-start gap-3">
                   <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                      <Sparkles className="w-5 h-5" />
                   </div>
                   <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight italic">About <span className="text-orange-500">Us</span></h2>
                </div>
                
                <div className="space-y-4">
                    <p className="text-slate-600 font-bold text-sm md:text-base leading-relaxed tracking-tight max-w-full md:max-w-4xl break-words">
                      Cuisine AI is a smart food image to recipe in form of text generation platform that makes cooking simple and interactive. Users can upload or enter an image of a dish, and the system instantly generates the recipe, including ingredients and step-by-step instructions. Powered by advanced AI, it understands food visuals and converts them into easy cooking guidance. 
                    </p>
                    <AnimatePresence>
                        {showMoreAbout && (
                            <motion.p 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="text-slate-600 font-bold text-sm md:text-base leading-relaxed tracking-tight break-words overflow-hidden"
                            >
                                The platform also supports, allowing users to read and listen. Cuisine AI acts as a digital kitchen assistant, helping users discover, learn, and recreate dishes effortlessly while making the cooking experience more accessible and enjoyable.
                            </motion.p>
                        )}
                    </AnimatePresence>
                    <button 
                        onClick={() => setShowMoreAbout(!showMoreAbout)}
                        className="text-orange-500 font-black text-[10px] uppercase tracking-widest hover:underline flex items-center gap-2 mx-auto md:mx-0 p-2"
                    >
                        {showMoreAbout ? "Read Less" : "Read More Mission"} 
                        <div className={`w-4 h-4 bg-orange-100 rounded-full flex items-center justify-center transition-transform ${showMoreAbout ? 'rotate-180' : ''}`}>
                            <ArrowLeft className="w-2.5 h-2.5 -rotate-90" />
                        </div>
                    </button>
                </div>
             </div>
             
             <div className="w-full md:w-auto flex justify-center order-1 md:order-2 flex-shrink-0">
                <div className="w-32 h-32 md:w-40 lg:w-48 md:h-40 lg:h-48 rounded-3xl lg:rounded-[3rem] bg-slate-50 border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden group-hover:scale-105 transition-all duration-700 relative">
                    <img 
                      src="/chef.png" 
                      className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700" 
                      alt="The CuisineAI Chef" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"/>
                </div>
             </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Control Panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <span className="text-orange-500 uppercase tracking-widest font-black text-[10px] bg-orange-50 px-2 py-0.5 rounded-md inline-block">
                {isHistoryView ? "Stored Analysis" : "Taste with AI"}
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
                {isHistoryView ? <span>Archived Record</span> : <span>Next-Gen Recipe <br/>Synthesis</span>}
              </h1>
              <p className="text-slate-500 text-sm md:text-base leading-relaxed opacity-80 max-w-sm">
                {isHistoryView ? "Viewing your previously analyzed dish." : "Make your day exciting with bold, spicy flavors that bring every bite to life and turn every meal into a delicious adventure."}
              </p>
            </div>

            <div className={`bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 ${isHistoryView ? 'border-orange-500/30' : ''}`}>
              <div className="relative group overflow-hidden rounded-2xl border-2 border-dashed border-slate-200/80 bg-slate-50 transition-colors hover:border-orange-500/50">
                <div className={`aspect-[4/3] flex flex-col items-center justify-center`}>
                    {preview ? (
                        <img src={preview} className="w-full h-full object-cover" alt="Preview"/>
                    ) : (
                        <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full p-4 text-center">
                            <Upload className="w-10 h-10 text-slate-300 mb-3 group-hover:text-orange-500 animate-bounce transition-colors"/>
                            <p className="text-xs font-black text-slate-400 group-hover:text-orange-500 uppercase tracking-widest">Select Food Image</p>
                            <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                        </label>
                    )}
                </div>
              </div>

              {!isHistoryView ? (
                  <button 
                  onClick={handlePredict}
                  disabled={!image || loading}
                  className={`w-full mt-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${loading ? 'bg-slate-100 text-slate-300' : 'bg-orange-500 text-white hover:bg-orange-600 shadow-xl shadow-orange-500/30 active:scale-[0.98]'}`}
                >
                  {loading ? "Processing..." : (
                      <>Generate <ChevronRight className="w-4 h-4"/></>
                  )}
                </button>
              ) : (
                  <Link 
                    href="/"
                    className="w-full mt-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest bg-slate-900 text-white hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <ArrowLeft className="w-4 h-4" /> Return to Lab
                  </Link>
              )}
            </div>
          </div>

          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {loading ? (
                  <motion.div key="loading" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 text-center">
                      <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                          <div className="absolute w-10 h-10 bg-orange-500 rounded-full shadow-[0_0_30px_rgba(249,115,22,0.5)] animate-pulse"/>
                          <div className="absolute w-full h-full border-2 border-orange-500/10 rounded-full border-t-orange-500 animate-[spin_2.5s_linear_infinite]"/>
                      </div>
                      <h3 className="text-xl font-black text-slate-800">Synthesizing Recipe...</h3>
                  </motion.div>
              ) : result ? (
                  <motion.div key="result" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-6 md:p-10 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100">
                      <div className="flex items-center gap-4 mb-8 border-b border-slate-50 pb-6">
                        <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                          <Utensils className="text-orange-500 w-6 h-6"/>
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Cuisine LAB</span>
                          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">{result.title}</h2>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-12 gap-12">
                          <div className="md:col-span-4 space-y-6">
                              <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Ingredients</h4>
                              <div className="flex flex-wrap md:flex-col gap-3">
                                  {(Array.isArray(result.ingredients) ? result.ingredients : []).map((item: string, i: number) => (
                                      <div key={i} className="text-slate-600 text-xs font-bold px-4 py-3 bg-slate-50 rounded-2xl flex items-center gap-3 group transition-colors hover:bg-orange-50">
                                          <div className="w-5 h-5 rounded-lg bg-orange-500 text-white flex items-center justify-center text-[10px] font-black">✓</div>
                                          {item}
                                      </div>
                                  ))}
                              </div>
                          </div>

                          <div className="md:col-span-8 space-y-8">
                              <div className="flex items-center justify-between">
                                  <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Preparation Steps</h4>
                                  <div className="flex items-center gap-3">
                                      <button 
                                          onClick={() => copyShareLink(result._id)}
                                          className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isCopied ? 'bg-green-500 text-white shadow-xl shadow-green-500/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                      >
                                          {isCopied ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
                                          {isCopied ? "Copied" : "Share"}
                                      </button>
                                      <button 
                                          onClick={isSpeaking ? stopVoiceAssistant : startAutomatedGuide}
                                          className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isSpeaking ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/30' : 'bg-slate-900 text-white hover:bg-orange-500'}`}
                                      >
                                          {isSpeaking ? <Loader2 className="w-3 h-3 animate-spin"/> : <Play className="w-3 h-3 fill-white" />}
                                          {isSpeaking ? "Stop" : "Listen"}
                                      </button>
                                  </div>
                              </div>

                              <div className="space-y-4">
                                  {(Array.isArray(result.recipe) ? result.recipe : []).map((step: string, i: number) => (
                                      <div 
                                          key={i} 
                                          onClick={() => speakStep(i)}
                                          className={`flex gap-5 p-6 rounded-[2rem] border transition-all cursor-pointer group ${currentStepIndex === i ? 'bg-orange-50 border-orange-500 ring-4 ring-orange-500/10' : 'bg-white border-slate-100 hover:border-orange-500/50 shadow-sm'}`}
                                      >
                                          <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${currentStepIndex === i ? 'bg-orange-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400 group-hover:bg-orange-500 group-hover:text-white'}`}>{i+1}</div>
                                          <p className={`text-[15px] leading-relaxed font-bold ${currentStepIndex === i ? 'text-orange-950 underline decoration-orange-500/30 underline-offset-4' : 'text-slate-600 group-hover:text-slate-900 transition-colors'}`}>{step}</p>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </motion.div>
              ) : (
                  <div key="placeholder" className="h-full min-h-[400px] flex items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-[3rem] bg-white/40">
                       <div className="text-center opacity-40">
                          <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                          <p className="text-slate-500 font-black text-xs uppercase tracking-[0.2em]">Ready for Analysis</p>
                       </div>
                  </div>
              )}
            </AnimatePresence>
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

export default function Home() {
    return (
        <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center font-black text-orange-500 tracking-widest uppercase text-xs animate-pulse">CuisineAI Is Loading...</div>}>
            <Dashboard />
        </Suspense>
    )
}
