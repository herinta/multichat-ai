import { useState } from "react";
import { Room } from "@/types/chat";
import { Button } from "@/components/Modern/Button";
import { useToast } from "@/components/Modern/Toast";

interface SidebarProps {
  rooms: Room[];
  activeChatId: string | null;
  activeView: "chat" | "contacts" | "explore" | "groups" | "profile";
  isLoadingRooms: boolean;
  userEmail?: string;
  unreadRoomIds?: Set<string>;
  canInstallPwa?: boolean;
  onInstallPwa?: () => void;
  onSelectRoom: (roomId: string) => void;
  onSelectView: (view: "contacts" | "explore" | "groups" | "profile") => void;
  onLogout: () => void;
  onNewChat: () => void;
}

export function Sidebar({
  rooms,
  activeChatId,
  activeView,
  isLoadingRooms,
  userEmail,
  unreadRoomIds,
  canInstallPwa,
  onInstallPwa,
  onSelectRoom,
  onSelectView,
  onLogout,
  onNewChat
}: SidebarProps) {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const filteredRooms = rooms.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <aside className="w-80 flex-shrink-0 border-r border-gray-200 flex flex-col h-full z-10 bg-white shadow-sm">
      <div className="p-4 border-b border-gray-100 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Dashboard</h1>
          <div className="flex gap-2">
            <Button 
              variant="ghost"
              className="p-2 text-gray-400 hover:text-red-500"
              onClick={onLogout}
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </Button>
            <Button 
              variant="ghost"
              className="p-2 text-blue-600"
              onClick={onNewChat}
              title="New Chat"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Button>
          </div>
        </div>
        
        {/* Top Menu Section */}
        <nav className="flex flex-col gap-1">
          <button 
            onClick={() => onSelectView("contacts")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeView === 'contacts' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Contacts
          </button>
          
          <button 
            onClick={() => onSelectView("explore")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeView === 'explore' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            Explore AI
          </button>

          <button 
            onClick={() => onSelectView("groups")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeView === 'groups' ? 'bg-purple-50 text-purple-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Groups
          </button>
        </nav>
      </div>
      
      {/* Bottom Recent Section */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        <div className="px-4 py-3 border-b border-gray-50">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Recent</h2>
          {/* Search */}
          <div className="relative">
            <svg className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cari chat..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
            />
          </div>
        </div>
        
        {isLoadingRooms ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading chats...</div>
        ) : filteredRooms.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            {searchQuery ? `Tidak ada chat "${searchQuery}"` : "No recent chats."}
          </div>
        ) : (
          filteredRooms.map(room => (
            <div 
              key={room.id} 
              onClick={() => onSelectRoom(room.id)}
              className={`
                p-4 cursor-pointer transition-colors border-b border-gray-50 flex items-center gap-3
                ${activeChatId === room.id && activeView === 'chat' ? 'bg-blue-50/50' : 'hover:bg-gray-50'}
              `}
            >
              <div className="relative shrink-0">
                <div className={`w-12 h-12 bg-cover bg-center rounded-full flex items-center justify-center text-white font-bold shadow-inner ${room.type === 'group' ? 'bg-gradient-to-br from-indigo-400 to-purple-500' : 'bg-gradient-to-br from-blue-400 to-cyan-500'}`}
                     style={room.type === 'private' && room.members[0]?.avatar_url ? { backgroundImage: `url(${room.members[0].avatar_url})` } : undefined}
                >
                  {(!room.type || room.type === 'group' || !room.members[0]?.avatar_url) && room.title.substring(0, 2).toUpperCase()}
                </div>
                {/* Unread badge */}
                {unreadRoomIds?.has(room.id) && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-500 border-2 border-white rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-semibold truncate ${unreadRoomIds?.has(room.id) ? 'text-blue-700' : 'text-gray-900'}`}>{room.title}</div>
                <div className="text-xs mt-0.5 text-gray-500 truncate">
                  {room.type === "group" ? `${room.members.length} members` : "Private Chat"}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* PWA Add to Home Screen Banner */}
      {canInstallPwa && onInstallPwa && (
        <div className="px-4 pb-2">
          <button
            onClick={onInstallPwa}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold rounded-xl shadow-xs hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-95"
          >
            <span>📲</span>
            <span>Pasang di Layar Utama HP</span>
          </button>
        </div>
      )}

      {/* Bottom Profile Section with Logout Button */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50 mt-auto">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onSelectView("profile")}
            className={`flex items-center gap-3 flex-1 min-w-0 p-2 rounded-xl transition-all ${
              activeView === 'profile' ? 'bg-white shadow-sm ring-1 ring-gray-200' : 'hover:bg-gray-100'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0 shadow-xs">
              {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="font-semibold text-gray-900 text-sm truncate">{userEmail ? userEmail.split('@')[0] : 'My Profile'}</div>
              <div className="text-xs text-gray-500 truncate">Settings & Persona</div>
            </div>
          </button>

          {onLogout && (
            <button
              onClick={() => {
                toast.confirm({
                  title: "Keluar dari Akun",
                  message: "Apakah Anda yakin ingin keluar dari sesi Multi-AI ini?",
                  confirmText: "Ya, Keluar",
                  cancelText: "Batal",
                  variant: "danger",
                  onConfirm: () => {
                    onLogout();
                  }
                });
              }}
              title="Keluar / Log Out"
              className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all shrink-0 active:scale-95 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

