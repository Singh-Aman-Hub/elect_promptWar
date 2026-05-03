import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Trash2, Bot, User, Sparkles, AlertCircle } from 'lucide-react';
import PropTypes from 'prop-types';
import { useAppContext } from '../context/AppContext';
import { sendChatMessage } from '../services/geminiService';
import { saveChatMessage } from '../services';

const SUGGESTED_QUESTIONS = [
  'How do I register to vote?',
  'What is Form 6?',
  'How does EVM work?',
  'What is NOTA?',
  'How are votes counted?',
  'What is Model Code of Conduct?',
];

/**
 * ChatWindow — full-height conversational AI chat with Gemini
 */
export default function ChatWindow() {
  const { messages, addMessage, clearChat, language } = useAppContext();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = useCallback(
    async (text) => {
      const messageText = (text || inputText).trim();
      if (!messageText || isLoading) return;

      setInputText('');
      setError(null);

      const userMessage = { role: 'user', parts: [{ text: messageText }] };
      addMessage(userMessage);
      setIsLoading(true);

      // GA4 Tracking
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'chat_message_sent', { language });
      }

      // Firebase Firestore Logging
      saveChatMessage(messageText, language);

      try {
        const updatedMessages = [...messages, userMessage];
        const responseText = await sendChatMessage(updatedMessages, language);
        addMessage({ role: 'model', parts: [{ text: responseText }] });
      } catch (err) {
        setError(err.message || 'Failed to get response. Please try again.');
      } finally {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [inputText, isLoading, messages, addMessage, language]
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  return (
    <div className="flex flex-col w-full h-full min-h-0 bg-[#F0F4F8]">
      {/* ── Chat Header ── */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0 relative z-10 bg-white border-b border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          {/* Bot avatar with pulse ring */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-[14px] flex items-center justify-center bg-gradient-to-br from-[#FF6B00] to-[#FF9933] shadow-md shadow-orange-500/20">
              <Bot size={22} color="white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-green-500" />
          </div>
          <div>
            <h2 className="font-display font-black text-[#0F172A] text-lg leading-none">
              ElectVoice AI
            </h2>
            <p className="text-xs mt-1 flex items-center gap-1 font-semibold text-[#64748B]">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
              Online · Gemini 1.5 Flash
            </p>
          </div>
        </div>

        <button
          onClick={clearChat}
          aria-label="Clear chat history"
          title="Clear chat"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-[#64748B] bg-slate-50 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 shadow-sm"
        >
          <Trash2 size={14} />
          Clear
        </button>
      </div>

      {/* ── Messages area — fills all remaining space ── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6" id="chat-messages-area">
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} index={index} />
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex items-end gap-3 animate-fade-in-up">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[#FF6B00] to-[#FF9933] shadow-sm">
              <Bot size={14} color="white" />
            </div>
            <div className="px-5 py-3.5 rounded-2xl rounded-bl-sm bg-white border border-[#E2E8F0] shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="text-xs ml-2 font-bold text-[#64748B]">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm animate-fade-in bg-red-50 border border-red-200 text-red-600 shadow-sm" role="alert">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-red-700 mb-0.5">Error</p>
              <p className="text-xs font-medium">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-xs opacity-60 hover:opacity-100 transition-opacity flex-shrink-0 font-bold" aria-label="Dismiss error">
              ✕
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Suggested questions — only when fresh ── */}
      {messages.length <= 1 && !isLoading && (
        <div className="px-4 sm:px-6 py-4 flex-shrink-0 bg-white border-t border-[#E2E8F0] shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
          <p className="text-xs font-bold mb-3 flex items-center gap-1.5 text-[#64748B] uppercase tracking-wider">
            <Sparkles size={14} className="text-[#FF6B00]" />
            Try asking about
          </p>
          <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="flex-shrink-0 text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:scale-[1.02] bg-slate-50 border border-slate-200 text-[#334155] hover:border-[#FF6B00] hover:text-[#FF6B00] shadow-sm hover:shadow-md"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input area ── */}
      <div className="px-4 sm:px-6 pt-4 pb-6 flex-shrink-0 bg-white border-t border-[#E2E8F0]">
        <div className="flex items-end gap-3 rounded-2xl px-4 py-3 bg-slate-50 border border-slate-200 transition-all focus-within:border-[#FF6B00] focus-within:ring-2 focus-within:ring-[#FF6B00]/20 shadow-inner">
          <textarea
            ref={inputRef}
            id="chat-input"
            aria-label="Message input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleTextareaInput}
            placeholder="Ask anything about Indian elections..."
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none bg-transparent outline-none text-[15px] font-medium py-1.5 text-[#0F172A] placeholder-[#94A3B8]"
            style={{
              minHeight: '32px',
              maxHeight: '120px',
              fontFamily: 'var(--font-sans)',
              lineHeight: '1.5',
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !inputText.trim()}
            aria-label="Send message"
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-br from-[#FF6B00] to-[#FF9933] shadow-md shadow-orange-500/20 hover:scale-[1.05]"
          >
            <Send size={18} color="white" className="ml-0.5" />
          </button>
        </div>
        
        {/* Footer hint */}
        <p className="text-center text-xs mt-3 text-[#94A3B8] font-semibold">
          AI generated content. Verify critical details with{' '}
          <a href="https://eci.gov.in" target="_blank" rel="noopener noreferrer" className="text-[#FF6B00] hover:underline">
            eci.gov.in
          </a>
        </p>
      </div>
    </div>
  );
}

/* ── Individual message bubble ── */
function ChatMessage({ message, index }) {
  const isUser = message.role === 'user';
  const text = message.parts?.[0]?.text || '';

  return (
    <div
      className={`flex items-end gap-3 animate-fade-in-up ${isUser ? 'flex-row-reverse' : ''}`}
      style={{ animationDelay: `${Math.min(index * 0.04, 0.25)}s` }}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
          isUser ? 'bg-slate-200' : 'bg-gradient-to-br from-[#FF6B00] to-[#FF9933]'
        }`}
      >
        {isUser ? <User size={14} className="text-[#475569]" /> : <Bot size={14} color="white" />}
      </div>

      {/* Bubble */}
      <div
        className={`px-5 py-3.5 rounded-2xl shadow-sm ${
          isUser 
          ? 'rounded-br-sm bg-gradient-to-br from-[#FF6B00] to-[#FF9933] text-white shadow-orange-500/10' 
          : 'rounded-bl-sm bg-white border border-[#E2E8F0] text-[#0F172A]'
        }`}
        style={{ maxWidth: 'min(85%, 600px)' }}
      >
        {isUser ? (
          <p className="text-[15px] font-medium leading-relaxed whitespace-pre-wrap">{text}</p>
        ) : (
          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

ChatMessage.propTypes = {
  message: PropTypes.shape({
    role: PropTypes.string.isRequired,
    parts: PropTypes.arrayOf(
      PropTypes.shape({
        text: PropTypes.string.isRequired,
      })
    ).isRequired,
  }).isRequired,
  index: PropTypes.number.isRequired,
};

