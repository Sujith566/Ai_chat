const API_BASE = '/api';

export const api = {
  async getConversations() {
    const res = await fetch(`${API_BASE}/conversations`);
    if (!res.ok) throw new Error('Failed to load history');
    const json = await res.json();
    return json.data || [];
  },

  async getConversation(id) {
    const res = await fetch(`${API_BASE}/conversations/${id}`);
    if (!res.ok) throw new Error('Failed to load conversation');
    const json = await res.json();
    return json.data;
  },

  async deleteConversation(id) {
    const res = await fetch(`${API_BASE}/conversations/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete conversation');
    return await res.json();
  },

  async createConversation(tone = 'Professional') {
    const res = await fetch(`${API_BASE}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tone }),
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    const json = await res.json();
    return json.data;
  },

  /**
   * Real-time SSE streaming chat consumer
   */
  async streamChat({
    conversationId,
    prompt,
    tone = 'Professional',
    onStart,
    onChunk,
    onDone,
    onError,
    signal,
  }) {
    try {
      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, prompt, tone }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`Server returned error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep partial line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const dataString = trimmed.replace('data: ', '').trim();
          if (!dataString) continue;

          try {
            const event = JSON.parse(dataString);
            if (event.type === 'start') {
              onStart?.(event);
            } else if (event.type === 'chunk') {
              onChunk?.(event.content);
            } else if (event.type === 'done') {
              onDone?.(event);
            } else if (event.type === 'error') {
              onError?.(event.error);
            }
          } catch (e) {
            console.warn('Failed to parse SSE JSON:', dataString, e);
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Stream generation aborted by user.');
        onDone?.({ aborted: true });
      } else {
        console.error('Stream error:', err);
        onError?.(err.message || 'Stream connection failed');
      }
    }
  },
};
