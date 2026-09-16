"use client";

import { useState } from "react";
import { Agent, Room } from "@/types/chat";
import { Button } from "@/components/Modern/Button";
import { Modal } from "@/components/Modern/Modal";
import { useToast } from "@/components/Modern/Toast";

interface ContactsViewProps {
  contacts: Agent[];
  rooms: Room[];
  onSelectRoom: (roomId: string) => void;
  onNewContact: () => void;
  onPublishAgent?: (agentId: string, description: string) => Promise<boolean>;
  onStartChatWithContact?: (agent: Agent) => Promise<void>;
}

export function ContactsView({ contacts, rooms, onSelectRoom, onNewContact, onPublishAgent, onStartChatWithContact }: ContactsViewProps) {
  const [publishingAgent, setPublishingAgent] = useState<Agent | null>(null);
  const [publishDescription, setPublishDescription] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const toast = useToast();

  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishingAgent || !onPublishAgent) return;
    setIsPublishing(true);
    try {
      const success = await onPublishAgent(publishingAgent.id, publishDescription);
      if (success) {
        toast.success(`✅ ${publishingAgent.name} berhasil dipublikasikan ke Explore!`);
        setPublishingAgent(null);
        setPublishDescription("");
      } else {
        toast.error("Gagal mempublikasikan karakter. Coba lagi.");
      }
    } finally {
      setIsPublishing(false);
    }
  };
  
  const handleContactClick = (contact: Agent) => {
    // Find if there is a private room with this contact
    const existingRoom = rooms.find(r => r.type === "private" && r.members.some(m => m.id === contact.id));
    if (existingRoom) {
      onSelectRoom(existingRoom.id);
    } else if (onStartChatWithContact) {
      // Create a new private chat with this contact
      onStartChatWithContact(contact);
    } else {
      toast.info("Buka New Chat untuk mulai ngobrol dengan kontak ini.");
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50/50 p-8 overflow-y-auto">
      <div className="max-w-5xl w-full mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Contacts</h1>
            <p className="text-gray-500 mt-2">Your personalized AI personas.</p>
          </div>
          <Button onClick={onNewContact} variant="primary" className="shadow-sm">
            + Add New Contact
          </Button>
        </div>

        {contacts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">No Contacts Yet</h3>
            <p className="text-gray-500 mt-1 mb-6">Create your first AI persona to start chatting.</p>
            <Button onClick={onNewContact} variant="primary">Create Contact</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contacts.map(contact => (
              <div
                key={contact.id}
                className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group cursor-pointer"
                onClick={() => handleContactClick(contact)}
              >
                {contact.avatar_url ? (
                  <img src={contact.avatar_url} alt={contact.name} className="w-20 h-20 rounded-full object-cover mb-4 shadow-sm border border-gray-100 group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-sm group-hover:scale-105 transition-transform">
                    {contact.name.charAt(0)}
                  </div>
                )}
                <h3 className="text-lg font-bold text-gray-900">{contact.name}</h3>
                <p className="text-xs text-gray-500 mt-2 line-clamp-3 leading-relaxed">{contact.system_prompt}</p>
                <div className="mt-4 pt-4 border-t border-gray-50 w-full flex justify-between items-center px-2">
                  <span className="text-blue-600 text-sm font-semibold group-hover:text-blue-700">
                    {rooms.find(r => r.type === "private" && r.members.some(m => m.id === contact.id))
                      ? "Open Chat →"
                      : "Start Chat →"
                    }
                  </span>
                  {onPublishAgent && !contact.is_public && (
                    <button
                      className="text-gray-400 hover:text-indigo-600 text-sm font-semibold transition-colors px-2 py-1 rounded-lg hover:bg-indigo-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPublishingAgent(contact);
                      }}
                    >
                      🌐 Publish
                    </button>
                  )}
                  {contact.is_public && (
                    <span className="text-emerald-500 text-xs font-semibold px-2 py-1 bg-emerald-50 rounded-md flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Published
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={!!publishingAgent} onClose={() => { setPublishingAgent(null); setPublishDescription(""); }} title="Publish ke Explore">
        <form onSubmit={handlePublishSubmit} className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            {publishingAgent?.avatar_url ? (
              <img src={publishingAgent.avatar_url} alt={publishingAgent.name} className="w-14 h-14 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-xl font-bold shrink-0">
                {publishingAgent?.name.charAt(0)}
              </div>
            )}
            <div>
              <p className="font-bold text-gray-900">{publishingAgent?.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                Karakter ini akan dibagikan secara publik di Explore.
                Memori chat kamu <strong>TIDAK</strong> ikut dibagikan.
              </p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Deskripsi Singkat *</label>
            <input
              type="text"
              required
              value={publishDescription}
              onChange={e => setPublishDescription(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none text-gray-900"
              placeholder="Cth: Teman ngobrol yang asik, AI koding expert..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => { setPublishingAgent(null); setPublishDescription(""); }}>
              Batal
            </Button>
            <Button type="submit" variant="primary" className="bg-indigo-600 hover:bg-indigo-700" disabled={isPublishing}>
              {isPublishing ? "⏳ Publishing..." : "🌐 Publish Sekarang"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
