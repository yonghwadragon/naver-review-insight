import React, { useState } from "react";
import ScraperView from "./components/ScraperView";
import LiveAssistant from "./components/LiveAssistant";
import { Sparkles, Globe } from "lucide-react";
import { Language } from "./types";
import { TRANSLATIONS } from "./constants";

const App: React.FC = () => {
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const [language, setLanguage] = useState<Language>('ko');

  const t = TRANSLATIONS[language];

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'ko' ? 'en' : 'ko'));
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-green-500/30">

      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-green-500 to-emerald-700 p-2 rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-100">
              Review<span className="text-green-500">Insight</span> AI
            </span>
          </div>

          <div className="flex items-center gap-4">

            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              <Globe className="h-4 w-4" />
              {language === 'ko' ? 'English' : '한국어'}
            </button>

            <button
              onClick={() => setIsLiveOpen(!isLiveOpen)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                isLiveOpen
                  ? 'bg-green-500/10 border-green-500 text-green-400'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              {t.navStartVoice}
            </button>

          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="py-8">
        <ScraperView lang={language} />
      </main>

      {/* Voice Assistant */}
      <LiveAssistant
        isOpen={isLiveOpen}
        onClose={() => setIsLiveOpen(false)}
        lang={language}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-auto py-8 text-center text-slate-500 text-sm">
        <p>{t.footer}</p>
      </footer>
    </div>
  );
};

export default App;
