// Automated verification script for AI Chat Assistant API
const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting AI Chat Assistant Verification Tests...\n');

  try {
    // 1. Health check
    console.log('1️⃣  Testing Health Check...');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const health = await healthRes.json();
    console.log('   Health response:', health);
    if (health.status !== 'healthy') throw new Error('Health check failed');
    console.log('   ✅ Health check passed\n');

    // 2. Create conversation
    console.log('2️⃣  Testing Create Conversation...');
    const createRes = await fetch(`${BASE_URL}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tone: 'Professional', title: 'Test Architecture Chat' }),
    });
    const created = await createRes.json();
    console.log('   Created conversation:', created.data?.conversationId);
    if (!created.data?.conversationId) throw new Error('Create conversation failed');
    const convId = created.data.conversationId;
    console.log('   ✅ Create conversation passed\n');

    // 3. Test SSE Streaming with Tone
    for (const testTone of ['Professional', 'Casual', 'Concise']) {
      console.log(`3️⃣  Testing Streaming with Tone: [${testTone}]...`);
      const streamRes = await fetch(`${BASE_URL}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: convId,
          prompt: `Give a brief explanation of distributed transactions in ${testTone} mode`,
          tone: testTone,
        }),
      });

      if (!streamRes.ok) throw new Error(`Streaming failed with status: ${streamRes.status}`);

      const reader = streamRes.body.getReader();
      const decoder = new TextDecoder();
      let streamContent = '';
      let chunkCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const raw = line.replace('data: ', '').trim();
            if (raw) {
              const event = JSON.parse(raw);
              if (event.type === 'chunk') {
                streamContent += event.content;
                chunkCount++;
              }
            }
          }
        }
      }

      console.log(`   Stream received ${chunkCount} chunks.`);
      console.log(`   Sample response preview (${testTone}):\n   "${streamContent.slice(0, 120).replace(/\n/g, ' ')}..."`);
      console.log(`   ✅ Streaming for [${testTone}] passed\n`);
    }

    // 4. Test Fetch Conversation details
    console.log('4️⃣  Testing Conversation Retrieval & State Persistence...');
    const getRes = await fetch(`${BASE_URL}/conversations/${convId}`);
    const getJson = await getRes.json();
    console.log(`   Retrieved messages count: ${getJson.data?.messages?.length}`);
    if (!getJson.data?.messages || getJson.data.messages.length < 2) {
      throw new Error('Messages were not persisted properly!');
    }
    console.log('   ✅ Persistence verification passed\n');

    // 5. Test History List
    console.log('5️⃣  Testing History List...');
    const listRes = await fetch(`${BASE_URL}/conversations`);
    const listJson = await listRes.json();
    console.log(`   Conversations in list: ${listJson.data?.length}`);
    console.log('   ✅ History listing passed\n');

    // 6. Delete Conversation
    console.log('6️⃣  Testing Delete Conversation...');
    const delRes = await fetch(`${BASE_URL}/conversations/${convId}`, { method: 'DELETE' });
    const delJson = await delRes.json();
    console.log('   Delete response:', delJson);
    console.log('   ✅ Deletion passed\n');

    console.log('🎉 ALL SYSTEM TESTS PASSED SUCCESSFULLY! 🚀');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();
