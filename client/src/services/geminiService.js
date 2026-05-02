/**
 * geminiService.js
 * Abstracts all communication with the /api/chat backend endpoint.
 * The actual Gemini API key lives only on the server — never in client code.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Send a message to the Gemini-powered chat endpoint.
 * @param {Array} messages - Full conversation history in Gemini format
 * @param {string} language - Language code: 'en' | 'hi' | 'ta'
 * @returns {Promise<string>} - The AI response text
 */
export async function sendChatMessage(messages, language = 'en') {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages, language }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  const data = await response.json();
  return data.response;
}
