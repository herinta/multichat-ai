import { useState } from "react";
import { Room, Agent, UserPersona } from "@/types/chat";
import { Button } from "@/components/Modern/Button";
import { Modal } from "@/components/Modern/Modal";

interface InfoPanelProps {
  activeRoom: Room;
  myContacts: Agent[];
  userPersonas: UserPersona[];
  onClose: () => void;
  onAddMember: (contactId: string) => void;
  onDeleteRoom: () => void;
  onUpdateTheme: (theme: string) => void;
  onUpdateAgent: (agentId: string, updates: Partial<Agent>) => void;
  onUpdateRoomPersona: (personaId: string | null) => void;
}

export function InfoPanel({
  activeRoom,
  myContacts,
  userPersonas,
  onClose,
  onAddMember,
  onDeleteRoom,
  onUpdateTheme,
  onUpdateAgent,
  onUpdateRoomPersona
}: InfoPanelProps) {
  const [isAddingInfoMember, setIsAddingInfoMember] = useState(false);
  const [newInfoSelectedContactId, setNewInfoSelectedContactId] = useState("");

  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInfoSelectedContactId) return;
    onAddMember(newInfoSelectedContactId);
    setIsAddingInfoMember(false);
    setNewInfoSelectedContactId("");
  };

  const handleOpenEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setEditName(agent.name);
    setEditPrompt(agent.system_prompt || "");
    setEditAvatarUrl(agent.avatar_url || "");
  };

  const handleSaveAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgent) return;
    onUpdateAgent(editingAgent.id, {
      name: editName,
      system_prompt: editPrompt,
      avatar_url: editAvatarUrl
    });
    setEditingAgent(null);
  };

  return (
    <>
      <aside className="w-80 flex-shrink-0 border-l border-gray-200 flex flex-col h-full z-20 bg-white shadow-lg animate-[slideIn_0.2s_ease-out]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0">
          <h2 className="text-lg font-bold text-gray-900">Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex flex-col items-center mb-8 pb-8 border-b border-gray-100">
             <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-md mb-4 bg-cover bg-center ${!activeRoom.theme || activeRoom.theme === 'default' ? (activeRoom.type === 'group' ? 'bg-gradient-to-br from-indigo-400 to-purple-500' : 'bg-gradient-to-br from-blue-400 to-cyan-500') : 'bg-gray-800'}`}>
                {activeRoom.title.substring(0, 2).toUpperCase()}
              </div>
            <p className="text-xl font-bold text-gray-900 text-center">{activeRoom.title}</p>
            <p className="text-sm text-gray-500 mt-1 capitalize">{activeRoom.type} Chat</p>
          </div>
          
          {/* Theme Selector */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Chat Theme</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => onUpdateTheme('default')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all ${(!activeRoom.theme || activeRoom.theme === 'default') ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
              >
                Default
              </button>
              <button 
                onClick={() => onUpdateTheme('dark-neon')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all ${activeRoom.theme === 'dark-neon' ? 'border-purple-500 bg-purple-50 text-purple-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
              >
                Dark Neon
              </button>
              <button 
                onClick={() => onUpdateTheme('soft-pastel')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all ${activeRoom.theme === 'soft-pastel' ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
              >
                Pastel
              </button>
            </div>
          </div>

          {/* Persona Selector */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">My Persona</h3>
            <p className="text-[10px] text-gray-500 mb-2">How should the AI recognize you in this chat?</p>
            <select
              value={activeRoom.user_persona_id || ""}
              onChange={e => onUpdateRoomPersona(e.target.value || null)}
              className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            >
              <option value="">Default (No specific persona)</option>
              {userPersonas.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Members ({activeRoom.members.length})</h3>
            <ul className="space-y-3">
              {activeRoom.members.map((m, i) => (
                <li key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all" onClick={() => handleOpenEditAgent(m)}>
                  {m.avatar_url ? (
                     <img src={m.avatar_url} alt={m.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                      {m.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{m.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {m.system_prompt || "No characteristic"}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {activeRoom.type === "group" && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              {!isAddingInfoMember ? (
                <Button 
                  variant="ghost" 
                  className="w-full text-blue-600 bg-blue-50 hover:bg-blue-100"
                  onClick={() => setIsAddingInfoMember(true)}
                >
                  + Add Participant
                </Button>
              ) : (
                <form onSubmit={handleAddSubmit} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3 shadow-inner">
                  <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">Select AI Contact</h4>
                  <select
                    value={newInfoSelectedContactId}
                    onChange={e => setNewInfoSelectedContactId(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                    required
                  >
                    <option value="" disabled>Select a contact...</option>
                    {myContacts.filter(c => !activeRoom.members.some(m => m.id === c.id)).map(contact => (
                      <option key={contact.id} value={contact.id}>{contact.name}</option>
                    ))}
                  </select>
                  {myContacts.filter(c => !activeRoom.members.some(m => m.id === c.id)).length === 0 && (
                    <p className="text-xs text-red-500">No available contacts to add.</p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsAddingInfoMember(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" className="flex-1" disabled={!newInfoSelectedContactId}>
                      Add
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-100">
            <Button 
              variant="ghost" 
              className="w-full text-red-500 hover:bg-red-50 hover:text-red-600 font-bold justify-center"
              onClick={onDeleteRoom}
            >
              <svg className="w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Chat
            </Button>
          </div>
        </div>
      </aside>

      {/* Edit Agent Modal */}
      <Modal isOpen={!!editingAgent} onClose={() => setEditingAgent(null)} title="Edit AI Contact">
        <form onSubmit={handleSaveAgent} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
            <input 
              type="text" 
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Avatar URL (Optional)</label>
            <input 
              type="url" 
              value={editAvatarUrl}
              onChange={e => setEditAvatarUrl(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">System Prompt / Characteristic</label>
            <textarea 
              value={editPrompt}
              onChange={e => setEditPrompt(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none min-h-[100px]"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setEditingAgent(null)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Changes</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
