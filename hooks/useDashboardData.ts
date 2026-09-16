import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Room, Agent, UserPersona, UserSettings } from "@/types/chat";

export function useDashboardData(initialUser?: any) {
  const supabase = createClient();
  
  const [user, setUser] = useState<{ id: string; email?: string } | null>(initialUser || null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [userPersonas, setUserPersonas] = useState<UserPersona[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [myContacts, setMyContacts] = useState<Agent[]>([]);

  // Compute global address book
  useEffect(() => {
    const map = new Map<string, Agent>();
    rooms.forEach(r => {
      r.members.forEach(m => {
        if (!map.has(m.id)) {
          map.set(m.id, m);
        }
      });
    });
    setMyContacts(Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name)));
  }, [rooms]);

  // Fetch User & Rooms on Mount
  useEffect(() => {
    const initData = async () => {
      let currentUser = initialUser;
      if (!currentUser) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        currentUser = authUser;
      }
      if (!currentUser) {
        setIsLoadingRooms(false);
        return;
      }
      setUser(currentUser);

      // Fetch Rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select(`
          id, title, user_id, theme, user_persona_id,
          room_party (
            agents ( id, name, role, system_prompt, avatar_url, creator_id, is_public, description )
          )
        `)
        .order('created_at', { ascending: false });

      if (roomsError) {
        console.error("Error fetching rooms:", roomsError);
        return;
      }

      // Map Supabase response to our local Room type
      const mappedRooms: Room[] = (roomsData || []).map((r: any) => {
        const members = r.room_party.map((rp: any) => Array.isArray(rp.agents) ? rp.agents[0] : rp.agents).filter(Boolean);
        return {
          id: r.id,
          title: r.title,
          user_id: r.user_id,
          members: members,
          type: members.length > 1 ? "group" : "private",
          theme: r.theme,
          user_persona_id: r.user_persona_id
        };
      });

      setRooms(mappedRooms);

      // Fetch Personas
      const { data: personasData } = await supabase.from('user_personas').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: true });
      if (personasData) setUserPersonas(personasData);

      // Fetch Settings
      let { data: settingsData, error: settingsError } = await supabase.from('user_settings').select('*').eq('user_id', currentUser.id).maybeSingle();
      if (settingsError) console.error("Error fetching settings:", settingsError);
      
      if (!settingsData && !settingsError) {
        const { data: newSettings } = await supabase.from('user_settings').insert({ user_id: currentUser.id }).select().maybeSingle();
        if (newSettings) settingsData = newSettings;
      }
      if (settingsData) setUserSettings(settingsData);

      setIsLoadingRooms(false);
    };

    initData();
  }, [supabase]);

  // Actions
  const handleCreateChat = async (agent: Agent | Agent[], chatName?: string) => {
    if (!user) return null;
    const agents = Array.isArray(agent) ? agent : [agent];
    const roomTitle = chatName || (agents.length === 1 ? agents[0].name : "New Group Chat");

    try {
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .insert({ title: roomTitle, user_id: user.id })
        .select()
        .single();
      
      if (roomError) throw roomError;

      const roomPartyData = agents.map(a => ({ room_id: roomData.id, agent_id: a.id }));

      const { error: partyError } = await supabase.from('room_party').insert(roomPartyData);
      if (partyError) throw partyError;

      const newRoom: Room = {
        id: roomData.id,
        title: roomData.title,
        user_id: roomData.user_id,
        members: agents,
        type: agents.length > 1 ? "group" : "private"
      };

      setRooms(prev => [newRoom, ...prev]);
      return newRoom.id;
    } catch (error) {
      console.error("Error creating chat:", error);
      return null;
    }
  };

  const handleUpdateTheme = async (roomId: string, theme: string) => {
    try {
      const { error } = await supabase.from('rooms').update({ theme }).eq('id', roomId);
      if (error) throw error;
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, theme } : r));
    } catch (error) {
      console.error("Failed to update theme:", error);
    }
  };

  const handleAddMemberToActiveRoom = async (roomId: string, agent: Agent) => {
    try {
      const { error } = await supabase.from('room_party').insert({ room_id: roomId, agent_id: agent.id });
      if (error) throw error;
      setRooms(prev => prev.map(r => {
        if (r.id === roomId) {
          const members = [...r.members, agent];
          return { ...r, members, type: members.length > 1 ? "group" : "private" };
        }
        return r;
      }));
    } catch (error) {
      console.error("Failed to add member:", error);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      const { error } = await supabase.from('rooms').delete().eq('id', roomId);
      if (error) throw error;
      setRooms(prev => prev.filter(r => r.id !== roomId));
      return true;
    } catch (error) {
      console.error("Failed to delete room:", error);
      return false;
    }
  };

  const handlePublishAgent = async (agentId: string, description: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error } = await supabase.from('agents').update({
        is_public: true,
        description: description,
        creator_id: user.id
      }).eq('id', agentId);
      
      if (error) throw error;
      
      // Update local state to reflect publish status
      setRooms(prev => prev.map(r => ({
        ...r,
        members: r.members.map(m => m.id === agentId ? { ...m, is_public: true, description } : m)
      })));
      return true;
    } catch (error) {
      console.error("Failed to publish agent:", error);
      return false;
    }
  };

  const handleUpdateAgent = async (agentId: string, updates: Partial<Agent>): Promise<boolean> => {
    try {
      const { error } = await supabase.from('agents').update(updates).eq('id', agentId);
      if (error) throw error;
      setRooms(prev => prev.map(r => ({
        ...r,
        members: r.members.map(m => m.id === agentId ? { ...m, ...updates } : m)
      })));
      return true;
    } catch (error) {
      console.error("Failed to update agent:", error);
      return false;
    }
  };

  const handleUpdateRoomPersona = async (roomId: string, personaId: string | null) => {
    try {
      const { error } = await supabase.from('rooms').update({ user_persona_id: personaId }).eq('id', roomId);
      if (error) throw error;
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, user_persona_id: personaId || undefined } : r));
    } catch (error) {
      console.error("Failed to update persona:", error);
    }
  };

  const handleAddPersona = async (name: string, background: string, personality: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('user_personas').insert({
        user_id: user.id,
        name, background, personality
      }).select().single();
      if (error) throw error;
      setUserPersonas(prev => [...prev, data]);
    } catch (error) {
      console.error("Failed to add persona:", error);
    }
  };

  const handleEditPersona = async (id: string, name: string, background: string, personality: string) => {
    try {
      const { error } = await supabase.from('user_personas').update({
        name, background, personality
      }).eq('id', id);
      if (error) throw error;
      setUserPersonas(prev => prev.map(p => p.id === id ? { ...p, name, background, personality } : p));
    } catch (error) {
      console.error("Failed to update persona:", error);
    }
  };

  const handleDeletePersona = async (id: string) => {
    try {
      const { error } = await supabase.from('user_personas').delete().eq('id', id);
      if (error) throw error;
      setUserPersonas(prev => prev.filter(p => p.id !== id));
      
      // Clear from rooms that used it
      setRooms(prev => prev.map(r => r.user_persona_id === id ? { ...r, user_persona_id: undefined } : r));
    } catch (error) {
      console.error("Failed to delete persona:", error);
    }
  };

  const handleUpdateSettings = async (settings: Partial<UserSettings>) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('user_settings').update(settings).eq('user_id', user.id);
      if (error) throw error;
      setUserSettings(prev => prev ? { ...prev, ...settings } : { user_id: user.id, muted_words: [], ...settings } as UserSettings);
    } catch (error) {
      console.error("Failed to update settings:", error);
    }
  };

  const handleCreateContact = async (name: string, system_prompt: string, avatar_url?: string) => {
    try {
      const { data, error } = await supabase.from('agents').insert({
        name,
        system_prompt,
        role: "assistant",
        avatar_url,
        creator_id: user?.id,
        is_public: false
      }).select().single();
      if (error) throw error;
      
      // Update myContacts by fetching again or just returning it for immediate use
      return data as Agent;
    } catch (error) {
      console.error("Failed to create contact:", error);
      return null;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return {
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
  };
}
