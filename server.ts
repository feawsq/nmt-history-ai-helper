import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '1mb' }));

// Dynamic client helper to ensure trimmed key without quotes
function getAI() {
  const rawKey = process.env.GEMINI_API_KEY;
  const cleanKey = rawKey ? rawKey.replace(/^["']|["']$/g, '').trim() : undefined;
  return new GoogleGenAI({
    apiKey: cleanKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function validateApiKey(): string | null {
  const rawKey = process.env.GEMINI_API_KEY;
  const key = rawKey ? rawKey.replace(/^["']|["']$/g, '').trim() : '';
  if (!key || key === 'MY_GEMINI_API_KEY') {
    return 'GEMINI_API_KEY не налаштовано або має значення за замовчуванням у файлі .env. Будь ласка, вкажіть ваш ключ.';
  }
  return null;
}

// Helper for calling Gemini with retry on transient 503 errors
async function callGeminiWithRetry(params: any, retries = 2, delayMs = 600): Promise<any> {
  const validationError = validateApiKey();
  if (validationError) {
    throw new Error(validationError);
  }

  const aiClient = getAI();

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await aiClient.models.generateContent(params);
    } catch (err: any) {
      console.error(`Gemini call attempt ${attempt + 1} error:`, err?.message || err);
      if (err?.message?.includes('API_KEY_INVALID') || err?.message?.includes('API key not valid')) {
        throw new Error('Google відхилив ключ API (API_KEY_INVALID). Перевірте, чи ключ активний у Google AI Studio.');
      }
      const is503 = err?.message?.includes('503') || err?.status === 503 || err?.code === 503;
      if (is503 && attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
}

// Privacy check route - informs user what data is received (only test query, no user identity)
app.get('/api/privacy-status', (_req, res) => {
  res.json({
    status: 'ok',
    storagePolicy: 'zero-server-storage',
    tracking: false,
    cookies: false,
    telemetry: false,
    message: 'Сервер не веде бази даних користувачів. Жодні персональні дані не записуються.',
  });
});

// Diagnostic check route for API key configuration (without leaking the secret)
app.get('/api/key-check', (_req, res) => {
  const rawKey = process.env.GEMINI_API_KEY;
  const cleanKey = rawKey ? rawKey.replace(/^["']|["']$/g, '').trim() : '';
  const isSet = Boolean(cleanKey && cleanKey !== 'MY_GEMINI_API_KEY');
  res.json({
    configured: isSet,
    length: isSet ? cleanKey.length : 0,
    prefix: isSet ? cleanKey.slice(0, 4) + '...' : null,
    message: isSet
      ? 'Ключ успішно завантажено в пам\'ять сервера!'
      : 'Ключ НЕ знайдено. Перевірте, чи файл у корені називається саме .env (а не .env.txt), та перезапустіть npm run dev.',
  });
});

// 1. AI Explain route: explain an answer choice, mistakes, and traps in NMT
app.post('/api/gemini/explain', async (req, res) => {
  try {
    const { question, options, selectedAnswer, correctAnswer, topic } = req.body;

    if (!question || !correctAnswer) {
      return res.status(400).json({ error: 'Потрібно передати питання та правильну відповідь' });
    }

    const prompt = `Ти — висококваліфікований репетитор та експерт з підготовки до НМТ з історії України.
Учень 11 класу розв'язував тестове завдання:
Тема: ${topic || 'Історія України'}
Запитання: "${question}"
Варіанти відповідей: ${JSON.stringify(options || [])}
Відповідь учня: "${selectedAnswer || 'Не вказано'}"
Правильна відповідь: "${correctAnswer}"

Твоє завдання — пояснити завдання українською мовою лаконічно, доброзичливо та структуровано (максимум 180-220 слів):
1. **Чому це правильна відповідь**: історичний факт, суть події чи терміну.
2. **Пастка тесту (якщо учень обрав неправильно)**: чому інші варіанти є типовими помилками/дистракторами УЦОЯО.
3. **Лайфхак для запам'ятовування (Мнемоніка або маркерне слово)**: короткий асоціативний гачок для НМТ (наприклад, рік, ключове слово, цитата).

Відповідай живою сучасною українською мовою без бюрократизму.`;

    const response = await callGeminiWithRetry({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'Ти доброзичливий, точний експерт-репетитор з історії України для випускників 11 класів. Пиши чітко, структуровано з фокусом на програму НМТ.',
        temperature: 0.7,
      },
    });

    res.json({ explanation: response.text });
  } catch (error: any) {
    console.error('Error in /api/gemini/explain:', error);
    res.status(500).json({
      error: 'Не вдалося згенерувати пояснення ШІ',
      details: error?.message || 'Помилка виклику Gemini API',
    });
  }
});

// 2. AI Tutor Chat: Ask Clio anything about Ukrainian history
app.post('/api/gemini/tutor', async (req, res) => {
  try {
    const { query, history } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Потрібно передати запит' });
    }

    const messagesFormatted = Array.isArray(history)
      ? history.slice(-6).map((m: { role: string; content: string }) => `${m.role === 'user' ? 'Учень' : 'Тьютор'}: ${m.content}`).join('\n')
      : '';

    const prompt = `Ти — "Кліо", розумний ШІ-тьютор з історії України, створений виключно для допомоги 11-класникам у підготовці до НМТ.
Твій стиль: доброзичливий, точний за даними УЦОЯО, без зайвої "води", з мнемонічними підказками та маркерами для тестів.
Твоя мета: пояснити суть, розкласти хронологію, підкреслити маркерні слова в історичних документах, допомогти вивчити діячів та архітектурні пам'ятки.

Історія попередньої розмови (якщо є):
${messagesFormatted}

Запитання або прохання учня: "${query}"

Дай чітку, структуровану відповідь українською мовою з підзаголовками, маркерами або пунктами.`;

    const response = await callGeminiWithRetry({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'Ти експерт-тьютор з історії України для складання НМТ на 200 балів. Не проси жодних персональних даних від учня. Завжди підтримуй та заохочуй.',
        temperature: 0.6,
      },
    });

    res.json({ answer: response.text });
  } catch (error: any) {
    console.error('Error in /api/gemini/tutor:', error);
    res.status(500).json({
      error: 'Не вдалося отримати відповідь тьютора',
      details: error?.message || 'Помилка виклику Gemini API',
    });
  }
});

// 3. AI Question Generator: Generate custom NMT practice questions for a topic
app.post('/api/gemini/generate-questions', async (req, res) => {
  try {
    const { topic, count = 3, type = 'single' } = req.body;

    const prompt = `Згенеруй ${count} авторських тренувальних завдань у точній стилістиці НМТ з історії України за темою: "${topic || 'Загальна програма НМТ'}".
Тип запитань: ${type === 'source' ? 'Аналіз історичного джерела (цитата)' : 'Тест з вибором однієї правильної відповіді (1 з 4)'}.

Поверни результат ТІЛЬКИ у форматі JSON у вигляді масиву об'єктів з такою структурою:
[
  {
    "id": "gen_1",
    "topic": "${topic || 'Історія України'}",
    "type": "single",
    "question": "Текст питання або цитата з історичного джерела...",
    "sourceText": "Якщо це робота з документом, уривок джерела (інакше порожньо)",
    "options": ["Варіант А", "Варіант Б", "Варіант В", "Варіант Г"],
    "correctIndex": 0,
    "explanation": "Чому саме цей варіант правильний, вказівка на маркерне слово...",
    "mnemonic": "Коротка порада або мнемоніка для пам'яті"
  }
]`;

    const response = await callGeminiWithRetry({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    res.json({ questions: parsed });
  } catch (error: any) {
    console.error('Error in /api/gemini/generate-questions:', error);
    res.status(500).json({
      error: 'Не вдалося згенерувати тестові завдання',
      details: error?.message || 'Помилка генерації',
    });
  }
});

// 4. AI Historical Source Decoder: Analyze authentic quotes/documents
app.post('/api/gemini/source-analysis', async (req, res) => {
  try {
    const { documentSnippet } = req.body;

    if (!documentSnippet) {
      return res.status(400).json({ error: 'Потрібно надати уривок тексту' });
    }

    const prompt = `Проаналізуй поданий історичний уривок для учня 11 класу, який готується до НМТ з історії України:
Уривок:
"${documentSnippet}"

Надай короткий структурований аналіз:
1. **Ідентифікація документа**: Що це за документ, хто автор/орган, рік або період.
2. **Маркерні слова (ключі)**: За якими конкретними фразами чи словами в тесті НМТ учень може миттєво впізнати цей документ.
3. **Історичний контекст**: У яких умовах він був прийнятий.
4. **Типове питання на НМТ**: Яке завдання УЦОЯО зазвичай формулює до цього уривка.`;

    const response = await callGeminiWithRetry({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.5,
      },
    });

    res.json({ analysis: response.text });
  } catch (error: any) {
    console.error('Error in /api/gemini/source-analysis:', error);
    res.status(500).json({
      error: 'Не вдалося розібрати документ',
      details: error?.message || 'Помилка аналізу',
    });
  }
});

// Setup Vite middlewares or static files
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер НМТ Історія запущено на http://localhost:${PORT}`);
  });
}

startServer();
