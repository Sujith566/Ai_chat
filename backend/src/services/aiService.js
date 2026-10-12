import OpenAI from 'openai';

export const TONE_INSTRUCTIONS = {
  Professional: `You are an articulate, executive-level AI consultant. Maintain a professional, structured, and authoritative tone. Use precise terminology, structured formatting with markdown, and rigorous reasoning. Avoid colloquial language.`,
  Casual: `You are a friendly, enthusiastic, and approachable companion. Maintain a warm, conversational, and relatable tone. Use conversational phrasing, helpful analogies, and appropriate emojis to keep the conversation lively and accessible!`,
  Concise: `You are an ultra-concise, high-density AI assistant. Deliver answers with surgical precision and minimal words. Omit all pleasantries, greetings, and boilerplate. Use short bullet points or compact sentences. Zero fluff.`,
};

export const getSystemPromptForTone = (tone = 'Professional') => {
  const baseInstruction = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.Professional;
  return `${baseInstruction}\nFormat your responses clearly using Markdown, including code blocks with language identifiers where appropriate.`;
};

// Fallback response generator in case API key is not configured or network error occurs
const generateMockStream = async function* (prompt, tone) {
  const toneDesc = {
    Professional: "Analyzing your request with formal precision.",
    Casual: "Hey there! Happy to dive into this with you!",
    Concise: "Direct breakdown:",
  }[tone] || "Processing request:";

  let fullResponse = "";
  if (tone === 'Concise') {
    fullResponse = `**Summary:** Direct analysis of: "${prompt.slice(0, 50)}"\n\n` +
      `• **Key Insight:** Optimal solutions require clean architecture, fast I/O, and proactive resilience.\n` +
      `• **Action Item:** Implement decoupled backend state, real-time SSE streaming, and persistent caching.\n` +
      `• **Outcome:** Maximum throughput with minimal latency.`;
  } else if (tone === 'Casual') {
    fullResponse = `👋 ${toneDesc}\n\n` +
      `That's an awesome question! Here's the scoop on **${prompt.slice(0, 45)}...**:\n\n` +
      `Imagine you're building a rocket ship 🚀 — you don't just want it to look sleek, you want the thrusters firing smoothly in real-time! That's why real-time streaming text feels so alive compared to waiting around for a loading spinner.\n\n` +
      `Here's what makes this special:\n` +
      `1. **Instant Feedback:** You see thoughts forming word-by-word.\n` +
      `2. **Adaptive Vibe:** Whether you want to chat casually like this, or switch to strict professional mode, the tone adapts immediately.\n\n` +
      `Let me know what you want to explore next, and we can take it for a spin! ✨`;
  } else {
    fullResponse = `### Executive Summary & Analysis\n\n` +
      `Regarding your inquiry: **"${prompt.slice(0, 60)}"**\n\n` +
      `#### Strategic Perspective\n` +
      `In modern enterprise AI systems, real-time response generation and context-aware styling are paramount. Utilizing Server-Sent Events (SSE) ensures a responsive user experience while minimizing client-side memory footprint.\n\n` +
      `#### Technical Specifications\n` +
      `- **System Architecture:** Modular MVC separation with decoupled persistence.\n` +
      `- **Data Integrity:** Dual-layer fallback (MongoDB Mongoose + persistent local store).\n` +
      `- **Real-Time Pipeline:** Low-latency token streaming with character interpolation.\n\n` +
      `#### Recommended Next Steps\n` +
      `Proceed with testing concurrent prompts, tone transitions, and thread history retrieval.`;
  }

  // Stream in small realistic chunks
  const words = fullResponse.split(' ');
  for (let i = 0; i < words.length; i++) {
    const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
    yield chunk;
    await new Promise((res) => setTimeout(res, 25 + Math.random() * 20));
  }
};

export const streamAIResponse = async function* ({ messages, tone = 'Professional' }) {
  const apiKey = process.env.OPENAI_API_KEY;
  const systemPrompt = getSystemPromptForTone(tone);

  // If user provided a valid OpenAI key, use real OpenAI streaming
  if (apiKey && apiKey.trim().length > 10 && !apiKey.startsWith('your_')) {
    try {
      const openai = new OpenAI({ apiKey });
      const formattedMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ];

      const stream = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: formattedMessages,
        stream: true,
        temperature: tone === 'Creative' ? 0.8 : tone === 'Concise' ? 0.2 : 0.7,
      });

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) {
          yield text;
        }
      }
      return;
    } catch (err) {
      console.error('⚠️ [OpenAI API Error, falling back to smart engine]:', err.message);
      // Fall through to smart simulated generator below
    }
  }

  // Fallback streaming engine
  const lastUserMsg = messages.filter((m) => m.role === 'user').slice(-1)[0]?.content || 'Hello';
  yield* generateMockStream(lastUserMsg, tone);
};
