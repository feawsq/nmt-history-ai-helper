import React from 'react';
import {
  BookOpen,
  Clock,
  Sparkles,
  Layers,
  FileText,
  ShieldCheck,
  Scale,
  GraduationCap,
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'simulator' | 'topics' | 'flashcards' | 'tutor' | 'sources';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  openPrivacyModal: () => void;
  openScaleModal: () => void;
  storageFormattedSize: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openPrivacyModal,
  openScaleModal,
  storageFormattedSize,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Огляд', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'simulator', label: 'Симулятор НМТ', icon: <Clock className="w-4 h-4" />, badge: '30 завдань' },
    { id: 'topics', label: 'Теми', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'flashcards', label: 'Дати & Персоналії', icon: <Layers className="w-4 h-4" /> },
    { id: 'tutor', label: 'ШІ-Тьютор', icon: <Sparkles className="w-4 h-4 text-amber-400" />, badge: 'AI' },
    { id: 'sources', label: 'Детектив джерел', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-stone-950/90 backdrop-blur-md border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Brand */}
        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 font-black shadow-md shadow-amber-500/10 group-hover:scale-105 transition-transform">
            <span className="font-heading text-lg">НМТ</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-base text-white tracking-tight">Історія України</span>
              <span className="px-1.5 py-0.5 text-[10px] uppercase tracking-wider font-extrabold bg-amber-500/20 text-amber-400 rounded border border-amber-500/30">
                11 клас
              </span>
            </div>
            <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
              <span>ШІ-Тренажер</span>
              <span className="w-1 h-1 rounded-full bg-stone-600"></span>
              <span className="text-emerald-400">Zero-Data Vault</span>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 bg-stone-900/60 p-1 rounded-xl border border-stone-800/80">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                  isActive
                    ? 'bg-amber-500 text-stone-950 shadow-sm shadow-amber-500/20'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                      isActive ? 'bg-stone-950 text-amber-300' : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* UCEQA scale button */}
          <button
            onClick={openScaleModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-300 border border-stone-800 rounded-xl text-xs font-medium transition-colors"
            title="Офіційна таблиця 100–200 балів"
          >
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Шкала 100–200</span>
          </button>

          {/* Privacy Shield Button */}
          <button
            onClick={openPrivacyModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-800/60 rounded-xl text-xs font-medium transition-colors group"
            title="Приватність: ваші дані не надсилаються на сервер"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <div className="flex flex-col text-left leading-none">
              <span className="font-semibold text-[11px] text-emerald-300">Приватно</span>
              <span className="text-[9px] text-emerald-500/90 font-mono hidden sm:inline">{storageFormattedSize}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Bar */}
      <div className="lg:hidden flex items-center overflow-x-auto px-3 py-2 gap-1 border-t border-stone-800/60 bg-stone-950">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                isActive
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'text-stone-400 hover:text-stone-200 bg-stone-900/60 border border-stone-800/60'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
