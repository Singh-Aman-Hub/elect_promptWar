import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatWindow from '../components/ChatWindow';
import { AppContext } from '../context/AppContext';

// Mock the geminiService
vi.mock('../services/geminiService', () => ({
  sendChatMessage: vi.fn(),
}));

import { sendChatMessage } from '../services/geminiService';

// Mock the general services (saveChatMessage)
vi.mock('../services', () => ({
  saveChatMessage: vi.fn(),
}));

import { saveChatMessage } from '../services';

function renderWithContext(messages = [], addMessage = vi.fn(), language = 'en') {
  const contextValue = {
    messages,
    addMessage,
    clearChat: vi.fn(),
    language,
    activeTab: 'chat',
    setActiveTab: vi.fn(),
  };

  return render(
    <AppContext.Provider value={contextValue}>
      <ChatWindow />
    </AppContext.Provider>
  );
}

describe('ChatWindow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('renders the chat header and empty state', () => {
    renderWithContext([]);
    expect(screen.getByText('ElectVoice AI')).toBeInTheDocument();
    expect(screen.getByText('Try asking about')).toBeInTheDocument();
  });

  it('shows suggested questions when chat is empty', () => {
    renderWithContext([]);
    expect(screen.getByText('How do I register to vote?')).toBeInTheDocument();
    expect(screen.getByText('What is Form 6?')).toBeInTheDocument();
  });

  it('sends a message when a suggested question is clicked', async () => {
    const mockAddMessage = vi.fn();
    sendChatMessage.mockResolvedValue('Mock response');
    
    renderWithContext([], mockAddMessage);
    
    const suggestedBtn = screen.getByText('How do I register to vote?');
    fireEvent.click(suggestedBtn);
    
    expect(mockAddMessage).toHaveBeenCalledWith({
      role: 'user',
      parts: [{ text: 'How do I register to vote?' }]
    });
    
    await waitFor(() => {
      expect(sendChatMessage).toHaveBeenCalled();
    });
  });

  it('sends a message when typing in the input and clicking send', async () => {
    const mockAddMessage = vi.fn();
    sendChatMessage.mockResolvedValue('Mock response');
    
    renderWithContext([], mockAddMessage);
    
    const input = screen.getByPlaceholderText(/Ask anything about Indian elections/i);
    const sendBtn = screen.getByLabelText('Send message');
    
    fireEvent.change(input, { target: { value: 'What is NOTA?' } });
    fireEvent.click(sendBtn);
    
    expect(mockAddMessage).toHaveBeenCalledWith({
      role: 'user',
      parts: [{ text: 'What is NOTA?' }]
    });
    
    await waitFor(() => {
      expect(sendChatMessage).toHaveBeenCalled();
    });
  });

  it('displays existing messages', () => {
    const messages = [
      { role: 'user', parts: [{ text: 'Hello' }] },
      { role: 'model', parts: [{ text: 'Hi there!' }] },
    ];
    renderWithContext(messages);
    
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('shows loading indicator while waiting for response', async () => {
    sendChatMessage.mockReturnValue(new Promise((resolve) => setTimeout(() => resolve('Delayed'), 50)));
    
    renderWithContext([]);
    
    const input = screen.getByPlaceholderText(/Ask anything about Indian elections/i);
    const sendBtn = screen.getByLabelText('Send message');
    
    fireEvent.change(input, { target: { value: 'Loading test' } });
    fireEvent.click(sendBtn);
    
    expect(screen.getByText('Thinking...')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    sendChatMessage.mockRejectedValue(new Error('API failure'));
    
    renderWithContext([]);
    
    const input = screen.getByPlaceholderText(/Ask anything about Indian elections/i);
    const sendBtn = screen.getByLabelText('Send message');
    
    fireEvent.change(input, { target: { value: 'Error test' } });
    fireEvent.click(sendBtn);
    
    await waitFor(() => {
      expect(screen.getByText('API failure')).toBeInTheDocument();
    });
  });
});
