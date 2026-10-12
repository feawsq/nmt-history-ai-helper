import React from 'react';
import {
  GraduationCap,
  Clock,
  BookOpen,
  Layers,
  Sparkles,
  FileText,
  ShieldCheck,
  Award,
  ArrowRight,
  CheckCircle2,
  Lock,
  Flame,
  HelpCircle,
} from 'lucide-react';
import { LocalUserData } from '../types';
import { ActiveTab } from './Navbar';

interface DashboardProps {
  userData: LocalUserData;
  setActiveTab: (tab: ActiveTab) => void;
  openPrivacyModal: () => void;
  openScaleModal: () => void;
  storageFormattedSize: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  userData,
  setActiveTab,
  openPrivacyModal,
  openScaleModal,
  storageFormattedSize,
}) => {
  const testsCount = userData.completedTests.length;
  const bestScore = testsCount > 0
    ? Math.max(...userData.completedTests.map((t) => t.nmtScaledScore))
    : 0;

  const averageScore = testsCount > 0
    ? Math.round(
        userData.completedTests.reduce((acc, t) => acc + t.nmtScaledScore, 0) / testsCount
      )
    : 0;

  const highYieldTips = [
    {
      title: 'Універсали УЦР',
      text: 'Пам\'ятай черговість: I — автономія («Однині самі...»), II — поступка Тимчасовому уряду, III — проголошення УНР, IV — повна незалежність (січень 1918 р.).',
    },
    {
      title: 'Маркери циркулярів',
      text: '1863 — Валуєв («ніякої мови не було, немає і бути не може»). 1876 — Емський указ Олександра II (заборона ввезення книг, театру й нотних текстів).',
    },
    {
      title: 'Березневі статті 1654',
      text: 'Військовий союз Гетьманщини та Москви: 60-тисячний реєстр, власне судочинство, заборона зносин з Польщею та Туреччиною.',
    },
    {
      title: 'Шістдесятники',
      text: 'В. Стус (поет, Перм-36), С. Параджанов (кінорежисер, «Тіні забутих предків»), І. Дзюба («Інтернаціоналізм чи русифікація?»), А. Горська (художниця).',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 border border-stone-800 rounded-3xl p-6 sm:p-9 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>100% Приватно • Локальне збереження • Без реєстрації</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold font-heading text-white tracking-tight leading-tight">
            Твій приватний ШІ-тренажер до <span className="text-amber-400">НМТ з історії</span>
          </h1>

          <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
            Складай повні 30-завданні симулятори іспиту, вивчай обов'язкові дати та аналізуй історичні цитати з розумним репетитором «Кліо». Жодні твої персональні дані не передаються й не зберігаються на сервері.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => setActiveTab('simulator')}
              className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              <Clock className="w-4 h-4" />
              <span>Почати симулятор НМТ (60 хв)</span>
            </button>

            <button
              onClick={() => setActiveTab('tutor')}
              className="flex items-center gap-2 px-5 py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-semibold rounded-xl text-xs sm:text-sm transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Запитати щось у Кліо</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Пройдено тестів</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-heading text-white">{testsCount}</p>
          <span className="text-[11px] text-stone-500">спроб у пам'яті браузера</span>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Найкращий бал</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-heading text-amber-400 font-mono">
            {bestScore > 0 ? `${bestScore}` : '—'}
          </p>
          <button
            onClick={openScaleModal}
            className="text-[11px] text-stone-400 hover:text-amber-400 underline underline-offset-2 transition-colors block text-left"
          >
            з 200 можливих за шкалою
          </button>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Обрані дати</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-heading text-sky-400 font-mono">
            {userData.favoriteDates.length}
          </p>
          <span className="text-[11px] text-stone-500">на вивчення у флеш-картках</span>
        </div>

        <div
          onClick={openPrivacyModal}
          className="bg-stone-900 border border-emerald-900/60 hover:border-emerald-700/80 rounded-2xl p-4 shadow-sm space-y-1 cursor-pointer transition-colors group"
        >
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
            <span>Щит конфіденційності</span>
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold font-heading text-emerald-300 font-mono">
            0 Б
          </p>
          <span className="text-[11px] text-emerald-500/80 group-hover:text-emerald-400 transition-colors">
            на сервері • {storageFormattedSize} локально
          </span>
        </div>
      </div>

      {/* Feature Navigation Cards */}
      <div className="space-y-4">
        <h2 className="text-base font-bold font-heading text-white">Режими підготовки</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Simulation */}
          <div
            onClick={() => setActiveTab('simulator')}
            className="bg-stone-900 border border-stone-800 hover:border-amber-500/50 rounded-2xl p-5 shadow-md cursor-pointer transition-all duration-200 group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-white text-base">Симулятор екзамену</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                30 тестових завдань (одиночні, відповідності, послідовності, 3 з 7) з таймером 60 хвилин та переведенням у 100–200 балів.
              </p>
            </div>
            <div className="pt-4 mt-2 border-t border-stone-800/80 flex items-center justify-between text-xs font-semibold text-amber-400 group-hover:translate-x-1 transition-transform">
              <span>Скласти тест</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 2: Topics & AI Generator */}
          <div
            onClick={() => setActiveTab('topics')}
            className="bg-stone-900 border border-stone-800 hover:border-amber-500/50 rounded-2xl p-5 shadow-md cursor-pointer transition-all duration-200 group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-white text-base">Тематичний тренінг</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                10 ключових блоків офіційної програми. Створюйте власні конспекти та генеруйте нові завдання через Gemini.
              </p>
            </div>
            <div className="pt-4 mt-2 border-t border-stone-800/80 flex items-center justify-between text-xs font-semibold text-amber-400 group-hover:translate-x-1 transition-transform">
              <span>Перейти до тем</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 3: Flashcards */}
          <div
            onClick={() => setActiveTab('flashcards')}
            className="bg-stone-900 border border-stone-800 hover:border-amber-500/50 rounded-2xl p-5 shadow-md cursor-pointer transition-all duration-200 group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-white text-base">Дати & Діячі</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Інтерактивні двосторонні картки обов'язкових дат та історичних діячів програми УЦОЯО з мнемоніками.
              </p>
            </div>
            <div className="pt-4 mt-2 border-t border-stone-800/80 flex items-center justify-between text-xs font-semibold text-amber-400 group-hover:translate-x-1 transition-transform">
              <span>Тренувати пам'ять</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Area: High-Yield Tips & Recent Attempts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High-Yield Tips */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <h3 className="font-heading font-bold text-white text-sm">Топ-пастки НМТ, де найчастіше втрачають бали:</h3>
          </div>

          <div className="space-y-2.5">
            {highYieldTips.map((tip, i) => (
              <div key={i} className="p-3 bg-stone-950 rounded-xl border border-stone-800/80 space-y-1">
                <span className="text-xs font-bold text-amber-400">{tip.title}</span>
                <p className="text-xs text-stone-300 leading-relaxed">{tip.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Attempts History */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <h3 className="font-heading font-bold text-white text-sm">Історія ваших спроб (у Vault):</h3>
            </div>
            <span className="text-[11px] text-stone-400 font-mono">{testsCount} спроб</span>
          </div>

          {testsCount === 0 ? (
            <div className="p-8 text-center bg-stone-950 rounded-xl border border-stone-800/80 text-stone-500 text-xs space-y-2">
              <p>Ви ще не складали симулятор НМТ.</p>
              <button
                onClick={() => setActiveTab('simulator')}
                className="px-4 py-2 bg-amber-500 text-stone-950 font-bold rounded-xl text-xs hover:bg-amber-400"
              >
                Пройти перший симулятор зараз
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {userData.completedTests.slice(0, 5).map((t) => (
                <div
                  key={t.id}
                  className="p-3 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-stone-200">Симулятор НМТ</span>
                    <p className="text-[10px] text-stone-500">{t.date}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-amber-400 text-sm">{t.nmtScaledScore} балів</span>
                    <p className="text-[10px] text-stone-400">{t.rawScore} / 54 тестових</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
