import { createContext, useContext, useState, useCallback } from 'react';

export const AppContext = createContext(null);

const INITIAL_MESSAGES = [
  {
    role: 'model',
    parts: [
      {
        text: `**Jai Hind! Welcome to ElectVoice!**

I'm your AI-powered guide to India's democratic process. I can help you with:

- **Voter Registration** — How to register, Form 6, NVSP portal
- **Voting Process** — EVM, VVPAT, polling day procedures
- **Election Rules** — Model Code of Conduct, candidate nomination
- **Vote Counting** — How results are tabulated and declared
- **Government Formation** — From results to oath-taking

What would you like to know about India's elections?`,
      },
    ],
  },
];

export function AppProvider({ children }) {
  const [language, setLanguage] = useState('en');
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [activeTab, setActiveTab] = useState('chat');
  const [mapState, setMapState] = useState({
    center: { lat: 28.6139, lng: 77.2090 },
    zoom: 12,
    selectedBooth: null,
  });

  const addMessage = useCallback((message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const clearChat = useCallback(() => {
    setMessages(INITIAL_MESSAGES);
  }, []);

  const updateMapState = useCallback((updates) => {
    setMapState((prev) => ({ ...prev, ...updates }));
  }, []);

  const value = {
    language,
    setLanguage,
    messages,
    setMessages,
    addMessage,
    clearChat,
    activeTab,
    setActiveTab,
    mapState,
    updateMapState,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
