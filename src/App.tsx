import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, signInWithGoogle, deductCredit, saveSearch } from './lib/firebase';
import { performAgenticSearch } from './services/geminiService';
import { Search, Sparkles, User as UserIcon, LogOut, History, Zap, Shield, Globe, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// UI Utility
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'history' | 'about' | 'faq' | 'how-it-works' | 'guide' | 'speed' | 'privacy' | 'terms'>('search');
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
        setUserData(doc.data());
      });
      return () => unsub();
    }
  }, [user]);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (userData && userData.credits <= 0) {
      alert("Out of credits! This is a demo, but in a real app you'd top up here.");
      return;
    }

    setIsSearching(true);
    setResult('');
    setActiveTab('search');

    try {
      await deductCredit(user.uid);
      const searchResult = await performAgenticSearch(query, (text) => {
        setResult(text);
      });
      await saveSearch(user.uid, query, searchResult);
    } catch (error) {
      console.error(error);
      setResult("Sorry, something went wrong with the search. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'history': return <HistoryView userId={user?.uid} onSelect={(q, r) => { setQuery(q); setResult(r); setActiveTab('search'); }} />;
      case 'about': return <AboutView />;
      case 'faq': return <FAQView />;
      case 'how-it-works': return <HowItWorksView />;
      case 'guide': return <GuideView />;
      case 'speed': return <SpeedView />;
      case 'terms': return <TermsView />;
      case 'privacy': return <PrivacyView />;
      default: return (
        <div className="flex flex-col items-center">
          {/* Hero Section */}
          {!result && !isSearching && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center mt-12 mb-16 space-y-6"
            >
              <div className="inline-block px-4 py-1.5 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-bold tracking-widest uppercase mb-4">
                New: Get 1,000,000 Credits on Sign Up
              </div>
              <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter leading-[0.9] text-white">
                The AI Agent for <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-accent to-purple-400">Your Next Big Ideas.</span>
              </h1>
              <p className="text-text-dim text-lg md:text-xl max-w-2xl mx-auto pt-4 leading-relaxed">
                Gen AI Flash performs research better, faster, and smarter with the world's most advanced autonomous searching agents.
              </p>
            </motion.div>
          )}

          {/* Search Box - Glass Aesthetic */}
          <form 
            onSubmit={handleSearch}
            className={cn(
              "w-full max-w-3xl transition-all duration-700 sticky top-28 z-40",
              (result || isSearching) ? "mb-12" : "mb-20"
            )}
          >
            <div className="relative group">
              <input 
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What do you want to build or discover today?"
                className="w-full h-20 frosted-glass rounded-3xl pl-8 pr-40 text-xl text-white placeholder:text-text-dim/60 focus:outline-none focus:ring-4 focus:ring-accent/20 focus:border-accent/40 transition-all shadow-2xl"
              />
              <div className="absolute right-2.5 top-2.5 bottom-2.5 flex gap-2">
                <button 
                  type="submit"
                  disabled={!query.trim() || isSearching}
                  className="h-full px-8 bg-accent hover:bg-accent/90 text-white font-black rounded-2xl transition-all shadow-lg shadow-accent/20 flex items-center gap-2 group/btn disabled:opacity-50"
                >
                  {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <span>Generate</span>
                      <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {!result && !isSearching && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                {[
                  { icon: "⚡", title: "Instant Research", desc: "Turn any prompt into a fully interactive, research-backed report." },
                  { icon: "🤖", title: "Smart Flash", desc: "Our proprietary Flash engine analyzes queries in milliseconds." },
                  { icon: "🌐", title: "Web Intelligence", desc: "Live browsing ensures information is never outdated." }
                ].map((f, i) => (
                  <div key={i} className="frosted-glass p-6 rounded-2xl group hover:border-accent/30 transition-all">
                    <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">{f.icon}</div>
                    <h3 className="font-bold text-white mb-2">{f.title}</h3>
                    <p className="text-sm text-text-dim leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </form>

          {/* Results Section */}
          <AnimatePresence mode="wait">
            {(result || isSearching) && (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full"
              >
                {isSearching && !result && (
                  <div className="flex flex-col items-center justify-center py-20 space-y-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full" />
                      <Loader2 className="w-12 h-12 text-accent animate-spin relative" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-white font-bold text-xl">Gen AI Flash is thinking...</p>
                      <p className="text-text-dim">Consulting billions of data points...</p>
                    </div>
                  </div>
                )}
                
                {result && (
                  <div className="frosted-glass rounded-3xl p-8 md:p-12 shadow-2xl overflow-hidden relative border-white/5">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[100px] -z-10" />
                    <ReactMarkdown 
                      components={{
                        h1: ({node, ...props}) => <h1 className="text-4xl font-extrabold mb-8 text-white tracking-tight" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-12 mb-4 text-accent/80 flex items-center gap-2" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-xl font-bold mt-8 mb-3 text-white border-b border-white/5 pb-2 inline-block" {...props} />,
                        p: ({node, ...props}) => <p className="text-slate-300 leading-relaxed mb-6 text-lg" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-8 space-y-3 text-slate-300" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-8 space-y-3 text-slate-300" {...props} />,
                        code: ({node, ...props}) => <code className="bg-accent/10 text-accent rounded px-1.5 py-0.5 text-sm font-mono border border-accent/20" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-accent pl-6 italic text-slate-400 my-8 py-2 bg-accent/5 rounded-r-lg" {...props} />
                      }}
                    >
                      {result}
                    </ReactMarkdown>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark text-slate-50 font-sans selection:bg-accent/30 selection:text-white">
      {/* Background Decorative Circles */}
      <div className="fixed top-[20%] left-[10%] w-[300px] h-[300px] bg-accent/20 rounded-full blur-[80px] -z-10 pointer-events-none" />
      <div className="fixed bottom-[10%] right-[5%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[80px] -z-10 pointer-events-none" />

      {/* Header */}
      <nav className="fixed top-0 w-full z-50 frosted-glass border-b border-white/10 px-6 md:px-12 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => { setActiveTab('search'); setResult(''); setQuery(''); }}>
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-accent uppercase">GEN AI FLASH</span>
        </div>

        <div className="hidden lg:flex items-center gap-6 text-xs font-bold tracking-widest uppercase text-text-dim">
          <button onClick={() => setActiveTab('how-it-works')} className={cn("hover:text-white transition-colors", activeTab === 'how-it-works' && "text-white")}>How It Works</button>
          <button onClick={() => setActiveTab('guide')} className={cn("hover:text-white transition-colors", activeTab === 'guide' && "text-white")}>Guide</button>
          <button onClick={() => setActiveTab('speed')} className={cn("hover:text-white transition-colors", activeTab === 'speed' && "text-white")}>Speed</button>
          <button onClick={() => setActiveTab('faq')} className={cn("hover:text-white transition-colors", activeTab === 'faq' && "text-white")}>FAQ</button>
          <button onClick={() => setActiveTab('about')} className={cn("hover:text-white transition-colors", activeTab === 'about' && "text-white")}>About</button>
        </div>

        <div className="flex items-center gap-6">
          {user && userData && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-full border border-accent/30">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-semibold text-accent">{userData.credits.toLocaleString()} Credits</span>
            </div>
          )}
          
          {user ? (
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setActiveTab('history')}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  activeTab === 'history' ? "bg-accent/20 text-accent" : "text-text-dim hover:text-white hover:bg-white/5"
                )}
              >
                <History className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                <img src={user.photoURL || ''} className="w-9 h-9 rounded-full border-2 border-accent/20" alt="" />
                <button onClick={() => auth.signOut()} className="text-text-dim hover:text-white transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={() => signInWithGoogle()} className="hidden sm:block text-text-dim hover:text-white transition-colors font-medium">Log In</button>
              <button 
                onClick={() => signInWithGoogle()}
                className="px-6 py-2.5 bg-accent text-white font-bold rounded-full hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 hover:scale-105 active:scale-95"
              >
                Get 1M Credits
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="pt-32 pb-24 px-6 max-w-6xl mx-auto min-h-[calc(100vh-80px)]">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="w-full py-8 mt-24 px-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-text-dim bg-bg-dark/80 backdrop-blur-md">
        <div className="font-medium text-center md:text-left">
          &copy; 2026 GEN AI FLASH. All rights reserved. <br className="md:hidden" />
          Powered by Gemini Intelligence.
        </div>
        <div className="hidden lg:flex items-center gap-2 text-yellow-500 font-bold bg-yellow-500/10 px-4 py-2 rounded-full border border-yellow-500/20">
          <Zap className="w-4 h-4 fill-yellow-500" />
          Limited Time: Get 1,000,000 Credits on Sign Up
        </div>
        <div className="flex gap-8 font-semibold">
          <button onClick={() => setActiveTab('terms')} className={cn("hover:text-white transition-colors", activeTab === 'terms' && "text-white underline")}>Terms of Service</button>
          <button onClick={() => setActiveTab('privacy')} className={cn("hover:text-white transition-colors", activeTab === 'privacy' && "text-white underline")}>Privacy Policy</button>
          <button onClick={() => setActiveTab('about')} className={cn("hover:text-white transition-colors", activeTab === 'about' && "text-white underline")}>Company</button>
        </div>
      </footer>

      {/* Auth Modal - Glass Style */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="absolute inset-0 bg-bg-dark/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md frosted-glass rounded-[40px] p-10 text-center space-y-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-accent to-blue-500" />
              <div className="w-20 h-20 bg-accent rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-accent/40 -rotate-6">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-black tracking-tight text-white leading-tight">Start Your <br />Gen AI Flash Account</h3>
                <p className="text-text-dim leading-relaxed">Join the research revolution and claim your <span className="text-white font-bold">1 Million Credits</span>.</p>
              </div>
              <button 
                onClick={async () => {
                  await signInWithGoogle();
                  setShowAuthModal(false);
                }}
                className="w-full py-4.5 bg-white text-black font-black rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95"
              >
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="" />
                Continue with Google
              </button>
              <div className="pt-2">
                <button onClick={() => setShowAuthModal(false)} className="text-text-dim hover:text-white text-sm font-semibold transition-colors">
                  Skip for Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Welcome Notification */}
      {user && userData?.credits === 1000000 && (
         <motion.div 
          initial={{ opacity: 0, x: 20, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          className="fixed bottom-6 right-6 z-50 bg-accent text-white px-7 py-5 rounded-[24px] shadow-2xl shadow-accent/40 flex items-center gap-4 border border-white/20"
         >
           <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
             <Zap className="w-6 h-6 text-yellow-300 fill-yellow-300" />
           </div>
           <div>
             <div className="font-black text-lg">1 Million Credits!</div>
             <div className="text-sm text-white/80">Your welcome bonus has been applied.</div>
           </div>
           <button onClick={() => setUserData({...userData, credits: 999999.9})} className="ml-4 hover:opacity-50 transition-opacity">
             <ArrowRight className="w-5 h-5" />
           </button>
         </motion.div>
      )}
    </div>
  );
}

function AboutView() {
  return (
    <div className="prose prose-invert max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black tracking-tight mb-2 uppercase">About Gen AI Flash</h1>
        <p className="text-xl text-text-dim">Reimagining Information Discovery with Autonomous Intelligence.</p>
      </div>
      <div className="frosted-glass p-10 rounded-[40px] space-y-6">
        <p>Gen AI Flash is a next-generation search engine built on the principle of agentic intelligence. Unlike traditional search engines that provide a list of links, Gen AI Flash deploys autonomous agents to browse, read, and synthesize the web in real-time to give you direct, comprehensive answers.</p>
        <p>Our mission is to reduce the time spent on manual research by 90%, allowing builders and thinkers to focus on what matters most: innovation.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
          <div>
            <h3 className="text-accent text-xl font-bold mb-4">Our Values</h3>
            <ul className="space-y-2 list-none p-0">
              <li className="flex gap-2"><span>🛡️</span> <strong>Privacy First:</strong> We don't sell your data.</li>
              <li className="flex gap-2"><span>🔍</span> <strong>Fact Accuracy:</strong> Grounded in real-web sources.</li>
              <li className="flex gap-2"><span>🚀</span> <strong>Speed:</strong> Optimized agents for instant results.</li>
            </ul>
          </div>
          <div>
            <h3 className="text-accent text-xl font-bold mb-4">The Tech</h3>
            <p className="text-sm text-text-dim">Using Google Gemini's latest 3.x models, we process terabytes of information in parallel to extract insights that matter.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FAQView() {
  const faqs = [
    { q: "Is Gen AI Flash free?", a: "We offer a generous free tier of 1 million credits for new users. After that, you can purchase additional credits." },
    { q: "How are credits charged?", a: "Each search task costs exactly 1 credit. We don't charge for browsing history or accessing existing results." },
    { q: "Can I use it for professional research?", a: "Absolutely. Gen AI Flash is designed for deep academic and professional research, providing citations and technical analysis." },
    { q: "How is it different from ChatGPT?", a: "While LLMs are great at chat, Gen AI Flash is an 'Agentic Search' engine—it specifically browses the live web to find current facts and data." }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-5xl font-black text-center mb-12 uppercase tracking-tight">Frequently Asked Questions</h1>
      <div className="space-y-4">
        {faqs.map((f, i) => (
          <div key={i} className="frosted-glass p-8 rounded-3xl">
            <h3 className="text-xl font-bold text-white mb-3">{f.q}</h3>
            <p className="text-text-dim leading-relaxed">{f.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function HowItWorksView() {
  return (
    <div className="max-w-4xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black uppercase tracking-tight">How It Works</h1>
        <p className="text-xl text-text-dim">The science behind Gen AI Flash.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { step: "01", title: "Query Analysis", desc: "Our orchestrator breaks your query into multiple research sub-tasks." },
          { step: "02", title: "Agent Deployment", desc: "Autonomous agents scour thousands of web pages simultaneously." },
          { step: "03", title: "Synthesis", desc: "Conflicting data is cross-referenced and synthesized into a final report." }
        ].map((s, i) => (
          <div key={i} className="frosted-glass p-8 rounded-[32px] relative group overflow-hidden">
            <div className="text-6xl font-black text-white/10 absolute -top-4 -right-4 group-hover:text-accent/20 transition-colors">{s.step}</div>
            <h3 className="text-2xl font-bold mb-4 relative z-10">{s.title}</h3>
            <p className="text-text-dim relative z-10 leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function GuideView() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <h1 className="text-5xl font-black text-center mb-12 uppercase tracking-tight">Gen AI Flash Guide</h1>
       <div className="frosted-glass p-10 rounded-[40px] space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-accent">Effective Prompting</h2>
            <p className="text-text-dim">To get the best out of Gen AI Flash, be as specific as possible. Instead of "Nvidia stocks", try "Detailed analysis of Nvidia's Q4 earnings and its impact on the 2026 AI market."</p>
          </section>
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-accent">Understanding Citations</h2>
            <p className="text-text-dim">Our agents automatically cite sources with markers like [1]. You can cross-reference these to verify data accuracy across the live web.</p>
          </section>
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-accent">Using History</h2>
            <p className="text-text-dim">Don't waste credits! Any result you generate is saved in your 'History' tab forever. You can access these deep-dives without spending any additional tokens.</p>
          </section>
       </div>
    </div>
  );
}

function SpeedView() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-5xl font-black text-center mb-12 uppercase tracking-tight">Improve Search Speed</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="frosted-glass p-8 rounded-3xl space-y-4 border-accent/20">
            <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center text-accent">
              <Zap className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold">Parallel Execution</h3>
            <p className="text-text-dim">By default, Gen AI Flash uses 10+ parallel agents. To improve speed, ensure you have a stable internet connection for the stream to render smoothly.</p>
         </div>
         <div className="frosted-glass p-8 rounded-3xl space-y-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white">
              <Globe className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold">Local Cloud Nodes</h3>
            <p className="text-text-dim">We deploy our research agents to the cloud node closest to the target data, reducing latency significantly compared to standard LLMs.</p>
         </div>
      </div>
      <div className="text-center p-12 bg-accent/5 rounded-[40px] border border-accent/10">
        <p className="text-lg text-text-dim italic">"Gen AI Flash is optimized to deliver deep research in under 30 seconds."</p>
      </div>
    </div>
  );
}

function PrivacyView() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 prose-invert prose">
      <h1 className="text-5xl font-black uppercase text-center mb-12">Privacy Policy</h1>
      <div className="frosted-glass p-10 rounded-[40px] space-y-6">
        <section>
          <h2 className="text-accent">Data Collection</h2>
          <p>We only collect information necessary to provide our service: your display name, email address, and search history. This data is used solely for credit management and personalized research retrieval.</p>
        </section>
        <section>
          <h2 className="text-accent">Data Usage</h2>
          <p>Your search queries are processed by the Gemini API. We do not sell your data to third parties. We use industry-standard encryption to protect your information.</p>
        </section>
        <section>
          <h2 className="text-accent">Cookies</h2>
          <p>We use local storage and standard cookies to maintain your session and ensure you stay logged in to your account.</p>
        </section>
      </div>
    </div>
  );
}

function TermsView() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 prose-invert prose">
      <h1 className="text-5xl font-black uppercase text-center mb-12">Terms of Service</h1>
      <div className="frosted-glass p-10 rounded-[40px] space-y-6">
        <section>
          <h2 className="text-accent">Acceptable Use</h2>
          <p>By using Gen AI Flash, you agree not to use the service for illegal activities, generating harmful content, or attempting to bypass our credit system.</p>
        </section>
        <section>
          <h2 className="text-accent">Credits</h2>
          <p>The 1,000,000 credit bonus is a limited-time offer. We reserve the right to modify the credit charging structure to ensure platform stability.</p>
        </section>
        <section>
          <h2 className="text-accent">Disclaimer</h2>
          <p>Gen AI Flash is an AI research tool. While we strive for accuracy, the results are generated by artificial intelligence and should be cross-referenced for critical decisions.</p>
        </section>
      </div>
    </div>
  );
}

function HistoryView({ userId, onSelect }: { userId?: string, onSelect: (q: string, r: string) => void }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      import('./lib/firebase').then(({ getSearchHistory }) => {
        getSearchHistory(userId).then(data => {
          setHistory(data);
          setLoading(false);
        });
      });
    }
  }, [userId]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-4xl font-extrabold mb-10 flex items-center gap-4 text-white tracking-tight">
        <History className="text-accent w-10 h-10" /> Search History
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {history.length === 0 ? (
          <p className="text-text-dim col-span-full text-center py-20 frosted-glass rounded-3xl border-dashed">
            No searches yet. Start asking questions!
          </p>
        ) : (
          history.map((item) => (
            <button 
              key={item.id}
              onClick={() => onSelect(item.query, item.response)}
              className="text-left frosted-glass hover:bg-white/[0.08] hover:border-accent/40 rounded-3xl p-8 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl -z-10" />
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs text-accent font-bold tracking-widest uppercase">
                  {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <ArrowRight className="w-5 h-5 text-text-dim group-hover:text-accent -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
              </div>
              <h3 className="text-xl font-bold text-white line-clamp-2 mb-3 leading-tight">{item.query}</h3>
              <p className="text-text-dim line-clamp-2 text-sm leading-relaxed">{item.response}</p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
