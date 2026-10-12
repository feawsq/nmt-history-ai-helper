import React from 'react';
import { X, Award, HelpCircle } from 'lucide-react';
import { RAW_TO_SCALED_SCORE } from '../data/historyData';

interface ScoreScaleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScoreScaleModal: React.FC<ScoreScaleModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const scoreRows = Object.entries(RAW_TO_SCALED_SCORE).map(([raw, scaled]) => ({
    raw: Number(raw),
    scaled,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-2xl w-full p-6 text-stone-100 shadow-2xl relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-100 p-1 rounded-lg hover:bg-stone-800 transition-colors"
          aria-label="Закрити"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-heading text-white">Офіційна шкала переведення балів НМТ</h2>
            <p className="text-xs text-stone-400">Таблиця відповідності тестових балів (0–54) до рейтингової шкали 100–200 балів</p>
          </div>
        </div>

        <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 mb-4 text-xs text-stone-300 flex items-start gap-2 shrink-0">
          <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            Для проходження порогового балу на НМТ з історії України необхідно набрати щонайменше <strong>8 тестових балів</strong> (що дорівнює 100 балам). Максимум — <strong>54 тестових бали = 200 балів</strong>.
          </p>
        </div>

        <div className="overflow-y-auto flex-1 pr-1 border border-stone-800 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-stone-950 sticky top-0 border-b border-stone-800">
              <tr>
                <th className="p-2.5 text-stone-400 font-semibold">Тестовий бал</th>
                <th className="p-2.5 text-stone-400 font-semibold">Рейтинговий бал (100–200)</th>
                <th className="p-2.5 text-stone-400 font-semibold">Оцінка рівня</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 font-mono">
              {scoreRows.map(({ raw, scaled }) => {
                let badge = 'Не склав';
                let badgeColor = 'text-red-400';
                if (scaled >= 190) {
                  badge = 'Відмінно (Топ)';
                  badgeColor = 'text-emerald-400';
                } else if (scaled >= 170) {
                  badge = 'Високий';
                  badgeColor = 'text-amber-400';
                } else if (scaled >= 140) {
                  badge = 'Достатній';
                  badgeColor = 'text-sky-400';
                } else if (scaled >= 100) {
                  badge = 'Базовий поріг';
                  badgeColor = 'text-stone-300';
                }

                return (
                  <tr key={raw} className={raw % 2 === 0 ? 'bg-stone-900/40' : 'bg-stone-900/90'}>
                    <td className="p-2.5 font-bold text-stone-200">{raw}</td>
                    <td className="p-2.5 font-bold text-amber-400">{scaled === 0 ? '—' : scaled}</td>
                    <td className={`p-2.5 font-sans font-medium text-xs ${badgeColor}`}>{badge}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 pt-3 border-t border-stone-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold transition-colors"
          >
            Зрозуміло
          </button>
        </div>
      </div>
    </div>
  );
};
