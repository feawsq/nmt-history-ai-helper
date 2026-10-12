import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Download, Upload, Trash2, X, Lock, CheckCircle2, AlertTriangle, EyeOff, ServerOff } from 'lucide-react';
import { privacyService } from '../services/privacyService';
import { LocalUserData } from '../types';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: (newData: LocalUserData) => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose, onDataChanged }) => {
  const [stats, setStats] = useState(privacyService.getStorageStats());
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStats(privacyService.getStorageStats());
      setConfirmWipe(false);
      setImportStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExport = () => {
    privacyService.exportToFile();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await privacyService.importFromFile(file);
      onDataChanged(data);
      setStats(privacyService.getStorageStats());
      setImportStatus('✅ Дані успішно відновлено!');
      setTimeout(() => setImportStatus(null), 3000);
    } catch (err: any) {
      setImportStatus(`❌ Помилка: ${err?.message}`);
    }
  };

  const handleWipe = () => {
    privacyService.wipeAllData();
    const clean = privacyService.loadUserData();
    onDataChanged(clean);
    setStats(privacyService.getStorageStats());
    setConfirmWipe(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-xl w-full p-6 text-stone-100 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-100 p-1 rounded-lg hover:bg-stone-800 transition-colors"
          aria-label="Закрити"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-heading text-white">Щит приватності (Privacy First)</h2>
            <p className="text-xs text-stone-400">Підготовка до НМТ з нульовим збором персональних даних</p>
          </div>
        </div>

        {/* Guarantees Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div className="p-3.5 bg-stone-950/60 rounded-xl border border-stone-800/80 flex items-start gap-2.5">
            <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-stone-200">Без реєстрації та акаунтів</p>
              <p className="text-stone-400 mt-0.5">Ніяких email, прізвищ, телефонів, паролів чи шкільних списків.</p>
            </div>
          </div>

          <div className="p-3.5 bg-stone-950/60 rounded-xl border border-stone-800/80 flex items-start gap-2.5">
            <ServerOff className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-stone-200">0 байтів у базі сервера</p>
              <p className="text-stone-400 mt-0.5">Всі бали, спроби та замітки живуть виключно у вашому браузері.</p>
            </div>
          </div>

          <div className="p-3.5 bg-stone-950/60 rounded-xl border border-stone-800/80 flex items-start gap-2.5">
            <EyeOff className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-stone-200">Жодного стеження</p>
              <p className="text-stone-400 mt-0.5">Без рекламних трекерів, аналітики відвідувань або сторонніх cookies.</p>
            </div>
          </div>

          <div className="p-3.5 bg-stone-950/60 rounded-xl border border-stone-800/80 flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-stone-200">Повний контроль учня</p>
              <p className="text-stone-400 mt-0.5">Ви можете скачати файл прогресу або видалити все в 1 клік.</p>
            </div>
          </div>
        </div>

        {/* Current Local Footprint */}
        <div className="p-4 bg-stone-950 border border-stone-800 rounded-xl mb-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-stone-400">Обсяг даних на вашому пристрої:</span>
            <span className="font-mono font-bold text-amber-400">{stats.formattedSize}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span>Збережено тестів у пам'яті: <strong className="text-stone-200">{stats.testsCount}</strong></span>
            <span>Обраних дат: <strong className="text-stone-200">{stats.savedDatesCount}</strong></span>
          </div>
        </div>

        {/* Actions: Export / Import / Wipe */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={handleExport}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-sm font-medium transition-colors border border-stone-700"
            >
              <Download className="w-4 h-4 text-amber-400" />
              Експортувати бекап (JSON)
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-sm font-medium transition-colors border border-stone-700"
            >
              <Upload className="w-4 h-4 text-sky-400" />
              Імпортувати бекап
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportFile}
            />
          </div>

          {importStatus && (
            <div className="p-2.5 rounded-lg text-xs bg-stone-800 border border-stone-700 text-center font-medium">
              {importStatus}
            </div>
          )}

          {/* Danger zone */}
          <div className="pt-3 border-t border-stone-800">
            {!confirmWipe ? (
              <button
                onClick={() => setConfirmWipe(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl text-xs font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Стерти всі локальні дані (Zero Trace)
              </button>
            ) : (
              <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-red-300">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Ви дійсно бажаєте видалити весь свій прогрес?</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleWipe}
                    className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Так, стерти
                  </button>
                  <button
                    onClick={() => setConfirmWipe(false)}
                    className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs transition-colors"
                  >
                    Скасувати
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
