export type Agent = {
  id: string;
  name: string;
  role: string;
  system_prompt: string;
  avatar_url?: string;
  creator_id?: string;
  is_public?: boolean;
  description?: string;
};

export type Room = {
  id: string;
  title: string;
  user_id: string;
  members: Agent[];
  type: "private" | "group";
  theme?: string;
  memory?: string;
  user_persona_id?: string;
};

export type Message = {
  id: string;
  sender_type: "USER" | "AI" | "SYSTEM";
  sender_id?: string;
  content: string;
  created_at: string;
  senderName?: string;
};

export type UserPersona = {
  id: string;
  user_id: string;
  name: string;
  background?: string;
  personality?: string;
  is_default: boolean;
};

export type UserSettings = {
  user_id: string;
  muted_words: string[];
  global_theme?: string;
};
