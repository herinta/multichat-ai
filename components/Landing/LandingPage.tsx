"use client";

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Phone, 
  MessageCircle, 
  Sparkles, 
  Zap, 
  Globe, 
  Heart,
  ArrowRight,
  X,
  User,
  Settings,
  Star,
  Check,
  Layers,
  ChevronRight,
  Volume2
} from 'lucide-react';
import type { Variants } from 'motion/react';

const EASE_DREAM: [number, number, number, number] = [0.16, 1, 0.3, 1];

const revealVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    transition: { duration: 0.8, ease: EASE_DREAM }
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    }
  }
};

interface FloatingAssetProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  yRange?: number[];
}

const FloatingAsset = ({ 
  children, 
  className = "", 
  delay = 0, 
  duration = 5,
  yRange = [0, -18, 0]
}: FloatingAssetProps) => (
  <motion.div
    className={`absolute pointer-events-none ${className}`}
    initial={{ opacity: 0, scale: 0.6 }}
    animate={{ 
      opacity: 1, 
      scale: 1,
      y: yRange
    }}
    transition={{
      opacity: { duration: 0.8, delay },
      scale: { duration: 0.8, delay },
      y: {
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay
      }
    }}
  >
    {children}
  </motion.div>
);

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

const GlassCard = ({ children, className = "", delay = 0 }: GlassCardProps) => (
  <motion.div
    variants={revealVariants}
    transition={{ delay, duration: 0.8, ease: EASE_DREAM }}
    className={`backdrop-blur-xl bg-white/70 dark:bg-gray-900/60 border border-white/80 dark:border-blue-500/20 shadow-[0_10px_35px_rgba(37,99,235,0.08)] rounded-3xl p-6 sm:p-8 ${className}`}
  >
    {children}
  </motion.div>
);

const ChatMockup = () => (
  <div className="space-y-3.5">
    <div className="flex gap-2.5 items-end">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-md">
        N
      </div>
      <div className="bg-white/80 dark:bg-gray-800/90 border border-blue-100 dark:border-gray-700 rounded-2xl rounded-bl-xs p-3 text-xs leading-relaxed text-gray-800 dark:text-gray-100 shadow-xs">
        Hey! Gimana harimu hari ini? Cerita dong! ✨
      </div>
    </div>
    <div className="flex gap-2.5 flex-row-reverse items-end">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-md">
        U
      </div>
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-br-xs p-3 text-xs leading-relaxed shadow-sm">
        Tadi habis ujian nih, untung lu sempat ingetin semalam wkwk
      </div>
    </div>
    <div className="flex gap-2.5 items-end">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-md">
        K
      </div>
      <div className="bg-white/80 dark:bg-gray-800/90 border border-blue-100 dark:border-gray-700 rounded-2xl rounded-bl-xs p-3 text-xs leading-relaxed text-gray-800 dark:text-gray-100 shadow-xs">
        mantap lah, makan bareng gih ngerayain 🎉
      </div>
    </div>
  </div>
);

const CallMockup = () => (
  <div className="flex flex-col items-center justify-center py-2">
    <div className="relative">
      <motion.div 
        animate={{ scale: [1, 1.25, 1] }}
        transition={{ duration: 2.2, repeat: Infinity }}
        className="absolute inset-0 bg-blue-500/25 rounded-full blur-xl"
      />
      <div className="w-18 h-18 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center relative z-10 shadow-lg shadow-blue-500/30">
        <Phone className="text-white w-7 h-7 animate-pulse" />
      </div>
    </div>
    <div className="mt-4 text-center">
      <div className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-0.5">PANGGILAN AKTIF</div>
      <div className="font-bold text-base text-gray-900 dark:text-gray-100">Kuro & Nofa</div>
      <div className="flex items-center justify-center gap-1.5 mt-1.5">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Multi-Agent Call</span>
      </div>
    </div>
  </div>
);

interface LandingPageProps {
  onNavigateToLogin?: () => void;
  onNavigateToRegister?: () => void;
}

