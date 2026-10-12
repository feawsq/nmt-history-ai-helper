import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Loader2,
  Key,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { HISTORICAL_SOURCES } from '../data/historyData';
import { geminiClient } from '../services/geminiClient';

export const SourceDecoder: React.FC = () => {
  const [inputText, setInputText] = useState(HISTORICAL_SOURCES[0].text);
  const [selectedPresetId, setSelectedPresetId] = useState(HISTORICAL_SOURCES[0].id);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectPreset = (src: (typeof HISTORICAL_SOURCES)[0]) => {
    setSelectedPresetId(src.id);
    setInputText(src.text);
    setAnalysisResult(null);
  };

  const handleAnalyze = async () => {
    if (!inputText.trim() || isLoading) return;
    setIsLoading(true);
    setAnalysisResult(null);
    try {
      const res = await geminiClient.analyzeSource(inputText);
      setAnalysisResult(res);
    } catch {
      setAnalysisResult('Не вдалося виконати аналіз джерела. Спробуйте ще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-white">
              Детектив історичних джерел
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Розбір автентичних цитат з літописів та універсалів. ШІ вчить миттєво впізнавати маркерні слова в тестах.
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 rounded-xl text-xs font-medium">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Конфіденційний аналіз</span>
        </div>
      </div>

      {/* Preset Library Buttons */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-stone-400 uppercase tracking-wider px-1">
          Популярні джерела тестів НМТ:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          {HISTORICAL_SOURCES.map((src) => {
            const isSelected = selectedPresetId === src.id;
            return (
              <button
                key={src.id}
                onClick={() => handleSelectPreset(src)}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500 text-white font-semibold'
                    : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800'
                }`}
              >
                <span className="block text-[11px] text-amber-400 font-mono">{src.year}</span>
                <span className="line-clamp-1">{src.docType}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Textarea Input */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-stone-200 uppercase tracking-wider">
            Текст уривка або цитати для розбору:
          </label>
          <span className="text-xs text-stone-500">Можна вставити будь-яку цитату з тесту</span>
        </div>

        <textarea
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            setSelectedPresetId('');
          }}
          rows={5}
          placeholder="Вставте сюди уривок літопису, грамоти, універсалу або спогадів..."
          className="w-full p-4 bg-stone-950 border border-stone-800 rounded-xl text-xs sm:text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500/80 resize-none font-serif leading-relaxed italic"
        />

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-stone-400">
            {inputText.length} символів
          </span>

          <button
            onClick={handleAnalyze}
            disabled={!inputText.trim() || isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-transform active:scale-95"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>ШІ декодує джерело...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Розпізнати документ через ШІ</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Output */}
      {analysisResult && (
        <div className="bg-stone-900 border border-amber-500/40 rounded-2xl p-6 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-400 pb-2 border-b border-stone-800">
            <Key className="w-5 h-5 text-amber-400" />
            <span>Історичний паспорт документа від Кліо:</span>
          </div>

          <div className="text-xs sm:text-sm text-stone-200 leading-relaxed whitespace-pre-line space-y-2">
            {analysisResult}
          </div>
        </div>
      )}
    </div>
  );
};
