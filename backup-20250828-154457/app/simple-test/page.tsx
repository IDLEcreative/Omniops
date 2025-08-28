'use client';

import { useState } from 'react';

export default function SimpleTestPage() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Ready to test');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const sessionId = `test_${Date.now()}`;

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);
    setStatus('Sending message...');

    // Add user message to UI
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversation_id: conversationId || undefined,
          session_id: sessionId,
          domain: 'localhost',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update conversation ID
        if (!conversationId && data.conversation_id) {
          setConversationId(data.conversation_id);
        }

        // Add assistant message
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
        setStatus(`✅ Success! Test mode: ${data.test_mode ? 'Yes' : 'No'}`);
      } else {
        setMessages(prev => [...prev, { role: 'error', content: `Error: ${data.error || 'Unknown error'}` }]);
        setStatus(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      setMessages(prev => [...prev, { role: 'error', content: `Network error: ${errorMessage}` }]);
      setStatus(`❌ Network error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Simple Chat API Test</h1>
      
      <div className={`p-3 rounded mb-4 ${status.includes('✅') ? 'bg-green-100 text-green-800' : status.includes('❌') ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
        {status}
      </div>

      <div className="border rounded-lg h-96 overflow-y-auto p-4 mb-4 bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center">No messages yet. Type something below!</p>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-3 p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white ml-auto max-w-md'
                  : msg.role === 'assistant'
                  ? 'bg-green-500 text-white mr-auto max-w-md'
                  : 'bg-red-500 text-white mr-auto max-w-md'
              }`}
            >
              <div className="font-semibold text-sm mb-1">
                {msg.role === 'user' ? 'You' : msg.role === 'assistant' ? 'Assistant' : 'Error'}
              </div>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
          disabled={loading}
          className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>Session ID: {sessionId}</p>
        {conversationId && <p>Conversation ID: {conversationId}</p>}
      </div>
    </div>
  );
}