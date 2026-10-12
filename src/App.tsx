import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { ExamSimulator } from './components/ExamSimulator';
import { TopicPractice } from './components/TopicPractice';
import { FlashcardsView } from './components/FlashcardsView';
import { AiTutorChat } from './components/AiTutorChat';
import { SourceDecoder } from './components/SourceDecoder';
import { PrivacyModal } from './components/PrivacyModal';
import { ScoreScaleModal } from './components/ScoreScaleModal';
import { privacyService } from './services/privacyService';
import { LocalUserData } from './types';
import { ShieldCheck, Heart, Sparkles, BookOpen } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isScaleModalOpen, setIsScaleModalOpen] = useState(false);

  // Private local user data
  const [userData, setUserData] = useState<LocalUserData>(privacyService.loadUserData());
  const [storageStats, setStorageStats] = useState(privacyService.getStorageStats());

  useEffect(() => {
    // Refresh storage stats
    setStorageStats(privacyService.getStorageStats());
  }, [userData]);

  const handleDataChanged = (newData: LocalUserData) => {
    setUserData(newData);
    setStorageStats(privacyService.getStorageStats());
  };

  const handleTestFinished = () => {
    const updated = privacyService.loadUserData();
    setUserData(updated);
    setStorageStats(privacyService.getStorageStats());
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openPrivacyModal={() => setIsPrivacyModalOpen(true)}
        openScaleModal={() => setIsScaleModalOpen(true)}
        storageFormattedSize={storageStats.formattedSize}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            userData={userData}
            setActiveTab={setActiveTab}
            openPrivacyModal={() => setIsPrivacyModalOpen(true)}
            openScaleModal={() => setIsScaleModalOpen(true)}
            storageFormattedSize={storageStats.formattedSize}
          />
        )}

        {activeTab === 'simulator' && (
          <ExamSimulator
            onFinishTest={handleTestFinished}
            openScaleModal={() => setIsScaleModalOpen(true)}
          />
        )}

        {activeTab === 'topics' && <TopicPractice />}

        {activeTab === 'flashcards' && <FlashcardsView />}

        {activeTab === 'tutor' && <AiTutorChat />}

        {activeTab === 'sources' && <SourceDecoder />}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-800/80 bg-stone-950/80 py-6 mt-12 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-stone-300">НМТ Історія України</span>
            <span>•</span>
            <span>ШІ-Тренажер для випускників 11 класів</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPrivacyModalOpen(true)}
              className="hover:text-emerald-400 transition-colors flex items-center gap-1 text-emerald-400/90 font-medium"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Політика нульового збору даних</span>
            </button>
            <span>•</span>
            <button
              onClick={() => setIsScaleModalOpen(true)}
              className="hover:text-amber-400 transition-colors"
            >
              Таблиця 100–200 балів
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PrivacyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        onDataChanged={handleDataChanged}
      />

      <ScoreScaleModal
        isOpen={isScaleModalOpen}
        onClose={() => setIsScaleModalOpen(false)}
      />
    </div>
  );
}
