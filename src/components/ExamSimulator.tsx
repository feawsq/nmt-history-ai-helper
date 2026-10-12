import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Flag,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  Award,
  ArrowRight,
} from 'lucide-react';
import { Question, UserAnswerRecord, TestSessionResult } from '../types';
import { OFFICIAL_NMT_QUESTIONS, getScaledScore } from '../data/historyData';
import { geminiClient } from '../services/geminiClient';
import { privacyService } from '../services/privacyService';

interface ExamSimulatorProps {
  onFinishTest?: () => void;
  openScaleModal: () => void;
}

export const ExamSimulator: React.FC<ExamSimulatorProps> = ({ onFinishTest, openScaleModal }) => {
  const [questions] = useState<Question[]>(OFFICIAL_NMT_QUESTIONS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 60 minutes
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [markedForReview, setMarkedForReview] = useState<{ [qId: string]: boolean }>({});

  // User selections
  // single: number (index)
  // matching: { [leftId: number]: string }
  // chronology: string[] (order of event IDs)
  // multi: number[] (array of selected indices)
  const [userAnswers, setUserAnswers] = useState<{ [qId: string]: any }>({});

  // AI explanation state per question
  const [aiExplanations, setAiExplanations] = useState<{ [qId: string]: { text: string; loading: boolean } }>({});

  // Countdown timer
  useEffect(() => {
    if (!isTimerRunning || isSubmitted) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, isSubmitted]);

  const currentQ = questions[currentIndex];

  // Helper calculations for score
  const calculateResult = (): { rawScore: number; maxScore: number; records: UserAnswerRecord[] } => {
    let rawScore = 0;
    let maxScore = 54;
    const records: UserAnswerRecord[] = [];

    questions.forEach((q) => {
      const ans = userAnswers[q.id];
      let qPoints = 0;
      let qMax = 1;

      if (q.type === 'single') {
        qMax = 1;
        if (typeof ans === 'number' && ans === q.correctIndex) {
          qPoints = 1;
        }
      } else if (q.type === 'matching' && q.correctMatching) {
        qMax = 4;
        if (ans && typeof ans === 'object') {
          Object.entries(q.correctMatching).forEach(([key, val]) => {
            if (ans[Number(key)] === val) {
              qPoints += 1;
            }
          });
        }
      } else if (q.type === 'chronology' && q.correctChronologyOrder) {
        qMax = 3;
        // Official Ukrainian scoring for chronology:
        // 3 points if fully correct
        // 2 points if first and last correct
        // 1 point if at least 2 consecutive events correct
        if (Array.isArray(ans) && ans.length === 4) {
          const expected = q.correctChronologyOrder;
          const isFullyCorrect = ans.every((val, i) => val === expected[i]);
          if (isFullyCorrect) {
            qPoints = 3;
          } else if (ans[0] === expected[0] && ans[3] === expected[3]) {
            qPoints = 2;
          } else {
            let consecutiveMatch = 0;
            for (let i = 0; i < 3; i++) {
              if (ans[i] === expected[i] && ans[i + 1] === expected[i + 1]) {
                consecutiveMatch++;
              }
            }
            qPoints = consecutiveMatch > 0 ? 1 : 0;
          }
        }
      } else if (q.type === 'multi' && q.correctMultiIndices) {
        qMax = 3;
        if (Array.isArray(ans)) {
          const correctSet = new Set(q.correctMultiIndices);
          let matches = 0;
          ans.forEach((idx) => {
            if (correctSet.has(idx)) matches++;
          });
          qPoints = matches;
        }
      }

      rawScore += qPoints;
      records.push({
        questionId: q.id,
        userSelection: ans,
        isCorrect: qPoints === qMax,
        score: qPoints,
        maxScore: qMax,
        timestamp: Date.now(),
      });
    });

    return { rawScore, maxScore, records };
  };

  const handleSubmitTest = () => {
    setIsSubmitted(true);
    setIsTimerRunning(false);

    const { rawScore, maxScore, records } = calculateResult();
    const scaled = getScaledScore(rawScore);

    const testResult: TestSessionResult = {
      id: `test_${Date.now()}`,
      date: new Date().toLocaleDateString('uk-UA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
      type: 'full_simulation',
      totalQuestions: questions.length,
      rawScore,
      maxRawScore: maxScore,
      nmtScaledScore: scaled,
      timeSpentSeconds: 60 * 60 - timeLeft,
      answers: records,
    };

    // Save strictly locally
    privacyService.recordTestResult(testResult);
    if (onFinishTest) onFinishTest();
  };

  const handleRestart = () => {
    setUserAnswers({});
    setMarkedForReview({});
    setCurrentIndex(0);
    setTimeLeft(60 * 60);
    setIsTimerRunning(true);
    setIsSubmitted(false);
    setAiExplanations({});
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Request AI breakdown for current question
  const handleRequestAiExplain = async (q: Question) => {
    if (aiExplanations[q.id]?.loading || aiExplanations[q.id]?.text) return;

    setAiExplanations((prev) => ({
      ...prev,
      [q.id]: { text: '', loading: true },
    }));

    let selectedAnsStr = 'Не обрано';
    let correctAnsStr = '';
    const userVal = userAnswers[q.id];

    if (q.type === 'single') {
      selectedAnsStr = userVal !== undefined ? q.options?.[userVal] || 'Варіант' : 'Не обрано';
      correctAnsStr = q.options?.[q.correctIndex || 0] || '';
    } else if (q.type === 'matching') {
      selectedAnsStr = JSON.stringify(userVal || {});
      correctAnsStr = JSON.stringify(q.correctMatching || {});
    } else if (q.type === 'chronology') {
      selectedAnsStr = JSON.stringify(userVal || []);
      correctAnsStr = JSON.stringify(q.correctChronologyOrder || []);
    } else if (q.type === 'multi') {
      selectedAnsStr = (userVal || []).map((i: number) => q.multiOptions?.[i]).join(', ');
      correctAnsStr = (q.correctMultiIndices || []).map((i: number) => q.multiOptions?.[i]).join(', ');
    }

    const explanation = await geminiClient.explainQuestion({
      question: q.question,
      options: q.options || q.multiOptions,
      selectedAnswer: selectedAnsStr,
      correctAnswer: correctAnsStr,
      topic: q.topicTitle,
    });

    setAiExplanations((prev) => ({
      ...prev,
      [q.id]: { text: explanation, loading: false },
    }));
  };

  // Status of questions for the navigation grid
  const getQuestionStatus = (index: number) => {
    const q = questions[index];
    const isAnswered = userAnswers[q.id] !== undefined;
    const isFlagged = markedForReview[q.id];
    return { isAnswered, isFlagged };
  };

  // If submitted, show result banner and detailed review
  const testSummary = useMemo(() => {
    if (!isSubmitted) return null;
    return calculateResult();
  }, [isSubmitted, userAnswers]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header / Timer Bar */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold font-heading text-white">
              Національний мультипредметний тест: Історія України
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-md">
              Офіційний формат (30 завдань)
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            20 завдань з вибором 1 з 4 • 4 на відповідність • 3 на послідовність • 3 вибір 3 з 7
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer Display */}
          <div
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border font-mono text-sm font-bold ${
              timeLeft < 300
                ? 'bg-red-950/40 border-red-800 text-red-400 animate-pulse'
                : 'bg-stone-950 border-stone-800 text-amber-400'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>{isSubmitted ? 'Завершено' : formatTimer(timeLeft)}</span>
          </div>

          {!isSubmitted ? (
            <button
              onClick={handleSubmitTest}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-amber-500/20 transition-transform active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Завершити тест</span>
            </button>
          ) : (
            <button
              onClick={handleRestart}
              className="flex items-center gap-1.5 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-xl text-xs sm:text-sm font-medium transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Пройти ще раз</span>
            </button>
          )}
        </div>
      </div>

      {/* RESULT BANNER (when submitted) */}
      {isSubmitted && testSummary && (
        <div className="bg-gradient-to-br from-stone-900 to-stone-950 border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden animate-fadeIn">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-semibold">
                <Award className="w-4 h-4" />
                Тест успішно перевірено
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
                Ваш результат: <span className="text-amber-400">{getScaledScore(testSummary.rawScore)} балів</span>
              </h2>
              <p className="text-sm text-stone-300">
                Тестовий бал: <strong className="text-white font-mono">{testSummary.rawScore}</strong> із 54 можливих ({Math.round((testSummary.rawScore / 54) * 100)}%).
                {testSummary.rawScore >= 8 ? (
                  <span className="text-emerald-400 ml-2 font-semibold">Поріг складено!</span>
                ) : (
                  <span className="text-red-400 ml-2 font-semibold">Поріг (8 балів) не складено. Спробуйте ще!</span>
                )}
              </p>
              <p className="text-xs text-stone-400 flex items-center gap-2">
                <span>Час виконання: {Math.floor((60 * 60 - timeLeft) / 60)} хв {((60 * 60 - timeLeft) % 60)} с</span>
                <span>•</span>
                <span className="text-emerald-400">Збережено локально в Vault</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={openScaleModal}
                className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <span>Таблиця 100–200 балів</span>
              </button>
              <button
                onClick={handleRestart}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Нова спроба</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Test Grid / Question Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left / Navigation Sheet */}
        <div className="lg:col-span-1 bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 h-fit shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-300 uppercase tracking-wider">Лист відповідей</span>
            <span className="text-xs text-stone-400 font-mono">
              {Object.keys(userAnswers).length} / {questions.length}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const { isAnswered, isFlagged } = getQuestionStatus(idx);
              const isCurrent = currentIndex === idx;

              let btnClasses = 'border text-xs font-mono font-bold rounded-lg h-9 w-full flex items-center justify-center relative transition-all ';

              if (isSubmitted) {
                const record = testSummary?.records[idx];
                if (record?.isCorrect) {
                  btnClasses += isCurrent ? 'bg-emerald-600 text-white border-white' : 'bg-emerald-950/70 border-emerald-700 text-emerald-400';
                } else {
                  btnClasses += isCurrent ? 'bg-red-600 text-white border-white' : 'bg-red-950/70 border-red-800 text-red-400';
                }
              } else {
                if (isCurrent) {
                  btnClasses += 'bg-amber-500 text-stone-950 border-amber-400 shadow-md shadow-amber-500/20';
                } else if (isAnswered) {
                  btnClasses += 'bg-stone-800 text-stone-200 border-stone-700 hover:bg-stone-700';
                } else {
                  btnClasses += 'bg-stone-950 text-stone-500 border-stone-800 hover:bg-stone-900 hover:text-stone-300';
                }
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={btnClasses}
                >
                  {idx + 1}
                  {isFlagged && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-stone-800 text-[11px] text-stone-400 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-amber-500 shrink-0" />
              <span>Поточне завдання</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-stone-800 border border-stone-700 shrink-0" />
              <span>Відповідь надано</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-stone-950 border border-stone-800 shrink-0" />
              <span>Ще не відповіли</span>
            </div>
          </div>
        </div>

        {/* Center / Question Workspace */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 sm:p-7 shadow-lg relative">
            {/* Question Header */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-800 mb-5">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-bold font-mono">
                  Завдання {currentIndex + 1} з {questions.length}
                </span>
                <span className="text-xs text-stone-400 font-medium">
                  {currentQ.topicTitle}
                </span>
              </div>

              {!isSubmitted && (
                <button
                  onClick={() =>
                    setMarkedForReview((prev) => ({
                      ...prev,
                      [currentQ.id]: !prev[currentQ.id],
                    }))
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    markedForReview[currentQ.id]
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800 border border-stone-800'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{markedForReview[currentQ.id] ? 'Позначено' : 'Позначити'}</span>
                </button>
              )}
            </div>

            {/* Source text block if present */}
            {currentQ.sourceText && (
              <div className="p-4 bg-stone-950/80 border-l-4 border-amber-500 rounded-r-xl rounded-l-sm mb-5 text-stone-200 italic text-sm leading-relaxed font-serif">
                {currentQ.sourceText}
              </div>
            )}

            {/* Question title */}
            <p className="text-base sm:text-lg font-medium text-stone-100 leading-relaxed mb-6">
              {currentQ.question}
            </p>

            {/* Render interaction based on question type */}
            {/* TYPE 1: Single choice */}
            {currentQ.type === 'single' && currentQ.options && (
              <div className="space-y-3">
                {currentQ.options.map((opt, optIdx) => {
                  const letters = ['А', 'Б', 'В', 'Г'];
                  const letter = letters[optIdx];
                  const isSelected = userAnswers[currentQ.id] === optIdx;
                  const isCorrect = currentQ.correctIndex === optIdx;

                  let optClass = 'w-full p-4 rounded-xl border text-left text-sm flex items-start gap-3.5 transition-all ';

                  if (isSubmitted) {
                    if (isCorrect) {
                      optClass += 'bg-emerald-950/60 border-emerald-600 text-emerald-200 font-semibold';
                    } else if (isSelected && !isCorrect) {
                      optClass += 'bg-red-950/60 border-red-700 text-red-300';
                    } else {
                      optClass += 'bg-stone-950/40 border-stone-800 text-stone-400 opacity-70';
                    }
                  } else {
                    if (isSelected) {
                      optClass += 'bg-amber-500/10 border-amber-500 text-white font-medium shadow-sm';
                    } else {
                      optClass += 'bg-stone-950/50 border-stone-800 text-stone-300 hover:bg-stone-800/60 hover:border-stone-700';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      disabled={isSubmitted}
                      onClick={() =>
                        setUserAnswers((prev) => ({
                          ...prev,
                          [currentQ.id]: optIdx,
                        }))
                      }
                      className={optClass}
                    >
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold font-mono text-xs shrink-0 mt-0.5 ${
                          isSubmitted
                            ? isCorrect
                              ? 'bg-emerald-600 text-white'
                              : isSelected
                              ? 'bg-red-600 text-white'
                              : 'bg-stone-800 text-stone-400'
                            : isSelected
                            ? 'bg-amber-500 text-stone-950'
                            : 'bg-stone-800 text-stone-300'
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="leading-relaxed">{opt}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* TYPE 2: Matching (4 with 5) */}
            {currentQ.type === 'matching' && currentQ.matchingLeft && currentQ.matchingRight && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left column */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Цифри (1–4):</p>
                    {currentQ.matchingLeft.map((item) => (
                      <div key={item.id} className="p-3 bg-stone-950 border border-stone-800 rounded-xl text-xs flex gap-2.5">
                        <span className="w-5 h-5 rounded-md bg-stone-800 text-amber-400 font-bold font-mono flex items-center justify-center shrink-0">
                          {item.id}
                        </span>
                        <span className="text-stone-200">{item.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Right column */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-sky-400 mb-2">Букви (А–Д):</p>
                    {currentQ.matchingRight.map((item) => (
                      <div key={item.id} className="p-3 bg-stone-950 border border-stone-800 rounded-xl text-xs flex gap-2.5">
                        <span className="w-5 h-5 rounded-md bg-stone-800 text-sky-400 font-bold font-mono flex items-center justify-center shrink-0">
                          {item.id}
                        </span>
                        <span className="text-stone-300">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Matching input matrix */}
                <div className="p-4 bg-stone-950 border border-stone-800 rounded-xl">
                  <p className="text-xs font-semibold text-stone-300 mb-3">Виберіть логічні пари:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentQ.matchingLeft.map((leftItem) => {
                      const curMatch = userAnswers[currentQ.id]?.[leftItem.id] || '';
                      const correctMatch = currentQ.correctMatching?.[leftItem.id];
                      const isCorrect = isSubmitted && curMatch === correctMatch;

                      return (
                        <div key={leftItem.id} className="flex items-center justify-between p-2.5 bg-stone-900 border border-stone-800 rounded-lg">
                          <span className="text-xs font-bold text-stone-200">
                            Пункт {leftItem.id}:
                          </span>
                          <div className="flex gap-1.5">
                            {['А', 'Б', 'В', 'Г', 'Д'].map((letter) => {
                              const isChecked = curMatch === letter;
                              return (
                                <button
                                  key={letter}
                                  disabled={isSubmitted}
                                  onClick={() => {
                                    const prevObj = userAnswers[currentQ.id] || {};
                                    setUserAnswers((prev) => ({
                                      ...prev,
                                      [currentQ.id]: { ...prevObj, [leftItem.id]: letter },
                                    }));
                                  }}
                                  className={`w-7 h-7 rounded text-xs font-bold font-mono transition-colors ${
                                    isSubmitted
                                      ? correctMatch === letter
                                        ? 'bg-emerald-600 text-white'
                                        : isChecked
                                        ? 'bg-red-600 text-white'
                                        : 'bg-stone-800 text-stone-500'
                                      : isChecked
                                      ? 'bg-amber-500 text-stone-950'
                                      : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                                  }`}
                                >
                                  {letter}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TYPE 3: Chronology (sequence) */}
            {currentQ.type === 'chronology' && currentQ.chronologyEvents && (
              <div className="space-y-4">
                <p className="text-xs text-stone-400">
                  Розподіліть події в хронологічній послідовності від найранішої (1) до найпізнішої (4).
                </p>

                <div className="space-y-2">
                  {currentQ.chronologyEvents.map((ev, i) => {
                    const currentOrder: string[] = userAnswers[currentQ.id] || currentQ.chronologyEvents!.map((e) => e.id);
                    const positionIndex = currentOrder.indexOf(ev.id);

                    return (
                      <div
                        key={ev.id}
                        className="p-3.5 bg-stone-950 border border-stone-800 rounded-xl flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/30">
                            {positionIndex !== -1 ? positionIndex + 1 : i + 1}
                          </span>
                          <span className="text-xs sm:text-sm text-stone-200">{ev.text}</span>
                        </div>

                        {!isSubmitted && (
                          <div className="flex gap-1 shrink-0">
                            <button
                              title="Перемістити вище"
                              disabled={positionIndex <= 0}
                              onClick={() => {
                                const newOrder = [...currentOrder];
                                const target = positionIndex - 1;
                                [newOrder[positionIndex], newOrder[target]] = [newOrder[target], newOrder[positionIndex]];
                                setUserAnswers((prev) => ({
                                  ...prev,
                                  [currentQ.id]: newOrder,
                                }));
                              }}
                              className="px-2 py-1 bg-stone-800 hover:bg-stone-700 disabled:opacity-30 rounded text-xs text-stone-300"
                            >
                              ▲
                            </button>
                            <button
                              title="Перемістити нижче"
                              disabled={positionIndex >= currentOrder.length - 1}
                              onClick={() => {
                                const newOrder = [...currentOrder];
                                const target = positionIndex + 1;
                                [newOrder[positionIndex], newOrder[target]] = [newOrder[target], newOrder[positionIndex]];
                                setUserAnswers((prev) => ({
                                  ...prev,
                                  [currentQ.id]: newOrder,
                                }));
                              }}
                              className="px-2 py-1 bg-stone-800 hover:bg-stone-700 disabled:opacity-30 rounded text-xs text-stone-300"
                            >
                              ▼
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TYPE 4: Multi 3 of 7 */}
            {currentQ.type === 'multi' && currentQ.multiOptions && (
              <div className="space-y-3">
                <p className="text-xs text-stone-400 font-medium">
                  Оберіть рівно 3 правильні варіанти відповіді (вибрано: {(userAnswers[currentQ.id] || []).length} з 3):
                </p>
                {currentQ.multiOptions.map((opt, optIdx) => {
                  const selectedArr: number[] = userAnswers[currentQ.id] || [];
                  const isSelected = selectedArr.includes(optIdx);
                  const isCorrect = currentQ.correctMultiIndices?.includes(optIdx);

                  let optClass = 'w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm flex items-start gap-3 transition-colors ';
                  if (isSubmitted) {
                    if (isCorrect) {
                      optClass += 'bg-emerald-950/60 border-emerald-600 text-emerald-200 font-semibold';
                    } else if (isSelected && !isCorrect) {
                      optClass += 'bg-red-950/60 border-red-700 text-red-300';
                    } else {
                      optClass += 'bg-stone-950/40 border-stone-800 text-stone-400 opacity-60';
                    }
                  } else {
                    if (isSelected) {
                      optClass += 'bg-amber-500/20 border-amber-500 text-white font-medium';
                    } else {
                      optClass += 'bg-stone-950/60 border-stone-800 text-stone-300 hover:bg-stone-800/60';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      disabled={isSubmitted}
                      onClick={() => {
                        let updated = [...selectedArr];
                        if (isSelected) {
                          updated = updated.filter((i) => i !== optIdx);
                        } else {
                          if (updated.length < 3) {
                            updated.push(optIdx);
                          }
                        }
                        setUserAnswers((prev) => ({
                          ...prev,
                          [currentQ.id]: updated,
                        }));
                      }}
                      className={optClass}
                    >
                      <span
                        className={`w-5 h-5 rounded flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                          isSelected ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-400'
                        }`}
                      >
                        {optIdx + 1}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Explanation & AI Assistant section (Visible after submit or on demand) */}
            {isSubmitted && (
              <div className="mt-8 pt-6 border-t border-stone-800 space-y-4">
                <div className="p-4 bg-stone-950 border border-stone-800 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Офіційне пояснення УЦОЯО:</span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
                    {currentQ.explanation}
                  </p>
                  {currentQ.mnemonic && (
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300 font-medium">
                      🧠 <strong>Мнемоніка для пам'яті:</strong> {currentQ.mnemonic}
                    </div>
                  )}
                </div>

                {/* AI Analysis Button */}
                <div className="space-y-3">
                  {!aiExplanations[currentQ.id]?.text && (
                    <button
                      onClick={() => handleRequestAiExplain(currentQ)}
                      disabled={aiExplanations[currentQ.id]?.loading}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                    >
                      {aiExplanations[currentQ.id]?.loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>ШІ аналізує помилку...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-stone-950" />
                          <span>✨ Запитати ШІ-розбір у Кліо (чому помилився & пастки НМТ)</span>
                        </>
                      )}
                    </button>
                  )}

                  {aiExplanations[currentQ.id]?.text && (
                    <div className="p-4 bg-amber-950/20 border border-amber-600/30 rounded-xl text-xs sm:text-sm text-stone-200 space-y-2 leading-relaxed animate-fadeIn">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Розбір від ШІ-тьютора Кліо:</span>
                      </div>
                      <div className="whitespace-pre-line text-stone-300">
                        {aiExplanations[currentQ.id].text}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-stone-800">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:pointer-events-none text-stone-200 rounded-xl text-xs font-medium transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Назад</span>
              </button>

              <span className="text-xs text-stone-400 font-mono">
                {currentIndex + 1} / {questions.length}
              </span>

              <button
                disabled={currentIndex === questions.length - 1}
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:pointer-events-none text-stone-200 rounded-xl text-xs font-medium transition-colors"
              >
                <span>Далі</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
