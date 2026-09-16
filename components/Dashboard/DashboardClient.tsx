"use client";

import { useState, useCallback, useEffect } from "react";
import { Sidebar } from "@/components/Chat/Sidebar";
import { ChatArea } from "@/components/Chat/ChatArea";
import { InfoPanel } from "@/components/Chat/InfoPanel";
import { NewChatModal } from "@/components/Chat/NewChatModal";
import { ContactsView } from "@/components/Chat/ContactsView";
import { ExploreView } from "@/components/Chat/ExploreView";
import { GroupsView } from "@/components/Chat/GroupsView";
import { ProfileView } from "@/components/Chat/ProfileView";
import { SettingsModal } from "@/components/Modern/SettingsModal";
import { useToast } from "@/components/Modern/Toast";
import { Agent } from "@/types/chat";
import { createClient } from "@/utils/supabase/client";

import { useDashboardData } from "@/hooks/useDashboardData";
import { useChat } from "@/hooks/useChat";
import { useProactiveChat } from "@/hooks/useProactiveChat";
import { useWebNotifications } from "@/hooks/useWebNotifications";
import { useVoiceCall } from "@/hooks/useVoiceCall";
import { CallModal } from "@/components/Call/CallModal";

export function DashboardClient({ initialUser }: { initialUser: any }) {
  const toast = useToast();
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
  } = useDashboardData(initialUser);

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"chat" | "contacts" | "explore" | "groups" | "profile">("chat");
  const [unreadRoomIds, setUnreadRoomIds] = useState<Set<string>>(new Set());
  
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const activeRoom = rooms.find(r => r.id === activeChatId) || null;

  const handleUnreadMessage = useCallback((roomId: string) => {
    setUnreadRoomIds(prev => new Set(prev).add(roomId));
  }, []);

  const handleSelectRoom = useCallback((id: string) => {
    setActiveChatId(id);
    setActiveView("chat");
    setUnreadRoomIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const {
    messages,
    inputValue,
    setInputValue,
    isCurrentlyTyping,
    handleSendMessage,
    handleClearChat
  } = useChat(activeChatId, activeRoom, handleUnreadMessage);

  const {
    permission: notificationPermission,
    canInstall: canInstallPwa,
    isStandalone,
    requestPermission: requestNotificationPermission,
    sendNotification,
    sendTestNotification,
    promptInstall: promptInstallPwa
  } = useWebNotifications({
    onOpenRoom: (roomId) => {
      handleSelectRoom(roomId);
    }
  });

  const { isCheckingProactive, triggerProactiveNow } = useProactiveChat({
    enabled: !!user,
    onProactiveMessage: (roomId, msgPayload) => {
      if (activeChatId !== roomId) {
        handleUnreadMessage(roomId);
      }
      if (typeof document !== "undefined" && (document.hidden || activeChatId !== roomId)) {
        sendNotification(msgPayload.agentName || "Multi-AI", {
          body: msgPayload.content,
          data: { roomId: msgPayload.roomId }
        });
      }
    }
  });

  const {
    isCallActive,
    activeRoom: callRoom,
    participants: callParticipants,
    durationSeconds: callDuration,
    isMicMuted: isCallMicMuted,
    isDeafened: isCallDeafened,
    activeSpeakerId: callActiveSpeakerId,
    currentSubtitle: callCurrentSubtitle,
    isAiThinking: isCallAiThinking,
    isEndingCall,
    startCall,
    endCall,
    toggleMicMute: toggleCallMicMute,
    toggleDeafen: toggleCallDeafen
  } = useVoiceCall({
    onCallEnded: (summary) => {
      toast.success(`Panggilan suara selesai. Memori grup diperbarui!`);
    }
  });

  // Realtime unread badges & notifications
  useEffect(() => {
    if (!user || rooms.length === 0) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`user-unread-messages-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new as any;
          if (newMsg.room_id !== activeChatId && rooms.some(r => r.id === newMsg.room_id)) {
            handleUnreadMessage(newMsg.room_id);
          }
          if (newMsg.sender_type === "AI" && (typeof document !== "undefined" && (document.hidden || newMsg.room_id !== activeChatId))) {
            const targetRoom = rooms.find(r => r.id === newMsg.room_id);
            const agent = targetRoom?.members.find(m => m.id === newMsg.sender_id);
            const senderName = agent ? agent.name : (targetRoom?.title || "Multi-AI");
            sendNotification(senderName, {
              body: newMsg.content,
              icon: agent?.avatar_url || "/icon-192.png",
              data: { roomId: newMsg.room_id }
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, rooms, activeChatId, handleUnreadMessage, sendNotification]);

  const handleOpenNewContact = () => setIsNewChatModalOpen(true);
  const handleOpenNewGroup = () => setIsNewChatModalOpen(true);

  if (isLoadingRooms) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium text-sm">Menyiapkan ruang obrolan AI Anda...</p>
        </div>
      </div>
    );
  }

  const theme = userSettings?.global_theme || "light";
  
  let themeClasses = "bg-white text-gray-800";
  if (theme === "dark") themeClasses = "bg-[#1A1A1A] text-gray-100";
  if (theme === "blue") themeClasses = "bg-blue-950 text-blue-50";
  if (theme === "sunset") themeClasses = "bg-gradient-to-br from-orange-50 to-rose-50 text-rose-900";

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans ${themeClasses}`}>
      <Sidebar 
        rooms={rooms}
        activeChatId={activeChatId}
        onSelectRoom={handleSelectRoom}
        onSelectView={setActiveView}
        onNewChat={() => setIsNewChatModalOpen(true)}
        activeView={activeView}
        isLoadingRooms={isLoadingRooms}
        userEmail={(user as any)?.email}
        unreadRoomIds={unreadRoomIds}
        canInstallPwa={canInstallPwa}
        onInstallPwa={promptInstallPwa}
        onLogout={handleLogout}
      />

      {activeView === "contacts" ? (
        <ContactsView 
          contacts={myContacts} 
          rooms={rooms} 
          onNewContact={handleOpenNewContact} 
          onPublishAgent={async (agentId, description) => {
            const success = await handlePublishAgent(agentId, description);
            return success;
          }}
          onSelectRoom={handleSelectRoom}
          onStartChatWithContact={async (agent) => {
            const newRoomId = await handleCreateChat(agent, agent.name);
            if (newRoomId) {
              handleSelectRoom(newRoomId);
              toast.success(`Chat dengan ${agent.name} dibuat!`);
            } else {
              toast.error("Gagal membuat chat. Coba lagi.");
            }
          }}
        />
      ) : activeView === "explore" ? (
        <ExploreView 
          currentUser={user as any}
          onStartChat={async (agent) => {
            const existingRoom = rooms.find(r =>
              r.type === "private" && r.members.some(m => m.id === agent.id)
            );
            if (existingRoom) {
              handleSelectRoom(existingRoom.id);
              toast.info(`Melanjutkan chat dengan ${agent.name}`);
              return;
            }
            const newRoomId = await handleCreateChat(agent, agent.name);
            if (newRoomId) {
              handleSelectRoom(newRoomId);
              toast.success(`Chat baru dengan ${agent.name} dimulai!`);
            } else {
              toast.error("Gagal membuat chat. Coba lagi.");
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
             handleSelectRoom(roomId);
          }}
          onNewContact={handleOpenNewContact}
          onPublishAgent={handlePublishAgent}
          onStartChatWithContact={async (agent) => {
            const existingRoom = rooms.find(r => r.type === "private" && r.members.some(m => m.id === agent.id));
            if (existingRoom) {
              handleSelectRoom(existingRoom.id);
              toast.info(`Melanjutkan chat dengan ${agent.name}`);
              return;
            }
            const newRoomId = await handleCreateChat(agent, agent.name);
            if (newRoomId) {
              handleSelectRoom(newRoomId);
              toast.success(`Chat dengan ${agent.name} dibuat!`);
            } else {
              toast.error("Gagal membuat chat. Coba lagi.");
            }
          }}
          onAddPersona={handleAddPersona}
          onDeletePersona={handleDeletePersona}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onLogout={handleLogout}
        />
      ) : activeView === "groups" ? (
        <GroupsView 
          rooms={rooms} 
          onSelectRoom={(roomId) => {
             handleSelectRoom(roomId);
          }} 
          onNewGroup={handleOpenNewGroup} 
        />
      ) : (
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
            onTriggerProactive={() => triggerProactiveNow(activeRoom.id, true)}
            isCheckingProactive={isCheckingProactive}
            onStartCall={() => startCall(activeRoom, user)}
          />
        ) : (
          <main className="flex-1 flex flex-col min-w-0 items-center justify-center bg-transparent p-6 text-center">
            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Selamat Datang di Multi-AI</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md">Pilih percakapan dari sidebar atau buat kontak dan grup AI baru untuk memulai obrolan maupun panggilan suara.</p>
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
          onAddMember={(agentId) => {
            const agent = myContacts.find(c => c.id === agentId);
            if (agent) handleAddMemberToActiveRoom(activeRoom.id, agent);
          }}
          onDeleteRoom={() => {
            handleDeleteRoom(activeRoom.id);
            setActiveChatId(null);
            setIsInfoOpen(false);
          }}
          onUpdateTheme={(theme) => handleUpdateTheme(activeRoom.id, theme)}
          onUpdateAgent={handleUpdateAgent}
          onUpdateRoomPersona={(personaId) => handleUpdateRoomPersona(activeRoom.id, personaId)}
          onClearMessages={handleClearChat}
        />
      )}

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={userSettings}
        onUpdateSettings={handleUpdateSettings}
        userEmail={user?.id ? (user as any).email || "User" : undefined}
        notificationPermission={notificationPermission}
        onRequestNotificationPermission={requestNotificationPermission}
        onSendTestNotification={sendTestNotification}
        canInstallPwa={canInstallPwa}
        isStandalone={isStandalone}
        onInstallPwa={promptInstallPwa}
        onLogout={handleLogout}
      />

      <NewChatModal 
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        myContacts={myContacts}
        onCreateChat={async (type, name, newMembers, selectedContactIds) => {
           let finalAgents: Agent[] = [];
           const existing = myContacts.filter(c => selectedContactIds.includes(c.id));
           finalAgents.push(...existing);

           for (const nm of newMembers) {
             const system_prompt = `You are ${nm.name}. Background/Personality: ${nm.characteristic}. Respond naturally based on your personality.`;
             const newAgent = await handleCreateContact(nm.name, system_prompt, nm.avatar_url);
             if (newAgent) {
               finalAgents.push(newAgent);
             }
           }

           if (finalAgents.length === 0) {
              toast.error("Gagal menambahkan anggota. Coba lagi.");
              return;
            }

           const newRoomId = await handleCreateChat(finalAgents, name);
           if (newRoomId) {
             setActiveChatId(newRoomId);
             setActiveView("chat");
             setIsNewChatModalOpen(false);
           }
        }}
      />

      <CallModal 
        isOpen={isCallActive}
        roomTitle={callRoom?.title || "Panggilan Suara"}
        isGroup={callRoom?.type === "group"}
        participants={callParticipants}
        durationSeconds={callDuration}
        activeSpeakerId={callActiveSpeakerId}
        currentSubtitle={callCurrentSubtitle}
        isMicMuted={isCallMicMuted}
        isDeafened={isCallDeafened}
        isAiThinking={isCallAiThinking}
        isEndingCall={isEndingCall}
        onToggleMic={toggleCallMicMute}
        onToggleDeafen={toggleCallDeafen}
        onEndCall={endCall}
      />
    </div>
  );
}
