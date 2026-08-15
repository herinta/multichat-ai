import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { UserSettings } from "@/types/chat";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings | null;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
  userEmail?: string;
}

export function SettingsModal({ isOpen, onClose, settings, onUpdateSettings, userEmail }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"akun" | "kata" | "tema">("akun");
  const [mutedWords, setMutedWords] = useState<string[]>(settings?.muted_words || []);
  const [globalTheme, setGlobalTheme] = useState<string>(settings?.global_theme || "light");
  const [newWord, setNewWord] = useState("");

  if (isOpen && settings) {
    if (settings.muted_words.length !== mutedWords.length) setMutedWords(settings.muted_words);
    if (settings.global_theme && settings.global_theme !== globalTheme) setGlobalTheme(settings.global_theme);
  }

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    const word = newWord.trim().toLowerCase();
    if (word && !mutedWords.includes(word)) {
      setMutedWords([...mutedWords, word]);
      setNewWord("");
    }
  };

  const handleRemoveWord = (wordToRemove: string) => {
    setMutedWords(mutedWords.filter(w => w !== wordToRemove));
  };

  const handleSave = () => {
    onUpdateSettings({ muted_words: mutedWords, global_theme: globalTheme } as Partial<UserSettings>);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pengaturan">
      <div className="flex border-b border-gray-100 mb-6 mt-2">
        <button 
          className={`flex-1 pb-3 text-sm font-semibold transition-colors ${activeTab === 'akun' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('akun')}
        >
          Akun
        </button>
        <button 
          className={`flex-1 pb-3 text-sm font-semibold transition-colors ${activeTab === 'kata' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('kata')}
        >
          Kata Disenyapkan
        </button>
        <button 
          className={`flex-1 pb-3 text-sm font-semibold transition-colors ${activeTab === 'tema' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('tema')}
        >
          Tema Web
        </button>
      </div>

      <div className="min-h-[250px]">
        {activeTab === 'akun' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
              <div className="p-3 bg-gray-50 rounded-lg text-gray-900 border border-gray-100">{userEmail || "Loading..."}</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
              <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> Active
              </div>
            </div>
          </div>
        )}

        {activeTab === 'kata' && (
          <div>
            <p className="text-sm text-gray-500 mb-4">Tambahkan kata-kata yang tidak ingin Anda lihat. AI akan dilarang keras menggunakan kata-kata ini.</p>
            
            <form onSubmit={handleAddWord} className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={newWord}
                onChange={e => setNewWord(e.target.value)}
                placeholder="Contoh: kasar, bodoh..."
                className="flex-1 p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Button type="submit" variant="secondary" className="py-2">Tambah</Button>
            </form>

            <div className="flex flex-wrap gap-2">
              {mutedWords.length === 0 ? (
                <div className="text-sm text-gray-400 italic">Belum ada kata yang disenyapkan.</div>
              ) : (
                mutedWords.map(word => (
                  <div key={word} className="flex items-center gap-1 bg-red-50 text-red-700 px-3 py-1.5 rounded-full text-sm font-medium border border-red-100">
                    {word}
                    <button onClick={() => handleRemoveWord(word)} className="ml-1 text-red-400 hover:text-red-900 focus:outline-none">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'tema' && (
          <div>
            <p className="text-sm text-gray-500 mb-6">Pilih tema utama untuk tampilan aplikasi secara keseluruhan.</p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setGlobalTheme('light')}
                className={`h-24 rounded-xl border-4 ${globalTheme === 'light' ? 'border-blue-500' : 'border-transparent'} bg-white flex flex-col items-center justify-center shadow-sm relative overflow-hidden`}
              >
                <div className="w-full h-full bg-gray-50 absolute inset-0 -z-10"></div>
                <div className="w-8 h-8 rounded-full bg-blue-500 mb-2"></div>
                <span className="text-sm font-medium text-gray-700">Light Mode</span>
              </button>

              <button 
                onClick={() => setGlobalTheme('dark')}
                className={`h-24 rounded-xl border-4 ${globalTheme === 'dark' ? 'border-blue-500' : 'border-transparent'} bg-[#1A1A1A] flex flex-col items-center justify-center shadow-sm relative overflow-hidden`}
              >
                <div className="w-full h-full bg-gray-900 absolute inset-0 -z-10"></div>
                <div className="w-8 h-8 rounded-full bg-white mb-2"></div>
                <span className="text-sm font-medium text-gray-200">Dark Mode</span>
              </button>

              <button 
                onClick={() => setGlobalTheme('blue')}
                className={`h-24 rounded-xl border-4 ${globalTheme === 'blue' ? 'border-blue-500' : 'border-transparent'} bg-blue-900 flex flex-col items-center justify-center shadow-sm relative overflow-hidden`}
              >
                <div className="w-full h-full bg-blue-950 absolute inset-0 -z-10"></div>
                <div className="w-8 h-8 rounded-full bg-blue-300 mb-2"></div>
                <span className="text-sm font-medium text-blue-100">Midnight Blue</span>
              </button>

              <button 
                onClick={() => setGlobalTheme('sunset')}
                className={`h-24 rounded-xl border-4 ${globalTheme === 'sunset' ? 'border-rose-500' : 'border-transparent'} bg-orange-50 flex flex-col items-center justify-center shadow-sm relative overflow-hidden`}
              >
                <div className="w-full h-full bg-gradient-to-br from-orange-100 to-rose-100 absolute inset-0 -z-10"></div>
                <div className="w-8 h-8 rounded-full bg-rose-500 mb-2"></div>
                <span className="text-sm font-medium text-rose-900">Sunset</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>Batal</Button>
        <Button variant="primary" onClick={handleSave}>Simpan Pengaturan</Button>
      </div>
    </Modal>
  );
}
