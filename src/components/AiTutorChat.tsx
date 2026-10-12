import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  Trash2,
  ShieldCheck,
  Bot,
  User,
  Lightbulb,
  HelpCircle,
} from 'lucide-react';
import { geminiClient, ChatMessage } from '../services/geminiClient';

export const AiTutorChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Привіт! Я **Кліо** — твій персональний ШІ-тьютор з історії України для підготовки до НМТ.\n\nЗапитай мене про будь-яку дату, історичну постать, розбір складного документа чи пастки тестів УЦОЯО. Жодних персональних даних я не збираю!',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const starterPrompts = [
    'Як швидко розрізняти I, II, III і IV Універсали УЦР за маркерами?',
    'Поясни різницю між Валуєвським циркуляром (1863) та Емським указом (1876)',
    'Дай мені мнемоніку для запам\'ятовування битв Хмельниччини',
    'Які пам\'ятки архітектури найчастіше трапляються у візуальних тестах?',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    setInput('');
    const newMsgList: ChatMessage[] = [...messages, { role: 'user', content: query }];
    setMessages(newMsgList);
    setIsLoading(true);

    try {
      const answer = await geminiClient.askTutor(query, newMsgList);
      setMessages([...newMsgList, { role: 'assistant', content: answer }]);
    } catch {
      setMessages([
        ...newMsgList,
        {
          role: 'assistant',
          content: 'Вибачте, сталася помилка з\'єднання. Спробуйте ще раз.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Діалог очищено! Про що з історії України хочеш дізнатися зараз?',
      },
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-white">
              ШІ-Тьютор «Кліо» (Gemini 3.8 Flash)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Інтерактивний репетитор: розбір складних тем, мнемонічні правила та лайфхаки складання на 200 балів.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 rounded-xl text-xs font-medium">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Анонімний сеанс (No logs)</span>
          </div>
          <button
            onClick={handleClearChat}
            className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 rounded-xl transition-colors"
            title="Очистити чат"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick starter chips */}
      <div className="flex flex-wrap gap-2">
        {starterPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p)}
            className="text-xs px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-300 border border-stone-800 rounded-xl transition-colors text-left flex items-center gap-1.5"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{p}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-xl min-h-[460px] max-h-[580px] overflow-y-auto space-y-4">
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={idx}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-amber-500 text-stone-950'
                    : 'bg-stone-800 text-amber-400 border border-stone-700'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-amber-500/20 border border-amber-500/40 text-stone-100'
                    : 'bg-stone-950/80 border border-stone-800 text-stone-200'
                }`}
              >
                <div className="whitespace-pre-line prose prose-invert prose-xs max-w-none">
                  {m.content}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-stone-800 text-amber-400 border border-stone-700 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 bg-stone-950 border border-stone-800 rounded-2xl text-xs text-stone-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Кліо генерує історичний розбір...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-2.5 flex items-center gap-2 shadow-lg">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          placeholder="Запитайте Кліо: наприклад, «Як запам'ятати дати повстань козаків 1630-х?»..."
          className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none"
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={!input.trim() || isLoading}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-transform active:scale-95"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Надіслати</span>
        </button>
      </div>
    </div>
  );
};
