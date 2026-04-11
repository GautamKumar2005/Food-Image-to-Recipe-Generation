"use client";

import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { Upload, ChevronRight, Utensils, BookOpen, Linkedin, Github, ArrowLeft, Play, Loader2, Share2, User, Settings, Check, Sparkles, Menu, X as CloseIcon, ImageIcon, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// ─── Sample food images available in /public/samples/ ───────────────────────
const SAMPLE_IMAGES = [
  { src: "/samples/burger.jpg",                   label: "Burger" },
  { src: "/samples/chocolate-cake.jpg",           label: "Chocolate Cake" },
  { src: "/samples/pizaa.jpg",                    label: "Pizza" },
  { src: "/samples/momo.jpg",                     label: "Momo" },
  { src: "/samples/Biryani_2.jpg",                label: "Biryani" },
  { src: "/samples/Aloo_Paratha_2.jpg",           label: "Aloo Paratha" },
  { src: "/samples/Boiled_Egg_1.jpg",             label: "Boiled Egg" },
  { src: "/samples/Samosa_3.jpg",                 label: "Samosa" },
  { src: "/samples/Masala_Pasta_1.jpg",           label: "Masala Pasta" },
  { src: "/samples/salom.jpg",                    label: "Salmon" },
  { src: "/samples/17tootired-grilled-cheese-mediumSquareAt3X.jpg", label: "Grilled Cheese" },
  { src: "/samples/EXPS_TOHD24_167133_SarahTramonte_6.jpg",         label: "Dish" },
  { src: "/samples/t.jpg",                        label: "Food Dish" },
];

// ─── Types ───────────────────────────────────────────────────────────────────
interface Recipe {
  title: string;
  ingredients: string[];
  recipe: string[];
}

interface PredictResult extends Recipe {
  _id?: string;
  imageUrl?: string;
  recipes?: Recipe[];   // ← all predictions from the model
}

function Dashboard() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictResult | null>(null);
  const [isHistoryView, setIsHistoryView] = useState(false);

  // Multi-recipe tab state
  const [activeRecipeIdx, setActiveRecipeIdx] = useState(0);

  const [currentStepIndex, setCurrentStepIndex] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showMoreAbout, setShowMoreAbout] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Sample image strip scroll
  const [sampleScrollIdx, setSampleScrollIdx] = useState(0);
  const SAMPLES_PER_PAGE = 5;

  const copyShareLink = async (id: string) => {
    const url = `${window.location.origin}/?historyId=${id}`;
    await navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Active recipe based on selected tab
  const activeRecipes: Recipe[] = result?.recipes && result.recipes.length > 0
    ? result.recipes
    : result ? [{ title: result.title, ingredients: result.ingredients, recipe: result.recipe }] : [];
  const activeRecipe: Recipe | null = activeRecipes[activeRecipeIdx] ?? null;

  const speakStep = (index: number) => {
    if (!activeRecipe) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(activeRecipe.recipe[index]);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.onstart = () => { setIsSpeaking(true); setCurrentStepIndex(index); };
    utterance.onend = () => { setIsSpeaking(false); setCurrentStepIndex(null); };
    window.speechSynthesis.speak(utterance);
  };

  const startAutomatedGuide = async () => {
    if (!activeRecipe) return;
    for (let i = 0; i < activeRecipe.recipe.length; i++) {
      setCurrentStepIndex(i);
      const utterance = new SpeechSynthesisUtterance(`Step ${i + 1}: ${activeRecipe.recipe[i]}`);
      utterance.lang = "en-US";
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
        .then(res => { setResult(res.data); setPreview(res.data.imageUrl); setActiveRecipeIdx(0); })
        .catch(err => console.error("Error loading history", err))
        .finally(() => setLoading(false));
    } else {
      setIsHistoryView(false);
    }
  }, [searchParams]);

  // Reset tab when new result arrives
  useEffect(() => { setActiveRecipeIdx(0); }, [result]);
  // Stop voice when switching tabs
  useEffect(() => { stopVoiceAssistant(); setCurrentStepIndex(null); }, [activeRecipeIdx]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
    }
  };

  // Load a sample image by URL (fetch → File object)
  const handleSampleClick = async (src: string, label: string) => {
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const ext = src.split(".").pop() || "jpg";
      const file = new File([blob], `${label}.${ext}`, { type: blob.type });
      setImage(file);
      setPreview(src);
      setResult(null);
    } catch (e) {
      console.error("Could not load sample image", e);
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
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 180000 // 3 minutes for slow CPU inference
      });

      if (session) {
        const historyData = { ...res.data, imageUrl: res.data.imageUrl };
        const savedHistory = await axios.post("/api/history", historyData);
        setResult(savedHistory.data);
      } else {
        setResult(res.data);
      }
    } catch (error) {
      console.error(error);
      alert("Error generating recipe. Please check your backend.");
    } finally {
      setLoading(false);
    }
  };

  const visibleSamples = SAMPLE_IMAGES.slice(
    sampleScrollIdx,
    sampleScrollIdx + SAMPLES_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans selection:bg-orange-100 selection:text-orange-600">
      {/* ── NAV ─────────────────────────────────────────────────────────── */}
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
                <button onClick={() => signOut()} className="bg-slate-900 text-white px-5 py-2 rounded-2xl text-[10px] uppercase font-black tracking-widest hover:bg-slate-800 transition-colors active:scale-95">Logout</button>
              </div>
            ) : (
              <button onClick={() => signIn()} className="bg-orange-500 text-white px-5 py-2 rounded-2xl text-[10px] uppercase font-black tracking-widest hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 active:scale-95">Sign In</button>
            )}
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-slate-800 hover:bg-slate-50 rounded-xl transition-colors z-[110]">
            {isMenuOpen ? <CloseIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="absolute top-0 left-0 w-full bg-white border-b border-slate-200 shadow-2xl p-6 pt-20 flex flex-col gap-4 md:hidden z-[90]"
            >
              <Link href="/history" onClick={() => setIsMenuOpen(false)} className="text-sm font-black uppercase tracking-widest text-slate-900 py-3 border-b border-slate-50">History</Link>
              {session ? (
                <>
                  <div className="flex items-center gap-3 py-3 border-b border-slate-50">
                    <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-orange-500/30">
                      {session.user?.name?.charAt(0).toUpperCase() || "?"}
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

        {/* ── ABOUT US ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="mb-12 bg-white/60 backdrop-blur-xl p-6 md:p-8 lg:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-orange-500/10 shadow-2xl shadow-orange-500/5 relative overflow-hidden group w-full"
        >
          <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-orange-500/5 rounded-full blur-[80px] group-hover:bg-orange-500/10 transition-colors duration-700 pointer-events-none" />
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
                  Cuisine AI is a smart food image to recipe generation platform that makes cooking simple and interactive. Upload a dish image and the AI instantly generates <strong>multiple recipe predictions</strong> — including ingredients and step-by-step instructions — powered by advanced deep learning.
                </p>
                <AnimatePresence>
                  {showMoreAbout && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="text-slate-600 font-bold text-sm md:text-base leading-relaxed tracking-tight break-words overflow-hidden"
                    >
                      The platform supports voice-guided cooking steps, result sharing, history tracking and now shows all recipe variations the model predicts — letting you pick the one that matches best. Cuisine AI acts as a digital kitchen assistant, helping users discover, learn, and recreate dishes effortlessly.
                    </motion.p>
                  )}
                </AnimatePresence>
                <button
                  onClick={() => setShowMoreAbout(!showMoreAbout)}
                  className="text-orange-500 font-black text-[10px] uppercase tracking-widest hover:underline flex items-center gap-2 mx-auto md:mx-0 p-2"
                >
                  {showMoreAbout ? "Read Less" : "Read More Mission"}
                  <div className={`w-4 h-4 bg-orange-100 rounded-full flex items-center justify-center transition-transform ${showMoreAbout ? "rotate-180" : ""}`}>
                    <ArrowLeft className="w-2.5 h-2.5 -rotate-90" />
                  </div>
                </button>
              </div>
            </div>

            <div className="w-full md:w-auto flex justify-center order-1 md:order-2 flex-shrink-0">
              <div className="w-32 h-32 md:w-40 lg:w-48 md:h-40 lg:h-48 rounded-3xl lg:rounded-[3rem] bg-slate-50 border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden group-hover:scale-105 transition-all duration-700 relative">
                <img src="/chef.png" className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700" alt="The CuisineAI Chef" />
                <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── SAMPLE IMAGES STRIP ──────────────────────────────────────── */}
        {!isHistoryView && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mb-10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-orange-500 flex items-center justify-center">
                  <ImageIcon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">Try a Sample Image</span>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={sampleScrollIdx === 0}
                  onClick={() => setSampleScrollIdx(Math.max(0, sampleScrollIdx - SAMPLES_PER_PAGE))}
                  className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-orange-100 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                <button
                  disabled={sampleScrollIdx + SAMPLES_PER_PAGE >= SAMPLE_IMAGES.length}
                  onClick={() => setSampleScrollIdx(Math.min(SAMPLE_IMAGES.length - SAMPLES_PER_PAGE, sampleScrollIdx + SAMPLES_PER_PAGE))}
                  className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-orange-100 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-3">
              {visibleSamples.map((s) => (
                <motion.button
                  key={s.src}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  onClick={() => handleSampleClick(s.src, s.label)}
                  className={`relative rounded-2xl overflow-hidden border-2 transition-all group ${preview === s.src ? "border-orange-500 shadow-lg shadow-orange-500/20" : "border-slate-100 hover:border-orange-300"}`}
                >
                  <div className="aspect-square">
                    <img src={s.src} alt={s.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-2 left-0 right-0 text-center text-white text-[10px] font-black uppercase tracking-widest px-1 truncate">{s.label}</span>
                  {preview === s.src && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── MAIN GRID ─────────────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">

          {/* Left: Control Panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <span className="text-orange-500 uppercase tracking-widest font-black text-[10px] bg-orange-50 px-2 py-0.5 rounded-md inline-block">
                {isHistoryView ? "Stored Analysis" : "Taste with AI"}
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
                {isHistoryView ? <span>Archived Record</span> : <span>Next-Gen Recipe <br />Synthesis</span>}
              </h1>
              <p className="text-slate-500 text-sm md:text-base leading-relaxed opacity-80 max-w-sm">
                {isHistoryView
                  ? "Viewing your previously analyzed dish."
                  : "Upload a food photo or pick a sample above — the AI will predict all possible matching recipes."}
              </p>
            </div>

            <div className={`bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 ${isHistoryView ? "border-orange-500/30" : ""}`}>
              <div className="relative group overflow-hidden rounded-2xl border-2 border-dashed border-slate-200/80 bg-slate-50 transition-colors hover:border-orange-500/50">
                <div className="aspect-[4/3] flex flex-col items-center justify-center">
                  {preview ? (
                    <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full p-4 text-center">
                      <Upload className="w-10 h-10 text-slate-300 mb-3 group-hover:text-orange-500 animate-bounce transition-colors" />
                      <p className="text-xs font-black text-slate-400 group-hover:text-orange-500 uppercase tracking-widest">Select Food Image</p>
                      <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} accept="image/*" />
                    </label>
                  )}
                </div>
              </div>

              {/* Hidden file input for the whole card when preview shown */}
              {preview && !isHistoryView && (
                <label className="cursor-pointer mt-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-orange-500 transition-colors">
                  <Upload className="w-3 h-3" /> Change Image
                  <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                </label>
              )}

              {!isHistoryView ? (
                <button
                  id="generate-btn"
                  onClick={handlePredict}
                  disabled={!image || loading}
                  className={`w-full mt-4 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${loading ? "bg-slate-100 text-slate-300" : "bg-orange-500 text-white hover:bg-orange-600 shadow-xl shadow-orange-500/30 active:scale-[0.98]"}`}
                >
                  {loading ? "Processing..." : (<>Generate <ChevronRight className="w-4 h-4" /></>)}
                </button>
              ) : (
                <Link href="/" className="w-full mt-4 py-4 rounded-2xl font-black text-sm uppercase tracking-widest bg-slate-900 text-white hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
                  <ArrowLeft className="w-4 h-4" /> Return to Lab
                </Link>
              )}
            </div>
          </div>

          {/* Right: Results Panel */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="loading" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 text-center"
                >
                  <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                    <div className="absolute w-10 h-10 bg-orange-500 rounded-full shadow-[0_0_30px_rgba(249,115,22,0.5)] animate-pulse" />
                    <div className="absolute w-full h-full border-2 border-orange-500/10 rounded-full border-t-orange-500 animate-[spin_2.5s_linear_infinite]" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800">Synthesizing Recipes...</h3>
                  <p className="text-slate-400 text-xs mt-2 font-bold uppercase tracking-widest">Running multiple predictions</p>
                </motion.div>
              ) : result && activeRecipe ? (
                <motion.div key="result" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100"
                >
                  {/* ── Title Header ── */}
                  <div className="flex items-center gap-4 mb-6 border-b border-slate-50 pb-5">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Utensils className="text-orange-500 w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Cuisine LAB</span>
                      <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight truncate">{activeRecipe.title}</h2>
                    </div>
                  </div>

                  {/* ── Recipe Tabs ── */}
                  {activeRecipes.length > 1 && (
                    <div className="flex gap-2 flex-wrap mb-6">
                      {activeRecipes.map((r, i) => (
                        <button
                          key={i}
                          id={`recipe-tab-${i}`}
                          onClick={() => setActiveRecipeIdx(i)}
                          className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeRecipeIdx === i
                            ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/25"
                            : "bg-slate-50 text-slate-500 border-slate-100 hover:border-orange-300 hover:text-orange-500"
                            }`}
                        >
                          {i === 0 ? "⭐ Best Match" : `Variant ${i + 1}`}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* ── Content ── */}
                  {activeRecipe.title !== "Not a valid recipe!" && !activeRecipe.title.includes("Low Confidence") ? (
                      <div className="grid md:grid-cols-12 gap-8">
                        {/* Ingredients */}
                        <div className="md:col-span-4 space-y-4">
                          <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Ingredients</h4>
                          <div className="flex flex-wrap md:flex-col gap-2">
                            {(Array.isArray(activeRecipe.ingredients) ? activeRecipe.ingredients : []).map((item: string, i: number) => (
                              <div key={i} className="text-slate-600 text-xs font-bold px-3 py-2.5 bg-slate-50 rounded-2xl flex items-center gap-2.5 group transition-colors hover:bg-orange-50">
                                <div className="w-5 h-5 rounded-lg bg-orange-500 text-white flex items-center justify-center text-[10px] font-black flex-shrink-0">✓</div>
                                {item}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Steps */}
                        <div className="md:col-span-8 space-y-6">
                          <div className="flex items-center justify-between">
                            <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Preparation Steps</h4>
                            <div className="flex items-center gap-2">
                              {result._id && (
                                <button
                                  id="share-btn"
                                  onClick={() => copyShareLink(result._id!)}
                                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isCopied ? "bg-green-500 text-white shadow-xl shadow-green-500/30" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                                >
                                  {isCopied ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
                                  {isCopied ? "Copied" : "Share"}
                                </button>
                              )}
                              <button
                                id="listen-btn"
                                onClick={isSpeaking ? stopVoiceAssistant : startAutomatedGuide}
                                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isSpeaking ? "bg-orange-500 text-white shadow-xl shadow-orange-500/30" : "bg-slate-900 text-white hover:bg-orange-500"}`}
                              >
                                {isSpeaking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-white" />}
                                {isSpeaking ? "Stop" : "Listen"}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {(Array.isArray(activeRecipe.recipe) ? activeRecipe.recipe : []).map((step: string, i: number) => (
                              <div
                                key={i}
                                onClick={() => speakStep(i)}
                                className={`flex gap-4 p-5 rounded-[1.5rem] border transition-all cursor-pointer group ${currentStepIndex === i
                                  ? "bg-orange-50 border-orange-500 ring-4 ring-orange-500/10"
                                  : "bg-white border-slate-100 hover:border-orange-500/50 shadow-sm"
                                  }`}
                              >
                                <div className={`flex-shrink-0 w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${currentStepIndex === i ? "bg-orange-500 text-white shadow-lg" : "bg-slate-100 text-slate-400 group-hover:bg-orange-500 group-hover:text-white"}`}>
                                  {i + 1}
                                </div>
                                <p className={`text-sm leading-relaxed font-bold ${currentStepIndex === i ? "text-orange-950 underline decoration-orange-500/30 underline-offset-4" : "text-slate-600 group-hover:text-slate-900"}`}>
                                  {step}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                  ) : (
                      <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-[2rem] border border-red-100/50 text-center">
                          <p className="text-red-500 font-bold mb-2">{(Array.isArray(activeRecipe.recipe) ? activeRecipe.recipe[0] : activeRecipe.recipe) || "Cannot generate alternative recipe"}</p>
                          <p className="text-slate-500 text-sm">Please check the other variant or try a different food image.</p>
                      </div>
                  )}
                </motion.div>
              ) : (
                <div key="placeholder" className="h-full min-h-[400px] flex items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-[3rem] bg-white/40">
                  <div className="text-center opacity-40">
                    <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-500 font-black text-xs uppercase tracking-[0.2em]">Ready for Analysis</p>
                    <p className="text-slate-400 font-bold text-[10px] mt-1">Pick a sample or upload an image</p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="bg-[#0f172a] text-slate-400 min-h-[320px] md:min-h-[240px] flex flex-col justify-center items-center px-6 py-12 md:py-16 mt-24 relative border-t border-white/5 overflow-hidden">
        <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-orange-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-100px] left-[-100px] w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

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
              <Github className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </a>
            <a href="https://www.linkedin.com/in/gautam-kumar-489903281/" target="_blank" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all ring-1 ring-white/10 group">
              <Linkedin className="w-5 h-5 group-hover:scale-110 transition-transform" />
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
  );
}
