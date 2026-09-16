import { useState } from "react";
import { Agent } from "@/types/chat";
import { Modal } from "@/components/Modern/Modal";
import { Button } from "@/components/Modern/Button";
import { useToast } from "@/components/Modern/Toast";

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  myContacts: Agent[];
  onCreateChat: (
    type: "private" | "group",
    groupName: string,
    newMembers: { name: string; characteristic: string; avatar_url?: string }[],
    selectedContactIds: string[]
  ) => void;
}

export function NewChatModal({
  isOpen,
  onClose,
  myContacts,
  onCreateChat
}: NewChatModalProps) {
  const [newChatType, setNewChatType] = useState<"private" | "group" | null>(null);
  
  // Group Chat State
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

  // Contact State
  const [contactName, setContactName] = useState("");
  const [contactAvatar, setContactAvatar] = useState("");
  const [contactAge, setContactAge] = useState("25");
  const [contactGender, setContactGender] = useState("Pria");
  const [contactTrait, setContactTrait] = useState("Santai");
  const [contactCustomPrompt, setContactCustomPrompt] = useState("");
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const toast = useToast();

  const handleClose = () => {
    setNewChatType(null);
    setNewGroupName("");
    setSelectedContactIds([]);
    setContactName("");
    setContactAvatar("");
    setContactAge("25");
    setContactGender("Pria");
    setContactTrait("Santai");
    setContactCustomPrompt("");
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatType) return;
    
    let membersToPass: { name: string; characteristic: string; avatar_url?: string }[] = [];
    
    if (newChatType === "private") {
      const generatedPrompt = `You are a ${contactAge} years old ${contactGender}. Your personality trait is ${contactTrait}. ${contactCustomPrompt ? 'Additional context: ' + contactCustomPrompt : ''}`;
      membersToPass = [{ 
        name: contactName, 
        characteristic: generatedPrompt,
        avatar_url: contactAvatar || undefined
      }];
    }

    onCreateChat(newChatType, newGroupName, membersToPass, selectedContactIds);
    handleClose();
  };

  const handleGenerateAvatar = async () => {
    if (!contactName) {
      toast.info("Isi nama dulu ya!");
      return;
    }
    setIsGeneratingAvatar(true);
    const prompt = `${contactName}, ${contactAge} years old ${contactGender}, ${contactTrait}, anime portrait, colorful`;
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=200&height=200&nologo=true&seed=${Date.now()}`;
    try {
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = url;
        setTimeout(() => resolve(), 8000);
      });
      setContactAvatar(url);
      toast.success(`✨ Avatar untuk ${contactName} berhasil di-generate!`);
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      title={!newChatType ? "Start a New Chat" : newChatType === 'private' ? "Add Contact" : "Add Group"}
    >
      {!newChatType ? (
        <div className="flex flex-col gap-4 py-2">
          <button 
            className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
            onClick={() => setNewChatType("private")}
          >
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Add Contact</h3>
              <p className="text-sm text-gray-500 mt-1">Create a new AI persona and chat directly.</p>
            </div>
          </button>
          <button 
            className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all text-left"
            onClick={() => setNewChatType("group")}
          >
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Add Group</h3>
              <p className="text-sm text-gray-500 mt-1">Create a room with your existing contacts.</p>
            </div>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {newChatType === "group" && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Group Name</label>
                <input 
                  type="text" 
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm"
                  placeholder="e.g., Design Team"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Select Contacts to Add</label>
                <div className="max-h-64 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                  {myContacts.length === 0 ? (
                    <div className="text-sm text-gray-500 italic p-6 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                      You don't have any AI contacts yet.<br/>
                      Add a Contact first to add them to a group!
                    </div>
                  ) : (
                    myContacts.map(contact => (
                      <label key={contact.id} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${selectedContactIds.includes(contact.id) ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input 
                          type="checkbox"
                          className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                          checked={selectedContactIds.includes(contact.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedContactIds(prev => [...prev, contact.id]);
                            else setSelectedContactIds(prev => prev.filter(id => id !== contact.id));
                          }}
                        />
                        {contact.avatar_url ? (
                           <img src={contact.avatar_url} alt={contact.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                            {contact.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-gray-900 truncate">{contact.name}</div>
                          <div className="text-xs text-gray-500 truncate">{contact.system_prompt}</div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
          
          {newChatType === "private" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Name</label>
                  <input 
                    type="text" 
                    value={contactName}
                    onChange={e => setContactName(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Avatar</label>
                  <div className="flex gap-2 items-center">
                    {contactAvatar && (
                      <img src={contactAvatar} alt="preview" className="w-10 h-10 rounded-full object-cover border-2 border-purple-200 shrink-0" />
                    )}
                    <input 
                      type="url" 
                      value={contactAvatar}
                      onChange={e => setContactAvatar(e.target.value)}
                      className="flex-1 bg-white border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                      placeholder="https://... (optional)"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateAvatar}
                      disabled={isGeneratingAvatar}
                      className="px-3 py-2 text-xs font-semibold bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg border border-purple-200 transition-all disabled:opacity-60 whitespace-nowrap shrink-0"
                    >
                      {isGeneratingAvatar ? '⏳' : '✨ AI'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Umur</label>
                  <input 
                    type="number" 
                    value={contactAge}
                    onChange={e => setContactAge(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                    min="1"
                    max="100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Jenis Kelamin</label>
                  <select 
                    value={contactGender}
                    onChange={e => setContactGender(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                  >
                    <option value="Pria">Pria</option>
                    <option value="Wanita">Wanita</option>
                    <option value="Robot">Robot / AI</option>
                    <option value="Tidak Spesifik">Tidak Spesifik</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Sifat</label>
                  <select 
                    value={contactTrait}
                    onChange={e => setContactTrait(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                  >
                    <option value="Ramah & Sopan">Ramah & Sopan</option>
                    <option value="Santai & Gaul">Santai & Gaul</option>
                    <option value="Galak & Sarkas">Galak & Sarkas</option>
                    <option value="Profesional & Kaku">Profesional</option>
                    <option value="Ceria & Bersemangat">Ceria</option>
                    <option value="Tsundere">Tsundere</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Custom Prompt / Konteks Tambahan</label>
                <textarea 
                  value={contactCustomPrompt}
                  onChange={e => setContactCustomPrompt(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none min-h-[80px]"
                  placeholder="Misal: Kamu adalah ahli IT yang suka menjelaskan sesuatu dengan analogi makanan..."
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button 
              type="button" 
              variant="ghost"
              onClick={() => setNewChatType(null)}
            >
              Back
            </Button>
            <Button type="submit" variant="primary">
              {newChatType === 'private' ? 'Create Contact & Chat' : 'Create Group'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
