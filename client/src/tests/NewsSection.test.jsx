import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import NewsSection from '../components/NewsSection';

// Mock the searchService
vi.mock('../services/searchService', () => ({
  fetchElectionNews: vi.fn(),
}));

import { fetchElectionNews } from '../services/searchService';

const MOCK_NEWS = [
  {
    title: 'ECI Announces Election Schedule 2024',
    snippet: 'The Election Commission has announced...',
    link: 'https://eci.gov.in/news',
    displayLink: 'eci.gov.in',
    image: null,
  },
  {
    title: 'How to Register as a Voter',
    snippet: 'Citizens can register via NVSP portal...',
    link: 'https://voters.eci.gov.in',
    displayLink: 'voters.eci.gov.in',
    image: null,
  },
];

describe('NewsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeletons initially', () => {
    fetchElectionNews.mockReturnValue(new Promise(() => {})); // never resolves
    render(<NewsSection />);
    // Skeleton elements should be present
    const skeletons = document.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders news articles after loading', async () => {
    fetchElectionNews.mockResolvedValue(MOCK_NEWS);
    render(<NewsSection />);

    await waitFor(() => {
      expect(screen.getByText('ECI Announces Election Schedule 2024')).toBeInTheDocument();
    });
    expect(screen.getByText('How to Register as a Voter')).toBeInTheDocument();
  });

  it('shows error message when fetch fails', async () => {
    fetchElectionNews.mockRejectedValue(new Error('Network error'));
    render(<NewsSection />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('renders the search input and submit button', async () => {
    fetchElectionNews.mockResolvedValue(MOCK_NEWS);
    render(<NewsSection />);

    expect(screen.getByLabelText('Search election news')).toBeInTheDocument();
    expect(screen.getByLabelText('Search news')).toBeInTheDocument();
  });

  it('triggers a new search when form is submitted', async () => {
    fetchElectionNews.mockResolvedValue(MOCK_NEWS);
    render(<NewsSection />);

    await waitFor(() => screen.getByLabelText('Search election news'));

    const input = screen.getByLabelText('Search election news');
    const searchButton = screen.getByLabelText('Search news');

    // Test search via button click
    await act(async () => {
      fireEvent.change(input, { target: { value: 'EVM voting' } });
      fireEvent.click(searchButton);
    });

    await waitFor(() => {
      expect(fetchElectionNews).toHaveBeenCalledWith('EVM voting');
    });

    // Test search via Enter key
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Voter ID' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    });

    await waitFor(() => {
      expect(fetchElectionNews).toHaveBeenCalledWith('Voter ID');
    });
  });
});
