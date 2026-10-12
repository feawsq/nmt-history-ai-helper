import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronRight,
  Loader2,
  Calendar,
  Layers,
  FileEdit,
  Save,
} from 'lucide-react';
import { TOPICS_LIST, OFFICIAL_NMT_QUESTIONS } from '../data/historyData';
import { Question, TopicInfo } from '../types';
import { geminiClient } from '../services/geminiClient';
import { privacyService } from '../services/privacyService';

interface TopicPracticeProps {
  onStartExam?: () => void;
}

export const TopicPractice: React.FC<TopicPracticeProps> = () => {
  const [selectedTopic, setSelectedTopic] = useState<TopicInfo>(TOPICS_LIST[0]);
  const [activeTab, setActiveTab] = useState<'questions' | 'notes' | 'ai_gen'>('questions');
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: string]: number }>({});
  const [showAnswer, setShowAnswer] = useState<{ [qId: string]: boolean }>({});

  // AI-generated questions state
  const [aiQuestions, setAiQuestions] = useState<Question[]>([]);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Local private note
  const initialData = privacyService.loadUserData();
  const [noteText, setNoteText] = useState(initialData.notes[selectedTopic.id] || '');
  const [savedNoteStatus, setSavedNoteStatus] = useState<string | null>(null);

  // Filter built-in questions for selected topic
  const topicQuestions = OFFICIAL_NMT_QUESTIONS.filter(
    (q) => q.topicId === selectedTopic.id && q.type === 'single'
  );

  const handleSelectTopic = (topic: TopicInfo) => {
    setSelectedTopic(topic);
    setSelectedAnswers({});
    setShowAnswer({});
    setAiQuestions([]);
    setAiError(null);
    const data = privacyService.loadUserData();
    setNoteText(data.notes[topic.id] || '');
    setSavedNoteStatus(null);
  };

  const handleSaveNote = () => {
    privacyService.saveNote(String(selectedTopic.id), noteText);
    setSavedNoteStatus('✅ Збережено на вашому пристрої!');
    setTimeout(() => setSavedNoteStatus(null), 2500);
  };

  // Generate new questions via Gemini
  const handleGenerateAiQuestions = async () => {
    setIsGeneratingAi(true);
    setAiError(null);
    try {
      const generated = await geminiClient.generateQuestions(selectedTopic.title, 3, 'single');
      if (generated.length === 0) {
        setAiError('Не вдалося згенерувати завдання. Спробуйте ще раз.');
      } else {
        setAiQuestions(generated);
      }
    } catch {
      setAiError('Помилка генерації через ШІ.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <BookOpen className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-white">
              Тематичний тренажер програми НМТ
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            10 офіційних історичних блоків з детальними конспектами, тестами та ШІ-генерацією завдань.
          </p>
        </div>

        <button
          onClick={handleGenerateAiQuestions}
          disabled={isGeneratingAi}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-transform active:scale-95 disabled:opacity-50"
        >
          {isGeneratingAi ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>ШІ створює тести...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Згенерувати авторські тести ШІ</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Topics List */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-wider px-2">Теми програми УЦОЯО</p>
          <div className="space-y-1.5 max-h-[650px] overflow-y-auto pr-1">
            {TOPICS_LIST.map((topic) => {
              const isSelected = selectedTopic.id === topic.id;
              return (
                <button
                  key={topic.id}
                  onClick={() => handleSelectTopic(topic)}
                  className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500 text-white shadow-sm'
                      : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800/80 hover:border-stone-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] font-mono shrink-0 ${
                          isSelected ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-400'
                        }`}
                      >
                        {topic.id}
                      </span>
                      <span className="font-semibold line-clamp-1">{topic.title}</span>
                    </div>
                    <p className="text-[11px] text-stone-400 pl-7">{topic.period}</p>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected ? 'text-amber-400 translate-x-0.5' : 'text-stone-600'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Active Topic Workspace */}
        <div className="lg:col-span-2 space-y-5">
          {/* Active Topic Banner */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-md text-xs font-mono font-bold">
                Тема {selectedTopic.id} • {selectedTopic.period}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-heading text-white">
              {selectedTopic.title}
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              {selectedTopic.description}
            </p>

            {/* Key events list */}
            <div className="p-3.5 bg-stone-950 rounded-xl border border-stone-800 space-y-1.5">
              <p className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Обов'язкові дати теми:</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-300 pt-1">
                {selectedTopic.keyEvents.map((ev, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span>{ev}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sub-navigation tabs */}
            <div className="flex items-center gap-2 pt-2 border-t border-stone-800">
              <button
                onClick={() => setActiveTab('questions')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'questions'
                    ? 'bg-amber-500 text-stone-950'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Базові тести ({topicQuestions.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('ai_gen')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'ai_gen'
                    ? 'bg-amber-500 text-stone-950'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>ШІ-Генератор ({aiQuestions.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('notes')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'notes'
                    ? 'bg-amber-500 text-stone-950'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                <FileEdit className="w-3.5 h-3.5" />
                <span>Мій конспект (локально)</span>
              </button>
            </div>
          </div>

          {/* TAB 1: Built-in Topic Questions */}
          {activeTab === 'questions' && (
            <div className="space-y-4">
              {topicQuestions.length === 0 ? (
                <div className="p-8 text-center bg-stone-900 border border-stone-800 rounded-2xl text-stone-400 text-sm space-y-3">
                  <p>У цій темі поки що немає одиночних питань у банку за замовчуванням.</p>
                  <button
                    onClick={handleGenerateAiQuestions}
                    className="px-4 py-2 bg-amber-500 text-stone-950 font-bold rounded-xl text-xs"
                  >
                    Згенерувати авторські питання через ШІ
                  </button>
                </div>
              ) : (
                topicQuestions.map((q, idx) => {
                  const userChoice = selectedAnswers[q.id];
                  const isAnswered = userChoice !== undefined;
                  const isRevealed = showAnswer[q.id];
                  const isCorrect = userChoice === q.correctIndex;

                  return (
                    <div
                      key={q.id}
                      className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-sm space-y-4"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-amber-400 font-bold">
                          Питання #{idx + 1}
                        </span>
                        {isAnswered && (
                          <span
                            className={`flex items-center gap-1 font-semibold ${
                              isCorrect ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {isCorrect ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" /> Правильно (+1 бал)
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4" /> Помилка (0 балів)
                              </>
                            )}
                          </span>
                        )}
                      </div>

                      {q.sourceText && (
                        <div className="p-3 bg-stone-950 border-l-2 border-amber-500 rounded-r-lg text-xs italic text-stone-300 font-serif">
                          {q.sourceText}
                        </div>
                      )}

                      <p className="text-sm font-medium text-stone-100">{q.question}</p>

                      <div className="space-y-2">
                        {q.options?.map((opt, optIdx) => {
                          const letters = ['А', 'Б', 'В', 'Г'];
                          const isSelected = userChoice === optIdx;
                          const isTargetCorrect = q.correctIndex === optIdx;

                          let btnStyle = 'w-full p-3 rounded-xl border text-left text-xs flex items-center gap-3 transition-colors ';

                          if (isAnswered) {
                            if (isTargetCorrect) {
                              btnStyle += 'bg-emerald-950/60 border-emerald-600 text-emerald-200 font-semibold';
                            } else if (isSelected && !isTargetCorrect) {
                              btnStyle += 'bg-red-950/60 border-red-700 text-red-300';
                            } else {
                              btnStyle += 'bg-stone-950/40 border-stone-800 text-stone-500 opacity-60';
                            }
                          } else {
                            btnStyle += 'bg-stone-950/60 border-stone-800 text-stone-300 hover:bg-stone-800/80';
                          }

                          return (
                            <button
                              key={optIdx}
                              disabled={isAnswered}
                              onClick={() => {
                                setSelectedAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
                                setShowAnswer((prev) => ({ ...prev, [q.id]: true }));
                              }}
                              className={btnStyle}
                            >
                              <span className="w-5 h-5 rounded bg-stone-800 text-stone-300 font-mono font-bold flex items-center justify-center shrink-0">
                                {letters[optIdx]}
                              </span>
                              <span>{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      {isRevealed && (
                        <div className="pt-3 border-t border-stone-800 text-xs text-stone-300 space-y-2 bg-stone-950/50 p-3 rounded-xl">
                          <p>
                            <strong className="text-amber-400">Пояснення:</strong> {q.explanation}
                          </p>
                          {q.mnemonic && (
                            <p className="text-amber-300">
                              🧠 <strong>Мнемоніка:</strong> {q.mnemonic}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: AI Generated Questions */}
          {activeTab === 'ai_gen' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3">
                <div className="text-xs text-stone-300">
                  <p className="font-semibold text-amber-400">Адаптивна генерація від Gemini 3.8 Flash</p>
                  <p className="text-stone-400 mt-0.5">
                    ШІ генерує свіжі завдання, що імітують стиль і дистрактори справжнього НМТ.
                  </p>
                </div>
                <button
                  onClick={handleGenerateAiQuestions}
                  disabled={isGeneratingAi}
                  className="px-3.5 py-2 bg-amber-500 text-stone-950 font-bold rounded-xl text-xs shrink-0 flex items-center gap-1.5 hover:bg-amber-400"
                >
                  {isGeneratingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Згенерувати</span>
                </button>
              </div>

              {aiError && (
                <div className="p-3 bg-red-950/40 border border-red-900 text-xs text-red-300 rounded-xl">
                  {aiError}
                </div>
              )}

              {aiQuestions.length === 0 && !isGeneratingAi && (
                <div className="p-8 text-center bg-stone-900 border border-stone-800 rounded-2xl text-stone-400 text-xs">
                  Натисніть кнопку «Згенерувати», щоб отримати унікальні тренувальні тести для теми «{selectedTopic.title}».
                </div>
              )}

              {aiQuestions.map((q, idx) => {
                const userChoice = selectedAnswers[q.id];
                const isAnswered = userChoice !== undefined;
                const isCorrect = userChoice === q.correctIndex;

                return (
                  <div key={q.id} className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-amber-400 font-bold">
                        ШІ-Завдання #{idx + 1}
                      </span>
                      {isAnswered && (
                        <span className={`font-semibold ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isCorrect ? 'Правильно!' : 'Помилка!'}
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-medium text-stone-100">{q.question}</p>

                    <div className="space-y-2">
                      {q.options?.map((opt, optIdx) => {
                        const letters = ['А', 'Б', 'В', 'Г'];
                        const isSelected = userChoice === optIdx;
                        const isTargetCorrect = q.correctIndex === optIdx;

                        let btnStyle = 'w-full p-3 rounded-xl border text-left text-xs flex items-center gap-3 transition-colors ';
                        if (isAnswered) {
                          if (isTargetCorrect) {
                            btnStyle += 'bg-emerald-950/60 border-emerald-600 text-emerald-200 font-semibold';
                          } else if (isSelected && !isTargetCorrect) {
                            btnStyle += 'bg-red-950/60 border-red-700 text-red-300';
                          } else {
                            btnStyle += 'bg-stone-950/40 border-stone-800 text-stone-500 opacity-60';
                          }
                        } else {
                          btnStyle += 'bg-stone-950/60 border-stone-800 text-stone-300 hover:bg-stone-800/80';
                        }

                        return (
                          <button
                            key={optIdx}
                            disabled={isAnswered}
                            onClick={() => {
                              setSelectedAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
                              setShowAnswer((prev) => ({ ...prev, [q.id]: true }));
                            }}
                            className={btnStyle}
                          >
                            <span className="w-5 h-5 rounded bg-stone-800 text-stone-300 font-mono font-bold flex items-center justify-center shrink-0">
                              {letters[optIdx]}
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {showAnswer[q.id] && (
                      <div className="pt-3 border-t border-stone-800 text-xs text-stone-300 space-y-1.5 bg-stone-950/50 p-3 rounded-xl">
                        <p>
                          <strong className="text-amber-400">Розбір:</strong> {q.explanation}
                        </p>
                        {q.mnemonic && (
                          <p className="text-amber-300">
                            🧠 <strong>Мнемоніка:</strong> {q.mnemonic}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: Local Private Notes */}
          {activeTab === 'notes' && (
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Мій приватний конспект до теми</h3>
                  <p className="text-xs text-stone-400">Зберігається виключно на цьому пристрої у LocalStorage</p>
                </div>
                <button
                  onClick={handleSaveNote}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Зберегти</span>
                </button>
              </div>

              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Запишіть свої асоціації, складні дати або пам'ятки цієї теми..."
                rows={8}
                className="w-full p-4 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500/80 resize-none font-mono leading-relaxed"
              />

              {savedNoteStatus && (
                <p className="text-xs text-emerald-400 font-medium text-right">{savedNoteStatus}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
