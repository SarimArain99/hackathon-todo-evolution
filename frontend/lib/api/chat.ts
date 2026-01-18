/**
 * Chat API Client for AI Chatbot
 *
 * Handles communication with the AI chatbot backend.
 */

import { apiRequest } from "../api";

// ============================================================================
// Type Definitions
// ============================================================================

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  role: "user" | "assistant";
  content: string | null;
  tool_calls: ToolCall[];
  created_at: string;
}

export interface Conversation {
  id: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationWithMessages {
  conversation: Conversation;
  messages: ChatMessage[];
}

export interface CreateMessageRequest {
  message: string;
  conversation_id?: number;
}

export interface ChatResponse {
  message: string;
  conversation_id: number;
  tool_calls: ToolCall[];
}

// ============================================================================
// Chat API Methods
// ============================================================================

export const chatApi = {
  /**
   * Send a message to the AI agent
   */
  async sendMessage(request: CreateMessageRequest): Promise<ChatResponse> {
    return apiRequest<ChatResponse>("/api/chat", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  /**
   * List all conversations for the current user
   */
  async listConversations(limit = 50): Promise<Conversation[]> {
    return apiRequest<Conversation[]>(`/api/chat/conversations?limit=${limit}`);
  },

  /**
   * Get a conversation with all its messages
   */
  async getConversation(conversationId: number): Promise<ConversationWithMessages> {
    return apiRequest<ConversationWithMessages>(
      `/api/chat/conversations/${conversationId}`
    );
  },

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: number): Promise<void> {
    return apiRequest<void>(`/api/chat/conversations/${conversationId}`, {
      method: "DELETE",
    });
  },
};
