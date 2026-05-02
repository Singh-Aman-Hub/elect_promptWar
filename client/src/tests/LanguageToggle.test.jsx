import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LanguageToggle from '../components/LanguageToggle';
import { AppContext } from '../context/AppContext';

// Mock context value
function renderWithContext(language, setLanguage) {
  const contextValue = {
    language,
    setLanguage,
    messages: [],
    addMessage: vi.fn(),
    clearChat: vi.fn(),
    activeTab: 'chat',
    setActiveTab: vi.fn(),
    mapState: {},
    updateMapState: vi.fn(),
  };

  return render(
    <AppContext.Provider value={contextValue}>
      <LanguageToggle />
    </AppContext.Provider>
  );
}

describe('LanguageToggle', () => {
  it('renders all three language options', () => {
    renderWithContext('en', vi.fn());
    expect(screen.getByRole('button', { name: /Switch to English/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Switch to हिन्दी/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Switch to தமிழ்/i })).toBeInTheDocument();
  });

  it('marks the active language button as pressed', () => {
    renderWithContext('en', vi.fn());
    const enBtn = screen.getByRole('button', { name: /Switch to English/i });
    expect(enBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls setLanguage when a language button is clicked', () => {
    const mockSetLanguage = vi.fn();
    renderWithContext('en', mockSetLanguage);
    fireEvent.click(screen.getByRole('button', { name: /Switch to हिन्दी/i }));
    expect(mockSetLanguage).toHaveBeenCalledWith('hi');
  });

  it('does not mark non-active languages as pressed', () => {
    renderWithContext('en', vi.fn());
    const hiBtn = screen.getByRole('button', { name: /Switch to हिन्दी/i });
    expect(hiBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('switches active state when Tamil is selected', () => {
    const mockSetLanguage = vi.fn();
    renderWithContext('ta', mockSetLanguage);
    const taBtn = screen.getByRole('button', { name: /Switch to தமிழ்/i });
    expect(taBtn).toHaveAttribute('aria-pressed', 'true');
  });
});