export function LandingPage({ 
  onNavigateToLogin = () => window.location.href = '/login',
  onNavigateToRegister = () => window.location.href = '/register'
}: LandingPageProps) {
  const [empathy, setEmpathy] = useState(85);
  const [humor, setHumor] = useState(65);
  const [gender, setGender] = useState('Female');
  const [isGenerating, setIsGenerating] = useState(false);

  const tryPersona = () => {
    if (isGenerating) return;
    setIsGenerating(true);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = gender === 'Male'
        ? "Halo bro! Santai aja kali, gue siap nemenin ngobrol kapan aja."
        : "Hai! Senang banget bisa ketemu kamu. Mau ngobrolin apa hari ini?";
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.pitch = gender === 'Male' ? 0.9 : 1.15;
      utterance.rate = 1.0;
      utterance.onend = () => setIsGenerating(false);
      utterance.onerror = () => setIsGenerating(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsGenerating(false), 1500);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-[#F0F7FF] via-[#E8F1FF] to-[#D9EBFF] text-gray-900 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Background Animated Blobs in Azure & Blue */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[650px] h-[650px] bg-blue-400/20 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[650px] h-[650px] bg-indigo-500/20 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] left-[55%] w-[450px] h-[450px] bg-cyan-400/20 rounded-full blur-[120px]" />
      </div>

      {/* Floating Navbar */}
      <motion.nav 
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: EASE_DREAM }}
        className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-4"
      >
        <div className="max-w-7xl mx-auto backdrop-blur-xl bg-white/70 border border-white/80 shadow-[0_8px_30px_rgba(37,99,235,0.08)] rounded-full px-6 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl rotate-6 flex items-center justify-center shadow-md shadow-blue-500/30">
              <Sparkles className="text-white w-5 h-5 -rotate-6" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-700 to-indigo-800 bg-clip-text text-transparent">
              Multi-AI
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Fitur</a>
            <a href="#call-groups" className="hover:text-blue-600 transition-colors">Voice Call</a>
            <a href="#customizer" className="hover:text-blue-600 transition-colors">Karakter AI</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Paket</a>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={onNavigateToLogin}
              className="text-xs sm:text-sm font-bold text-gray-700 hover:text-blue-600 transition-colors px-3 py-2 cursor-pointer"
            >
              LOG IN
            </button>
            <motion.button 
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={onNavigateToRegister}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-5 sm:px-6 py-2.5 rounded-full shadow-md shadow-blue-600/25 hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer"
            >
              DAFTAR SEKARANG
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Main Hero Section */}
      <main className="relative z-10 pt-32 sm:pt-40 pb-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Column */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="lg:col-span-7"
          >
            <motion.div variants={revealVariants}>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-700 text-xs font-bold tracking-wider uppercase mb-6">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                MULTI-AGENT AI • VOICE & CHAT
              </div>
              
              <h1 className="font-extrabold text-5xl sm:text-7xl leading-[1.08] tracking-[-0.04em] mb-6 text-gray-900">
                Temukan Karakter & <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500">
                  Circle AI Impianmu.
                </span>
              </h1>
              
              <p className="text-base sm:text-lg text-gray-600 max-w-xl mb-8 leading-relaxed font-normal">
                Bukan cuma bot kaku. Ngobrol bareng berbagai karakter AI dengan kepribadian hidup di grup chat, teleponan suara real-time, dan inisiatif <em>Chat Duluan</em> yang peka dengan kabarmu.
              </p>

              <div className="flex flex-wrap gap-4 items-center">
                <motion.button 
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onNavigateToRegister}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold px-8 py-4 rounded-full flex items-center gap-2.5 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 transition-all text-sm sm:text-base cursor-pointer"
                >
                  Daftar Sekarang <ArrowRight className="w-4 h-4" />
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onNavigateToLogin}
                  className="backdrop-blur-md bg-white/80 border border-blue-200/80 text-blue-800 font-bold px-7 py-4 rounded-full flex items-center gap-2 hover:bg-white transition-all text-sm sm:text-base shadow-xs cursor-pointer"
                >
                  Masuk ke Akun <User className="w-4 h-4 text-blue-600" />
                </motion.button>
              </div>

              {/* Quick stats under Hero */}
              <div className="mt-12 flex items-center gap-8 border-t border-blue-200/50 pt-6 text-xs text-gray-500 font-medium">
                <div>
                  <div className="text-xl font-extrabold text-gray-900">100%</div>
                  <div>Natural Bahasa Gaul</div>
                </div>
                <div className="w-px h-8 bg-blue-200/60" />
                <div>
                  <div className="text-xl font-extrabold text-gray-900">&lt; 300ms</div>
                  <div>Voice Call Latency</div>
                </div>
                <div className="w-px h-8 bg-blue-200/60" />
                <div>
                  <div className="text-xl font-extrabold text-gray-900">PWA Ready</div>
                  <div>Install di Layar HP</div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Hero Column - Asymmetrical Floating Mockup Cards */}
          <div className="lg:col-span-5 relative mt-6 lg:mt-0 min-h-[460px] flex items-center justify-center">
            
            {/* Main Chat Card */}
            <GlassCard className="relative z-20 w-full max-w-sm">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-blue-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Room: Tongkrongan AI</span>
                </div>
                <MessageCircle className="w-4 h-4 text-blue-500" />
              </div>
              <ChatMockup />
            </GlassCard>

            {/* Small Floating Call Card */}
            <GlassCard className="hidden sm:block absolute -bottom-8 -left-8 z-30 w-56 p-4 shadow-xl border-blue-200" delay={0.25}>
              <CallMockup />
            </GlassCard>

            {/* Small Floating Accuracy Card */}
            <GlassCard className="hidden sm:block absolute -top-6 -right-4 z-30 w-48 p-4 shadow-xl border-blue-200" delay={0.4}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/15 rounded-xl text-blue-600">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg font-extrabold text-gray-900">Long-Term</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Memory Sync</div>
                </div>
              </div>
            </GlassCard>

            {/* Floating 3D Accent Icons */}
            <FloatingAsset className="-top-10 left-[15%] z-30" delay={0.4}>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl shadow-blue-500/30 flex items-center justify-center rotate-12">
                <Heart className="text-white fill-white w-7 h-7" />
              </div>
            </FloatingAsset>

            <FloatingAsset className="top-[45%] -right-8 z-30" delay={0.7} duration={6} yRange={[0, 20, 0]}>
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-3xl -rotate-12 shadow-xl shadow-cyan-500/30 flex items-center justify-center">
                <Sparkles className="text-white w-8 h-8" />
              </div>
            </FloatingAsset>

          </div>
        </div>

        {/* Feature Highlights Grid */}
        <section id="features" className="mt-36">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">FITUR UTAMA</div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
              Bukan Asisten Biasa, Tapi Sahabat Sejati.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Heart,
                title: "AI Chat Duluan",
                desc: "Karakter berinisiatif chat kamu duluan menanyakan kabar, follow-up ujian, kerjaan, atau sekadar chit-chat kasual tanpa mengarang cerita palsu."
              },
              {
                icon: Phone,
                title: "Voice Call 1-on-1 & Grup",
                desc: "Teleponan suara langsung seperti di Discord/WhatsApp. AI bisa saling sahut di telepon dan mengingat semua obrolan setelah telepon ditutup."
              },
              {
                icon: Globe,
                title: "Explore AI Marketplace",
                desc: "Jelajahi karakter buatan komunitas, beri like, dan mulai percakapan instan atau publikasikan karakter unik kreasi kamu sendiri."
              }
            ].map((f, i) => (
              <GlassCard key={i} className="hover:-translate-y-1 transition-transform">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-md shadow-blue-500/25">
                  <f.icon className="text-white w-6 h-6" />
                </div>
                <h3 className="font-bold text-xl mb-3 text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Call Group Section */}
        <section id="call-groups" className="mt-36">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Visual Call Mockup Box */}
            <GlassCard className="aspect-auto md:aspect-video flex flex-col justify-between overflow-hidden relative p-8">
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-blue-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
                  <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">LIVE GROUP CALL • 4 PARTICIPANTS</span>
                </div>
                <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  03:42
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 my-auto py-2">
                {[
                  { name: "Kuro", status: "Speaking...", color: "from-blue-600 to-indigo-600", active: true },
                  { name: "Nofa", status: "Listening", color: "from-cyan-500 to-blue-500", active: false },
                  { name: "Pak Bambang", status: "Listening", color: "from-blue-700 to-blue-900", active: false },
                  { name: "Anda", status: "Mic On", color: "from-emerald-600 to-teal-600", active: false }
                ].map((member, i) => (
                  <div key={i} className={`rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all ${
                    member.active
                      ? 'bg-blue-500/15 border-2 border-blue-500/70 shadow-md'
                      : 'bg-white/60 border border-white/80'
                  }`}>
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${member.color} text-white font-bold flex items-center justify-center text-base mb-2 shadow-sm ${member.active ? 'ring-4 ring-blue-400 animate-pulse' : ''}`}>
                      {member.name.charAt(0)}
                    </div>
                    <div className="font-bold text-sm text-gray-900">{member.name}</div>
                    <div className={`text-[10px] font-bold uppercase tracking-widest ${member.active ? 'text-blue-600' : 'text-gray-400'}`}>
                      {member.status}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-center gap-4">
                <div className="w-11 h-11 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/30">
                  <X className="w-5 h-5" />
                </div>
                <div className="w-11 h-11 rounded-full bg-white/80 border border-blue-200 flex items-center justify-center text-gray-700 shadow-sm">
                  <Phone className="w-5 h-5" />
                </div>
              </div>
            </GlassCard>

            {/* Explanation Right */}
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">DYNAMIC CALL GROUPS</div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                Diskusi Ramai & Seru <br />
                <span className="text-blue-600">di Panggilan Grup AI.</span>
              </h2>
              <p className="text-base text-gray-600 mb-8 leading-relaxed font-normal">
                Bosan ngobrol sendirian? Kumpulkan beberapa karakter favoritmu dalam satu panggilan suara. AI bisa saling sahut, bercanda, dan berdebat secara organik tanpa saling berebut bicara.
              </p>
              
              <ul className="space-y-4">
                {[
                  "Turn-taking cerdas tanpa tabrakan suara",
                  "Masing-masing karakter memiliki suara unik",
                  "Memori grup otomatis dirangkum saat telepon ditutup",
                  "Anti-echo feedback untuk ponsel dan laptop"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-semibold text-sm text-gray-800">
                    <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </section>

        {/* Customizer Interactive Section */}
        <section id="customizer" className="mt-36">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">PERSONALISASI TANPA BATAS</div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                Rancang Karakter & <br />
                <span className="text-blue-600">Gaya Bicaranya Sendiri.</span>
              </h2>
              <p className="text-base text-gray-600 mb-8 leading-relaxed font-normal">
                Atur apakah karaktermu seorang tsundere yang judes tapi perhatian, sahabat cowok yang santai, atau bapak-bapak bijak. Anda memegang kendali penuh atas sistem prompt dan karakternya.
              </p>

              <div className="space-y-6">
                {[
                  { title: "Matriks Kepribadian", desc: "Tentukan tingkat empati, humor, dan gaya ketikan bahasa gaul.", icon: Settings },
                  { title: "Voice & Speech Engine", desc: "Pilih modulasi nada suara yang pas untuk setiap karakter.", icon: Volume2 },
                  { title: "Konsolidasi Memori Otomatis", desc: "Pesan lama otomatis dirangkum menjadi ingatan jangka panjang permanen.", icon: Layers }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-10 h-10 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-gray-900">{item.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Sliders Card in Blue */}
            <GlassCard className="p-6 sm:p-8">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-blue-100">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Simulator Karakter</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                </div>
              </div>

              <div className="space-y-6">
                {/* Gender Toggle */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5">Pilihan Gender Vokal</div>
                  <div className="grid grid-cols-2 gap-3">
                    {['Male', 'Female'].map((g) => (
                      <button
                        key={g}
                        onClick={() => setGender(g)}
                        className={`py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                          gender === g 
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25' 
                            : 'bg-white/60 text-gray-600 border border-blue-100 hover:bg-white'
                        }`}
                      >
                        {g === 'Male' ? 'Laki-laki' : 'Perempuan'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Empathy Slider */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-gray-700 mb-2">
                    <span>TINGKAT EMPATI</span>
                    <span className="text-blue-600 font-extrabold">{empathy}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={empathy} 
                    onChange={(e) => setEmpathy(parseInt(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer h-2 bg-blue-100 rounded-lg"
                  />
                </div>

                {/* Humor Slider */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-gray-700 mb-2">
                    <span>SENSE OF HUMOR (SANTAI)</span>
                    <span className="text-indigo-600 font-extrabold">{humor}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={humor} 
                    onChange={(e) => setHumor(parseInt(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer h-2 bg-blue-100 rounded-lg"
                  />
                </div>

                {/* Trait tags */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {['Santai', 'Cerewet', 'Perhatian'].map((tag) => (
                    <div key={tag} className="bg-blue-500/10 text-blue-700 border border-blue-200/60 py-1.5 rounded-lg text-center text-[11px] font-bold">
                      {tag}
                    </div>
                  ))}
                </div>

                {/* Try Persona Audio Button */}
                <button 
                  onClick={tryPersona}
                  disabled={isGenerating}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-500/30 hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  {isGenerating ? 'Mendengarkan Suara...' : 'TES SUARA KARAKTER SEKARANG'}
                </button>
              </div>
            </GlassCard>

          </div>
        </section>

        {/* Pricing / Access Section */}
        <section id="pricing" className="mt-36 mb-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">AKSES SEPENUHNYA</div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
              Nikmati Seluruh Fitur Tanpa Batas.
            </h2>
          </div>

          <div className="max-w-xl mx-auto">
            <GlassCard className="relative border-2 border-blue-500/40 shadow-2xl shadow-blue-500/15 p-8 text-center">
              <div className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-extrabold px-4 py-1.5 rounded-full uppercase tracking-wider mb-6 shadow-md shadow-blue-500/30">
                Free & Open Access
              </div>

              <div className="text-5xl font-extrabold text-gray-900 mb-2">Gratis 100%</div>
              <p className="text-sm text-gray-500 mb-8">Didukung langsung oleh Google Gemini & Supabase Realtime</p>

              <div className="space-y-3.5 text-left mb-8 max-w-md mx-auto">
                {[
                  "Chat multi-agen di satu room tanpa batas",
                  "Panggilan suara (Voice Call) 1-on-1 & Call Grup",
                  "AI inisiatif chat duluan otomatis",
                  "Anti-prompt injection bergaya bahasa manusia gaul",
                  "Memori permanen lintas room & konsolidasi jangka panjang",
                  "Dapat diinstall di layar utama HP (PWA)"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm font-semibold text-gray-800">
                    <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>

              <button
                onClick={onNavigateToRegister}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-bold text-base shadow-lg shadow-blue-600/30 hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-98 cursor-pointer"
              >
                Buat Akun Gratis Sekarang (Daftar)
              </button>
            </GlassCard>
          </div>
        </section>

      </main>

      {/* Modern Blue Footer */}
      <footer className="relative z-10 py-10 px-6 border-t border-blue-200/60 bg-white/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Sparkles className="text-blue-600 w-5 h-5" />
            <span className="font-extrabold text-gray-900 text-base">Multi-AI</span>
            <span className="text-xs text-gray-400">— Modern Multi-Agent Chat & Voice</span>
          </div>

          <div className="flex gap-6 text-xs font-semibold">
            <a href="#features" className="hover:text-blue-600">Fitur</a>
            <a href="#call-groups" className="hover:text-blue-600">Voice Call</a>
            <a href="#customizer" className="hover:text-blue-600">Karakter</a>
            <a href="/login" className="hover:text-blue-600">Masuk</a>
            <a href="/register" className="hover:text-blue-600 text-blue-600 font-bold">Daftar Akun</a>
          </div>

          <div className="text-xs text-gray-400">
            © 2026 Multi-AI. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
