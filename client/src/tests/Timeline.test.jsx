import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Timeline from '../components/Timeline';
import { AppContext } from '../context/AppContext';

// Mock the searchService
vi.mock('../services/searchService', () => ({
  fetchTimeline: vi.fn(),
}));

import { fetchTimeline } from '../services/searchService';

// Mock the geminiService
vi.mock('../services/geminiService', () => ({
  sendChatMessage: vi.fn(),
}));

import { sendChatMessage } from '../services/geminiService';

const MOCK_EVENTS = [
  {
    id: '1952',
    year: '1952',
    date: 'Oct 1951 – Feb 1952',
    title: 'First General Election',
    description: 'The first ever general election in independent India.',
    emoji: '🇮🇳',
    type: 'historical',
    seats: 489,
    voterTurnout: '45.7%',
    winner: 'INC',
  },
  {
    id: '2024',
    year: '2024',
    date: 'April – June 2024',
    title: '18th Lok Sabha Election',
    description: 'The most recent general election.',
    emoji: '🗳️',
    type: 'current',
    seats: 543,
    voterTurnout: '66.4%',
    winner: 'NDA',
  }
];

function renderWithContext() {
  const contextValue = {
    language: 'en',
    addMessage: vi.fn(),
    setActiveTab: vi.fn(),
  };

  return render(
    <AppContext.Provider value={contextValue}>
      <Timeline />
    </AppContext.Provider>
  );
}

describe('Timeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    fetchTimeline.mockReturnValue(new Promise(() => {}));
    renderWithContext();
    expect(screen.getByText(/Loading election timeline/i)).toBeInTheDocument();
  });

  it('renders timeline events after loading', async () => {
    fetchTimeline.mockResolvedValue(MOCK_EVENTS);
    sendChatMessage.mockResolvedValue('Mock AI Explanation');
    
    renderWithContext();
    
    await waitFor(() => {
      expect(screen.getByText('Indian Election Timeline')).toBeInTheDocument();
    });
    
    expect(screen.getAllByText('First General Election').length).toBeGreaterThan(0);
    expect(screen.getAllByText('18th Lok Sabha Election').length).toBeGreaterThan(0);
  });

  it('shows detailed info when an event is clicked', async () => {
    fetchTimeline.mockResolvedValue(MOCK_EVENTS);
    sendChatMessage.mockResolvedValue('AI explanation for first election');
    
    renderWithContext();
    
    await waitFor(() => screen.getByText('First General Election'));
    
    const eventBtn = screen.getByLabelText(/First General Election 1952/i);
    fireEvent.click(eventBtn);
    
    await waitFor(() => {
      expect(screen.getByText('AI explanation for first election')).toBeInTheDocument();
    });
  });

  it('handles API errors for timeline fetch', async () => {
    fetchTimeline.mockRejectedValue(new Error('Timeline fetch failed'));
    renderWithContext();
    
    await waitFor(() => {
      expect(screen.getByText(/Timeline fetch failed/i)).toBeInTheDocument();
    });
  });
});
