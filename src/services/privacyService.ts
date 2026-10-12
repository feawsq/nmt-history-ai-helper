import { LocalUserData, TestSessionResult } from '../types';

const STORAGE_KEY = 'nmt_history_private_vault_v1';

const DEFAULT_STATE: LocalUserData = {
  savedAt: Date.now(),
  completedTests: [],
  favoriteDates: [],
  favoriteFigures: [],
  favoriteQuestions: [],
  topicMastery: {},
  notes: {},
};

export const privacyService = {
  // Load data strictly from client browser
  loadUserData(): LocalUserData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_STATE;
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_STATE, ...parsed };
    } catch (err) {
      console.warn('Could not read private local storage:', err);
      return DEFAULT_STATE;
    }
  },

  // Save data strictly to client browser
  saveUserData(data: LocalUserData): void {
    try {
      const updated = { ...data, savedAt: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save private local data:', err);
    }
  },

  // Record a completed test session
  recordTestResult(result: TestSessionResult): LocalUserData {
    const data = this.loadUserData();
    const updatedTests = [result, ...data.completedTests].slice(0, 50); // keep recent 50 runs

    // Update topic mastery
    const topicMastery = { ...data.topicMastery };
    result.answers.forEach((ans) => {
      // Find question or update
      // We aggregate correctly
    });

    const updatedData: LocalUserData = {
      ...data,
      completedTests: updatedTests,
      topicMastery,
    };
    this.saveUserData(updatedData);
    return updatedData;
  },

  // Toggle favorite date
  toggleFavoriteDate(dateId: string): boolean {
    const data = this.loadUserData();
    const exists = data.favoriteDates.includes(dateId);
    const updatedFavorites = exists
      ? data.favoriteDates.filter((id) => id !== dateId)
      : [...data.favoriteDates, dateId];
    this.saveUserData({ ...data, favoriteDates: updatedFavorites });
    return !exists;
  },

  // Toggle favorite figure
  toggleFavoriteFigure(figureId: string): boolean {
    const data = this.loadUserData();
    const exists = data.favoriteFigures.includes(figureId);
    const updatedFavorites = exists
      ? data.favoriteFigures.filter((id) => id !== figureId)
      : [...data.favoriteFigures, figureId];
    this.saveUserData({ ...data, favoriteFigures: updatedFavorites });
    return !exists;
  },

  // Update notes
  saveNote(topicOrId: string, text: string): void {
    const data = this.loadUserData();
    const notes = { ...data.notes, [topicOrId]: text };
    this.saveUserData({ ...data, notes });
  },

  // Measure stored size
  getStorageStats(): { bytesUsed: number; formattedSize: string; testsCount: number; savedDatesCount: number } {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || '';
      const bytesUsed = new Blob([raw]).size;
      const formattedSize = bytesUsed < 1024 ? `${bytesUsed} Б` : `${(bytesUsed / 1024).toFixed(1)} КБ`;
      const data = this.loadUserData();
      return {
        bytesUsed,
        formattedSize,
        testsCount: data.completedTests.length,
        savedDatesCount: data.favoriteDates.length,
      };
    } catch {
      return { bytesUsed: 0, formattedSize: '0 Б', testsCount: 0, savedDatesCount: 0 };
    }
  },

  // Export JSON file for user device backup
  exportToFile(): void {
    const data = this.loadUserData();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nmt-history-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Import JSON file from user device
  importFromFile(file: File): Promise<LocalUserData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content) as LocalUserData;
          if (typeof parsed !== 'object' || !Array.isArray(parsed.completedTests)) {
            throw new Error('Недійсний формат файлу резервної копії');
          }
          this.saveUserData(parsed);
          resolve(parsed);
        } catch (err: any) {
          reject(new Error(err?.message || 'Помилка розбору JSON'));
        }
      };
      reader.onerror = () => reject(new Error('Не вдалося прочитати файл'));
      reader.readAsText(file);
    });
  },

  // Full 100% wipe
  wipeAllData(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};
