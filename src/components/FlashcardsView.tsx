import React, { useState } from 'react';
import {
  Layers,
  Star,
  RotateCw,
  Check,
  RotateCcw,
  Sparkles,
  UserCheck,
  Calendar,
  Shuffle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { HISTORICAL_DATES, HISTORICAL_FIGURES } from '../data/historyData';
import { HistoricalDate, HistoricalFigure } from '../types';
import { privacyService } from '../services/privacyService';

export const FlashcardsView: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'dates' | 'figures'>('dates');
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [filterFavorites, setFilterFavorites] = useState(false);

  // Private local state
  const userData = privacyService.loadUserData();
  const [favoriteDates, setFavoriteDates] = useState<string[]>(userData.favoriteDates);
  const [favoriteFigures, setFavoriteFigures] = useState<string[]>(userData.favoriteFigures);

  // Lists
  const datesList = filterFavorites
    ? HISTORICAL_DATES.filter((d) => favoriteDates.includes(d.id))
    : HISTORICAL_DATES;

  const figuresList = filterFavorites
    ? HISTORICAL_FIGURES.filter((f) => favoriteFigures.includes(f.id))
    : HISTORICAL_FIGURES;

  const currentList = activeMode === 'dates' ? datesList : figuresList;
  const currentItem = currentList[cardIndex] || currentList[0];

  const handleNext = () => {
    setIsFlipped(false);
    setCardIndex((prev) => (prev + 1) % (currentList.length || 1));
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCardIndex((prev) => (prev - 1 + currentList.length) % (currentList.length || 1));
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    const randomIndex = Math.floor(Math.random() * currentList.length);
    setCardIndex(randomIndex);
  };

  const toggleFavorite = (id: string) => {
    if (activeMode === 'dates') {
      privacyService.toggleFavoriteDate(id);
      const updated = privacyService.loadUserData();
      setFavoriteDates(updated.favoriteDates);
    } else {
      privacyService.toggleFavoriteFigure(id);
      const updated = privacyService.loadUserData();
      setFavoriteFigures(updated.favoriteFigures);
    }
  };

  const isCurrentFavorite = currentItem
    ? activeMode === 'dates'
      ? favoriteDates.includes(currentItem.id)
      : favoriteFigures.includes(currentItem.id)
    : false;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-white">
              Флеш-картки: Дати & Персоналії
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Інтерактивне запам'ятовування з мнемонічними асоціаціями та ключовими маркерами УЦОЯО.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-2 p-1 bg-stone-950 border border-stone-800 rounded-xl">
          <button
            onClick={() => {
              setActiveMode('dates');
              setCardIndex(0);
              setIsFlipped(false);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeMode === 'dates'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Обов'язкові дати ({HISTORICAL_DATES.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('figures');
              setCardIndex(0);
              setIsFlipped(false);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeMode === 'figures'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Діячі програми ({HISTORICAL_FIGURES.length})</span>
          </button>
        </div>
      </div>

      {/* Filter and Shuffle Controls */}
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setFilterFavorites(!filterFavorites);
              setCardIndex(0);
              setIsFlipped(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
              filterFavorites
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${filterFavorites ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>Тільки збережені</span>
          </button>

          <button
            onClick={handleShuffle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-stone-400 border border-stone-800 hover:text-stone-200 transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5 text-stone-400" />
            <span>Перемішати</span>
          </button>
        </div>

        <span className="text-stone-400 font-mono">
          Картка {currentList.length > 0 ? cardIndex + 1 : 0} з {currentList.length}
        </span>
      </div>

      {/* Main Flashcard Container */}
      {currentList.length === 0 ? (
        <div className="p-12 text-center bg-stone-900 border border-stone-800 rounded-3xl text-stone-400 text-sm">
          У вибраному поки що немає карток. Натисніть на зірочку ⭐ на будь-якій картці, щоб додати її сюди.
        </div>
      ) : (
        <div className="space-y-6">
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="relative min-h-[340px] sm:min-h-[380px] bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 border border-stone-800 hover:border-amber-500/50 rounded-3xl p-7 sm:p-9 shadow-2xl cursor-pointer transition-all duration-300 flex flex-col justify-between group select-none"
          >
            {/* Top Bar inside card */}
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-stone-950 text-amber-400 border border-stone-800 text-xs font-mono font-bold">
                {activeMode === 'dates' ? (currentItem as HistoricalDate).period : (currentItem as HistoricalFigure).role}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(currentItem.id);
                  }}
                  className={`p-2 rounded-xl transition-colors ${
                    isCurrentFavorite
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-stone-950 text-stone-500 hover:text-amber-400'
                  }`}
                  title={isCurrentFavorite ? 'Видалити з обраного' : 'Додати в обране'}
                >
                  <Star className={`w-4 h-4 ${isCurrentFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                </button>
                <div className="text-stone-500 group-hover:text-stone-300 text-xs flex items-center gap-1 transition-colors">
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Перевернути</span>
                </div>
              </div>
            </div>

            {/* Front vs Back Content */}
            {!isFlipped ? (
              /* FRONT */
              <div className="my-auto text-center py-6 space-y-4">
                {activeMode === 'dates' ? (
                  <>
                    <span className="text-4xl sm:text-6xl font-extrabold font-heading text-amber-400 tracking-tight">
                      {(currentItem as HistoricalDate).year}
                    </span>
                    <p className="text-base sm:text-lg text-stone-300 max-w-lg mx-auto">
                      {(currentItem as HistoricalDate).event}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-heading text-2xl font-bold mx-auto">
                      {(currentItem as HistoricalFigure).name.slice(0, 2)}
                    </div>
                    <span className="text-2xl sm:text-3xl font-extrabold font-heading text-white block">
                      {(currentItem as HistoricalFigure).name}
                    </span>
                    <span className="text-xs font-mono text-stone-400 block">
                      {(currentItem as HistoricalFigure).years}
                    </span>
                  </>
                )}
                <p className="text-[11px] text-stone-500">Натисніть на картку, щоб побачити розбір та мнемоніку</p>
              </div>
            ) : (
              /* BACK */
              <div className="my-auto py-4 space-y-4 animate-fadeIn">
                {activeMode === 'dates' ? (
                  <>
                    <div className="space-y-2">
                      <p className="text-xs uppercase font-bold text-amber-400 tracking-wider">Суть та контекст для НМТ:</p>
                      <p className="text-sm sm:text-base text-stone-200 leading-relaxed">
                        {(currentItem as HistoricalDate).details}
                      </p>
                    </div>

                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1">
                      <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Мнемоніка для запам'ятовування:
                      </p>
                      <p className="text-xs sm:text-sm text-stone-300 italic font-medium">
                        {(currentItem as HistoricalDate).mnemonicHint}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <p className="text-xs uppercase font-bold text-amber-400 tracking-wider">Ключовий внесок:</p>
                      <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
                        {(currentItem as HistoricalFigure).contribution}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-xs uppercase font-bold text-sky-400 tracking-wider">Маркери для тестів:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(currentItem as HistoricalFigure).keyMarkers.map((marker, mIdx) => (
                          <span
                            key={mIdx}
                            className="px-2.5 py-1 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-300 font-mono"
                          >
                            • {marker}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Bottom footer inside card */}
            <div className="flex items-center justify-between text-xs text-stone-500 pt-4 border-t border-stone-800/80">
              <span>{isFlipped ? 'Оберніть назад для самоперевірки' : 'Клікніть для перевороту'}</span>
              <span className="font-mono">{cardIndex + 1} / {currentList.length}</span>
            </div>
          </div>

          {/* Nav Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handlePrev}
              className="p-3 bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-200 rounded-2xl transition-colors"
              title="Попередня картка"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="px-6 py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-semibold rounded-2xl text-xs sm:text-sm transition-colors flex items-center gap-2"
            >
              <RotateCw className="w-4 h-4 text-amber-400" />
              <span>{isFlipped ? 'Сховати зворот' : 'Показати розбір'}</span>
            </button>

            <button
              onClick={handleNext}
              className="p-3 bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-200 rounded-2xl transition-colors"
              title="Наступна картка"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
