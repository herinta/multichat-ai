"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Chat/Sidebar";
import { ChatArea } from "@/components/Chat/ChatArea";
import { InfoPanel } from "@/components/Chat/InfoPanel";
import { NewChatModal } from "@/components/Chat/NewChatModal";
import { ContactsView } from "@/components/Chat/ContactsView";
import { ExploreView } from "@/components/Chat/ExploreView";
import { GroupsView } from "@/components/Chat/GroupsView";
import { ProfileView } from "@/components/Chat/ProfileView";
import { SettingsModal } from "@/components/Modern/SettingsModal";

import { useDashboardData } from "@/hooks/useDashboardData";
import { useChat } from "@/hooks/useChat";

export default function Dashboard() {
  const {
    user,
    rooms,
    userPersonas,
    userSettings,
    isLoadingRooms,
    myContacts,
    handleCreateChat,
    handleUpdateTheme,
    handleAddMemberToActiveRoom,
    handleDeleteRoom,
    handlePublishAgent,
    handleUpdateAgent,
    handleUpdateRoomPersona,
    handleAddPersona,
    handleEditPersona,
    handleDeletePersona,
    handleUpdateSettings,
    handleCreateContact,
    handleLogout
  } = useDashboardData();

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"chat" | "contacts" | "explore" | "groups" | "profile">("chat");
  const [chatCategory, setChatCategory] = useState<"All" | "Private" | "Group">("All");
  
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const activeRoom = rooms.find(r => r.id === activeChatId) || null;

  const {
    messages,
    inputValue,
    setInputValue,
    isCurrentlyTyping,
    handleSendMessage
  } = useChat(activeChatId, activeRoom);

  const handleOpenNewContact = () => setIsNewChatModalOpen(true);
  const handleOpenNewGroup = () => setIsNewChatModalOpen(true);

  if (isLoadingRooms) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Memuat data AI Anda...</p>
        </div>
      </div>
    );
  }

  const theme = userSettings?.global_theme || "light";
  
  let themeClasses = "bg-white text-gray-800"; // default light
  if (theme === "dark") themeClasses = "bg-[#1A1A1A] text-gray-100";
  if (theme === "blue") themeClasses = "bg-blue-950 text-blue-50";
  if (theme === "sunset") themeClasses = "bg-gradient-to-br from-orange-50 to-rose-50 text-rose-900";

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans ${themeClasses}`}>
      <Sidebar 
        rooms={rooms}
        activeChatId={activeChatId}
        onSelectRoom={(id) => {
          setActiveChatId(id);
          setActiveView("chat");
        }}
        onSelectView={setActiveView}
        onNewChat={() => setIsNewChatModalOpen(true)}
        activeView={activeView}
        isLoadingRooms={isLoadingRooms}
        userEmail={(user as any)?.email}
        onLogout={handleLogout}
      />

      {activeView === "contacts" ? (
        <ContactsView 
          contacts={myContacts} 
          rooms={rooms}
          onNewContact={handleOpenNewContact} 
          onPublishAgent={handlePublishAgent}
          onSelectRoom={(roomId) => {
             setActiveChatId(roomId);
             setActiveView("chat");
          }}
        />
      ) : activeView === "explore" ? (
        <ExploreView 
          onStartChat={async (agent) => {
            const newRoomId = await handleCreateChat(agent, agent.name);
            if (newRoomId) {
              setActiveChatId(newRoomId);
              setActiveView("chat");
            }
          }} 
        />
      ) : activeView === "profile" ? (
        <ProfileView
          userEmail={(user as any)?.email}
          userPersonas={userPersonas}
          contacts={myContacts}
          rooms={rooms}
          onSelectRoom={(roomId) => {
             setActiveChatId(roomId);
             setActiveView("chat");
          }}
          onNewContact={handleOpenNewContact}
          onPublishAgent={handlePublishAgent}
          onAddPersona={handleAddPersona}
          onEditPersona={handleEditPersona}
          onDeletePersona={handleDeletePersona}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      ) : activeView === "groups" ? (
        <GroupsView 
          rooms={rooms} 
          onSelectRoom={(roomId) => {
             setActiveChatId(roomId);
             setActiveView("chat");
          }} 
          onNewGroup={handleOpenNewGroup} 
        />
      ) : (
        /* Chat View */
        activeChatId && activeRoom ? (
          <ChatArea 
            activeRoom={activeRoom}
            messages={messages}
            isCurrentlyTyping={isCurrentlyTyping}
            inputValue={inputValue}
            isInfoOpen={isInfoOpen}
            onInputChange={setInputValue}
            onSendMessage={handleSendMessage}
            onToggleInfoPanel={() => setIsInfoOpen(!isInfoOpen)}
          />
        ) : (
          <main className="flex-1 flex flex-col min-w-0 items-center justify-center bg-transparent">
            <div className="w-20 h-20 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to your AI Dashboard</h2>
            <p className="text-gray-500 text-sm max-w-md text-center">Select a chat from the sidebar or navigate to Contacts, Explore, or Groups to get started.</p>
          </main>
        )
      )}

      {/* Slide-over Info Panel for Chat */}
      {isInfoOpen && activeRoom && activeView === "chat" && (
        <InfoPanel 
          activeRoom={activeRoom}
          myContacts={myContacts}
          userPersonas={userPersonas}
          onClose={() => setIsInfoOpen(false)}
          onAddMember={(agent) => handleAddMemberToActiveRoom(activeRoom.id, agent)}
          onDeleteRoom={() => {
            handleDeleteRoom(activeRoom.id);
            setActiveChatId(null);
            setIsInfoOpen(false);
          }}
          onUpdateTheme={(theme) => handleUpdateTheme(activeRoom.id, theme)}
          onUpdateAgent={handleUpdateAgent}
          onUpdateRoomPersona={(personaId) => handleUpdateRoomPersona(activeRoom.id, personaId)}
        />
      )}

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={userSettings}
        onUpdateSettings={handleUpdateSettings}
        userEmail={user?.id ? (user as any).email || "User" : undefined}
      />

      <NewChatModal 
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        myContacts={myContacts}
        onCreateChat={async (type, name, newMembers, selectedContactIds) => {
           let finalAgents: Agent[] = [];
           
           // 1. Fetch existing agents
           const existing = myContacts.filter(c => selectedContactIds.includes(c.id));
           finalAgents.push(...existing);

           // 2. Create new members in DB
           for (const nm of newMembers) {
             const system_prompt = `You are ${nm.name}. Background/Personality: ${nm.characteristic}. Respond naturally based on your personality.`;
             const newAgent = await handleCreateContact(nm.name, system_prompt, nm.avatar_url);
             if (newAgent) {
               finalAgents.push(newAgent);
             }
           }

           if (finalAgents.length === 0) {
             alert("Failed to add members");
             return;
           }

           // 3. Create Room
           const newRoomId = await handleCreateChat(finalAgents, name);
           if (newRoomId) {
             setActiveChatId(newRoomId);
             setActiveView("chat");
             setIsNewChatModalOpen(false);
           }
        }}
      />

    </div>
  );
}
