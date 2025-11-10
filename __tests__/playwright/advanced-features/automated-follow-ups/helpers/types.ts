export interface FollowUpMessage {
  id: string;
  conversation_id: string;
  reason: string;
  channel: 'email' | 'in_app';
  status: 'pending' | 'sent' | 'cancelled';
  scheduled_at: string;
  content: string;
}

export interface ConversationData {
  conversation_id: string;
  session_id: string;
  last_message: string;
  abandoned_at?: string;
}
