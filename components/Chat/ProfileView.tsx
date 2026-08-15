import { useState } from "react";
import { UserPersona, Agent, Room } from "@/types/chat";
import { Button } from "@/components/Modern/Button";
import { Modal } from "@/components/Modern/Modal";
import { ContactsView } from "./ContactsView";

interface ProfileViewProps {
  userEmail: string;
  userPersonas: UserPersona[];
  contacts: Agent[];
  rooms: Room[];
  onSelectRoom: (roomId: string) => void;
  onNewContact: () => void;
  onPublishAgent?: (agentId: string, description: string) => void;
  onAddPersona: (name: string, background: string, personality: string) => void;
  onDeletePersona: (id: string) => void;
  onOpenSettings: () => void;
}

export function ProfileView({
  userEmail,
  userPersonas,
  contacts,
  rooms,
  onSelectRoom,
  onNewContact,
  onPublishAgent,
  onAddPersona,
  onDeletePersona,
  onOpenSettings
}: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState<"karakter" | "menyukai" | "persona">("persona");
  const [isNewPersonaModalOpen, setIsNewPersonaModalOpen] = useState(false);
  
  const [newPName, setNewPName] = useState("");
  const [newPBackground, setNewPBackground] = useState("");
  const [newPPersonality, setNewPPersonality] = useState("");

  const handleCreatePersona = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPName.trim()) {
      onAddPersona(newPName, newPBackground, newPPersonality);
      setIsNewPersonaModalOpen(false);
      setNewPName("");
      setNewPBackground("");
      setNewPPersonality("");
    }
  };

  const username = userEmail ? userEmail.split('@')[0] : 'User';

  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto w-full max-w-5xl mx-auto">
      <div className="w-full flex flex-col items-center mt-10">
        
        {/* Profile Header */}
        <div className="w-24 h-24 bg-[#8C523B] rounded-full flex items-center justify-center text-4xl font-bold mb-4 shadow-lg border-2 border-[#2A2A2A]">
          {username.charAt(0).toUpperCase()}
        </div>
        <h1 className="text-2xl font-semibold mb-2">{username}</h1>
        <div className="flex gap-4 text-sm text-gray-400 mb-6">
          <span>0 Pengikut</span>
          <span>•</span>
          <span>0 Mengikuti</span>
          <span>•</span>
          <span>{rooms.length} Interaksi</span>
        </div>

        <div className="flex gap-3 mb-10">
          <Button variant="secondary" className="border border-current/20 text-sm px-4 py-2" onClick={onOpenSettings}>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Pengaturan
            </span>
          </Button>
          <Button variant="secondary" className="border border-current/20 p-2 aspect-square">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 border-b border-current/20 w-full max-w-2xl justify-center mb-8">
          <button 
            className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'karakter' ? 'font-bold border-b-2 border-current' : 'opacity-60 hover:opacity-100'}`}
            onClick={() => setActiveTab('karakter')}
          >
            Karakter
          </button>
          <button 
            className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'menyukai' ? 'font-bold border-b-2 border-current' : 'opacity-60 hover:opacity-100'}`}
            onClick={() => setActiveTab('menyukai')}
          >
            Menyukai
          </button>
          <button 
            className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'persona' ? 'font-bold border-b-2 border-current' : 'opacity-60 hover:opacity-100'}`}
            onClick={() => setActiveTab('persona')}
          >
            Persona
          </button>
        </div>

        {/* Tab Content */}
        <div className="w-full max-w-4xl">
          {activeTab === 'karakter' && (
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm text-gray-900">
               <ContactsView contacts={contacts} rooms={rooms} onSelectRoom={onSelectRoom} onNewContact={onNewContact} onPublishAgent={onPublishAgent} />
            </div>
          )}

          {activeTab === 'menyukai' && (
            <div className="text-center py-20 text-gray-500">
              Fitur Menyukai masih dalam tahap pengembangan.
            </div>
          )}

          {activeTab === 'persona' && (
            <div className="flex flex-col items-center w-full">
              <div className="w-full mb-6">
                <h3 className="text-lg font-semibold mb-2">Buat persona</h3>
                <p className="text-sm opacity-60 mb-4">Tambahkan detail tentang Anda, orang lain, karakter, atau apapun, agar Karakter dapat mengingatnya.</p>
                <Button variant="secondary" className="border border-current/20 w-32 justify-center" onClick={() => setIsNewPersonaModalOpen(true)}>
                  + Baru
                </Button>
              </div>

              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                {userPersonas.map(p => (
                  <div key={p.id} className="bg-black/5 dark:bg-white/5 p-5 rounded-xl border border-current/10 relative group">
                    <button 
                      onClick={() => onDeletePersona(p.id)}
                      className="absolute top-3 right-3 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Hapus Persona"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <h4 className="font-bold text-lg mb-1">{p.name}</h4>
                    {p.background && <p className="text-sm opacity-80 mb-2"><span className="font-semibold">Latar:</span> {p.background}</p>}
                    {p.personality && <p className="text-sm opacity-80"><span className="font-semibold">Sifat:</span> {p.personality}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isNewPersonaModalOpen} onClose={() => setIsNewPersonaModalOpen(false)} title="Tambah Persona Baru">
        <form onSubmit={handleCreatePersona} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Panggilan *</label>
            <input required type="text" value={newPName} onChange={e => setNewPName(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-900" placeholder="Cth: Bos, Murid, John..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latar Belakang</label>
            <textarea value={newPBackground} onChange={e => setNewPBackground(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-900" rows={3} placeholder="Ceritakan latar belakang peran ini..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sifat / Karakter</label>
            <input type="text" value={newPPersonality} onChange={e => setNewPPersonality(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-900" placeholder="Cth: Tegas, ramah, pemalu..." />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" type="button" onClick={() => setIsNewPersonaModalOpen(false)}>Batal</Button>
            <Button variant="primary" type="submit">Simpan Persona</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
