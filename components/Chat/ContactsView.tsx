import { useState } from "react";
import { Agent, Room } from "@/types/chat";
import { Button } from "@/components/Modern/Button";
import { Modal } from "@/components/Modern/Modal";

interface ContactsViewProps {
  contacts: Agent[];
  rooms: Room[];
  onSelectRoom: (roomId: string) => void;
  onNewContact: () => void;
  onPublishAgent?: (agentId: string, description: string) => void;
}

export function ContactsView({ contacts, rooms, onSelectRoom, onNewContact, onPublishAgent }: ContactsViewProps) {
  const [publishingAgent, setPublishingAgent] = useState<Agent | null>(null);
  const [publishDescription, setPublishDescription] = useState("");

  const handlePublishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (publishingAgent && onPublishAgent) {
      onPublishAgent(publishingAgent.id, publishDescription);
      setPublishingAgent(null);
      setPublishDescription("");
    }
  };
  
  const handleContactClick = (contactId: string) => {
    // Find if there is a private room with this contact
    const existingRoom = rooms.find(r => r.type === "private" && r.members.some(m => m.id === contactId));
    if (existingRoom) {
      onSelectRoom(existingRoom.id);
    } else {
      // Typically we'd create one here, but currently NewChatModal handles both.
      // For now, prompt the user to use the Add Contact button if they want a new one.
      alert("No active chat with this contact. Create a new chat from the top right menu.");
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
              <div key={contact.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group cursor-pointer" onClick={() => handleContactClick(contact.id)}>
                {contact.avatar_url ? (
                  <img src={contact.avatar_url} alt={contact.name} className="w-20 h-20 rounded-full object-cover mb-4 shadow-sm border border-gray-100 group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-sm group-hover:scale-105 transition-transform">
                    {contact.name.charAt(0)}
                  </div>
                )}
                <h3 className="text-lg font-bold text-gray-900">{contact.name}</h3>
                <p className="text-xs text-gray-500 mt-2 line-clamp-3 leading-relaxed">{contact.system_prompt}</p>
                <div className="mt-4 pt-4 border-t border-gray-50 w-full flex justify-between px-2">
                  <span className="text-blue-600 text-sm font-semibold group-hover:text-blue-700">Open Chat &rarr;</span>
                  {onPublishAgent && !contact.is_public && (
                    <span 
                      className="text-gray-400 hover:text-indigo-600 text-sm font-semibold transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPublishingAgent(contact);
                      }}
                    >
                      Publish
                    </span>
                  )}
                  {contact.is_public && (
                    <span className="text-emerald-500 text-xs font-semibold px-2 py-1 bg-emerald-50 rounded-md">Public</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={!!publishingAgent} onClose={() => setPublishingAgent(null)} title="Publish ke Explore">
        <form onSubmit={handlePublishSubmit} className="space-y-4">
          <p className="text-sm text-gray-500">
            Karakter <strong>{publishingAgent?.name}</strong> akan dibagikan secara publik di halaman Explore.
            Memori obrolan Anda <strong>TIDAK</strong> akan ikut dibagikan. Orang lain akan mengobrol dari awal.
          </p>
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
            <Button type="button" variant="ghost" onClick={() => setPublishingAgent(null)}>Batal</Button>
            <Button type="submit" variant="primary" className="bg-indigo-600 hover:bg-indigo-700">Publish Sekarang</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
