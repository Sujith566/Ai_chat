import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import { api } from './services/api';

export default function App() {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [title, setTitle] = useState('');
  const [tone, setTone] = useState('Professional');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mongoConnected, setMongoConnected] = useState(false);

  const abortControllerRef = useRef(null);

  // Load initial health & conversations
  useEffect(() => {
    checkHealth();
    loadConversations();
  }, []);

  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setMongoConnected(data.mongoDbConnected);
      }
    } catch (e) {
      console.warn('Health check failed:', e);
    }
  };

  const loadConversations = async () => {
    try {
      const list = await api.getConversations();
      setConversations(list);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  // Switch conversation
  const handleSelectConversation = async (id) => {
    if (isStreaming) {
      abortControllerRef.current?.abort();
    }
    try {
      const conv = await api.getConversation(id);
      if (conv) {
        setCurrentConversationId(conv.conversationId);
        setMessages(conv.messages || []);
        setTitle(conv.title || 'Untitled Chat');
        setTone(conv.tone || 'Professional');
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  // Start fresh chat
  const handleNewChat = () => {
    if (isStreaming) {
      abortControllerRef.current?.abort();
    }
    setCurrentConversationId(null);
    setMessages([]);
    setTitle('New Conversation');
  };

  // Delete conversation
  const handleDeleteConversation = async (id) => {
    try {
      await api.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.conversationId !== id));
      if (currentConversationId === id) {
        handleNewChat();
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  // Stop real-time streaming
  const handleStopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setStreamingMessageId(null);
    }
  };

  // Send message with SSE streaming
  const handleSendMessage = async (promptText) => {
    if (!promptText.trim() || isStreaming) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Optimistic user message
    const tempUserMsg = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: promptText,
      tone,
      timestamp: new Date().toISOString(),
    };

    const tempAssistantId = `ast_${Date.now()}`;
    const tempAssistantMsg = {
      id: tempAssistantId,
      role: 'assistant',
      content: '',
      tone,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg, tempAssistantMsg]);
    setIsStreaming(true);
    setStreamingMessageId(tempAssistantId);

    // If new chat, set title optimistically
    if (!currentConversationId) {
      const words = promptText.trim().split(/\s+/).slice(0, 5).join(' ');
      setTitle(words);
    }

    await api.streamChat({
      conversationId: currentConversationId,
      prompt: promptText,
      tone,
      signal: controller.signal,
      onStart: (event) => {
        if (!currentConversationId && event.conversationId) {
          setCurrentConversationId(event.conversationId);
        }
      },
      onChunk: (chunk) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempAssistantId ? { ...m, content: m.content + chunk } : m
          )
        );
      },
      onDone: (event) => {
        setIsStreaming(false);
        setStreamingMessageId(null);
        if (event?.conversationId) {
          setCurrentConversationId(event.conversationId);
        }
        // Refresh sidebar history
        loadConversations();
      },
      onError: (errMsg) => {
        setIsStreaming(false);
        setStreamingMessageId(null);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempAssistantId
              ? { ...m, content: m.content + `\n\n⚠️ *Error: ${errMsg}*` }
              : m
          )
        );
      },
    });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0f19] text-slate-100 font-sans">
      {/* Sidebar for past conversations */}
      <Sidebar
        conversations={conversations}
        currentId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Chat Interface */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-[#0f1423] relative">
        <Header
          title={title}
          tone={tone}
          onToneChange={setTone}
          isStreaming={isStreaming}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          mongoConnected={mongoConnected}
          messages={messages}
        />

        <ChatWindow
          messages={messages}
          isStreaming={isStreaming}
          streamingMessageId={streamingMessageId}
          tone={tone}
          onSelectTone={setTone}
        />

        <ChatInput
          onSendMessage={handleSendMessage}
          onStopStream={handleStopStream}
          isStreaming={isStreaming}
          currentTone={tone}
        />
      </main>
    </div>
  );
}
