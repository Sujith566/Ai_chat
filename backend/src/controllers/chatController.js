import { v4 as uuidv4 } from 'uuid';
import { storageService } from '../services/storageService.js';
import { streamAIResponse } from '../services/aiService.js';

export const chatController = {
  // Get all conversation threads (Sidebar)
  async getConversations(req, res) {
    try {
      const conversations = await storageService.getAll();
      const summaries = conversations.map((c) => ({
        conversationId: c.conversationId,
        title: c.title || 'Untitled Chat',
        tone: c.tone || 'Professional',
        lastMessage: c.messages?.[c.messages.length - 1]?.content || '',
        updatedAt: c.updatedAt,
        messageCount: c.messages?.length || 0,
      }));
      res.json({ success: true, data: summaries });
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  },

  // Get specific conversation thread by ID
  async getConversationById(req, res) {
    try {
      const { id } = req.params;
      const conversation = await storageService.getById(id);
      if (!conversation) {
        return res.status(404).json({ success: false, error: 'Conversation not found' });
      }
      res.json({ success: true, data: conversation });
    } catch (error) {
      console.error('Error fetching conversation:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  },

  // Create new conversation
  async createConversation(req, res) {
    try {
      const { tone = 'Professional', title = 'New Conversation' } = req.body;
      const newConversation = {
        conversationId: uuidv4(),
        title,
        tone,
        messages: [],
      };
      const saved = await storageService.upsert(newConversation);
      res.status(201).json({ success: true, data: saved });
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  },

  // Delete a conversation
  async deleteConversation(req, res) {
    try {
      const { id } = req.params;
      await storageService.delete(id);
      res.json({ success: true, message: 'Conversation deleted successfully' });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  },

  // Stream chat endpoint (Server-Sent Events)
  async streamChat(req, res) {
    const { conversationId, prompt, tone = 'Professional' } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ success: false, error: 'Prompt is required.' });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const sendEvent = (eventData) => {
      res.write(`data: ${JSON.stringify(eventData)}\n\n`);
    };

    try {
      // Find or create conversation thread
      let conversation = null;
      if (conversationId) {
        conversation = await storageService.getById(conversationId);
      }

      if (!conversation) {
        // Generate a smart title from first 6 words of user prompt
        const words = prompt.trim().split(/\s+/).slice(0, 6).join(' ');
        const title = words.length > 30 ? words.slice(0, 30) + '...' : words;
        conversation = {
          conversationId: conversationId || uuidv4(),
          title: title || 'New Chat',
          tone,
          messages: [],
        };
      }

      // Update tone preference on conversation
      conversation.tone = tone;

      // Append user message
      const userMessage = {
        id: uuidv4(),
        role: 'user',
        content: prompt.trim(),
        tone,
        timestamp: new Date(),
      };
      conversation.messages.push(userMessage);

      // Assistant message placeholder
      const assistantMessageId = uuidv4();
      sendEvent({
        type: 'start',
        conversationId: conversation.conversationId,
        messageId: assistantMessageId,
        userMessage,
        tone,
      });

      let fullAssistantContent = '';

      // Stream generation from AI Service (passing system instruction based on Tone)
      const streamGenerator = streamAIResponse({
        messages: conversation.messages,
        tone,
      });

      for await (const chunk of streamGenerator) {
        fullAssistantContent += chunk;
        sendEvent({
          type: 'chunk',
          content: chunk,
        });
      }

      // Save assistant message to conversation
      const assistantMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: fullAssistantContent,
        tone,
        timestamp: new Date(),
      };
      conversation.messages.push(assistantMessage);

      // Persist to MongoDB / storage
      const savedConversation = await storageService.upsert(conversation);

      sendEvent({
        type: 'done',
        conversationId: savedConversation.conversationId,
        assistantMessage,
      });

      res.end();
    } catch (error) {
      console.error('Streaming error:', error);
      sendEvent({
        type: 'error',
        error: error.message || 'Error occurred while streaming response.',
      });
      res.end();
    }
  },
};
