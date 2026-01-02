// shared/types/message.ts
export type Message = {
  id: number;
  message_id: string;
  project_idx: number;
  user_from: string;
  user_to: string;
  message_text: string;
  created_at: string;
  updated_at: string;
};

export type MessageInput = {
  message_id?: string;       
  conversation_id: string;  
  user_to?: string | null;
  message_text: string;
};

export type Conversation = {
  conversation_id: string;  
  project_idx: number;
  participant_ids: string[] 
  title: string | null;      
  last_message: string | null;
  last_message_at: string | null;
};