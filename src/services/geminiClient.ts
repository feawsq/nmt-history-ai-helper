import { Question } from '../types';

export interface ExplainRequest {
  question: string;
  options?: string[];
  selectedAnswer?: string;
  correctAnswer: string;
  topic?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const geminiClient = {
  // Get AI explanation for test question
  async explainQuestion(data: ExplainRequest): Promise<string> {
    try {
      const res = await fetch('/api/gemini/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const msg = errorData.details || errorData.error || 'Сервер не відповів';
        return `⚠️ **Помилка ШІ:** ${msg}\n\n💡 **Правильна відповідь:** ${data.correctAnswer}.`;
      }

      const json = await res.json();
      return json.explanation;
    } catch (err: any) {
      console.warn('AI explain error:', err);
      return `💡 **Швидке пояснення (офлайн):** Правильна відповідь: **${data.correctAnswer}**.`;
    }
  },

  // Interactive AI Tutor "Кліо"
  async askTutor(query: string, history: ChatMessage[] = []): Promise<string> {
    try {
      const res = await fetch('/api/gemini/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, history }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const errorDetail = err.details || err.error;
        if (errorDetail) {
          return `⚠️ **Помилка Gemini API:**\n\n${errorDetail}\n\n*Перевірте файл \`.env\` у папці проєкту: ключ Gemini API повинен починатися з \`AIzaSy...\`.*`;
        }
        throw new Error('Помилка сервера');
      }

      const json = await res.json();
      return json.answer;
    } catch (err: any) {
      console.warn('AI tutor error:', err);
      return '⚠️ Не вдалося зв\'язатися з локальним сервером. Переконайтеся, що `npm run dev` запущено у терміналі.';
    }
  },

  // Generate adaptive questions
  async generateQuestions(topic: string, count: number = 3, type: 'single' | 'source' = 'single'): Promise<Question[]> {
    try {
      const res = await fetch('/api/gemini/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, count, type }),
      });

      if (!res.ok) {
        throw new Error('Не вдалося згенерувати запитання');
      }

      const json = await res.json();
      return json.questions || [];
    } catch (err) {
      console.warn('AI question generator error:', err);
      return [];
    }
  },

  // Analyze historical source
  async analyzeSource(documentSnippet: string): Promise<string> {
    try {
      const res = await fetch('/api/gemini/source-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentSnippet }),
      });

      if (!res.ok) {
        throw new Error('Помилка аналізу джерела');
      }

      const json = await res.json();
      return json.analysis;
    } catch (err: any) {
      console.warn('Source analysis error:', err);
      return 'Не вдалося підключитися до ШІ для аналізу документа.';
    }
  },
};
