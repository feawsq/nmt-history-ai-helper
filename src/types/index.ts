export type QuestionType = 'single' | 'matching' | 'chronology' | 'multi';

export interface MatchingPair {
  leftNumber: number;
  leftText: string;
  rightLetter: string;
  rightText: string;
}

export interface Question {
  id: string;
  topicId: number;
  topicTitle: string;
  type: QuestionType;
  question: string;
  sourceText?: string; // Optional quotation from historical source
  imageUrl?: string;
  // For 'single'
  options?: string[];
  correctIndex?: number;
  // For 'matching' (4 from 5)
  matchingLeft?: { id: number; text: string }[];
  matchingRight?: { id: string; text: string }[];
  correctMatching?: { [key: number]: string }; // e.g. { 1: 'А', 2: 'В', 3: 'Г', 4: 'Б' }
  // For 'chronology' (4 events to arrange 1, 2, 3, 4)
  chronologyEvents?: { id: string; text: string; year: string }[];
  correctChronologyOrder?: string[]; // IDs in correct order
  // For 'multi' (3 from 7)
  multiOptions?: string[];
  correctMultiIndices?: number[]; // [0, 2, 5]
  explanation: string;
  mnemonic?: string;
}

export interface TopicInfo {
  id: number;
  title: string;
  period: string;
  description: string;
  iconName: string;
  keyEvents: string[];
}

export interface HistoricalDate {
  id: string;
  year: string;
  event: string;
  period: string;
  details: string;
  mnemonicHint: string;
  frequency: 'high' | 'medium';
}

export interface HistoricalFigure {
  id: string;
  name: string;
  years: string;
  role: string;
  contribution: string;
  keyMarkers: string[];
  category: 'politics' | 'culture' | 'military' | 'church';
}

export interface HistoricalMonument {
  id: string;
  name: string;
  location: string;
  century: string;
  description: string;
  tags: string[];
}

export interface UserAnswerRecord {
  questionId: string;
  userSelection: any;
  isCorrect: boolean;
  score: number;
  maxScore: number;
  timestamp: number;
}

export interface TestSessionResult {
  id: string;
  date: string;
  type: 'full_simulation' | 'topic_practice' | 'ai_generated';
  topicTitle?: string;
  totalQuestions: number;
  rawScore: number;
  maxRawScore: number;
  nmtScaledScore: number; // 100 - 200 scale
  timeSpentSeconds: number;
  answers: UserAnswerRecord[];
}

export interface LocalUserData {
  savedAt: number;
  completedTests: TestSessionResult[];
  favoriteDates: string[]; // IDs of marked dates
  favoriteFigures: string[]; // IDs of marked figures
  favoriteQuestions: string[];
  topicMastery: { [topicId: number]: { answered: number; correct: number } };
  notes: { [key: string]: string };
}
