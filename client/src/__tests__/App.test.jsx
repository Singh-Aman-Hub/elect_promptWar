import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

/**
 * App Component Tests
 * Validates that the main application shell renders correctly.
 */
describe('App Component', () => {
  it('renders the application logo and title', () => {
    render(<App />);
    const logoText = screen.getAllByText(/Elect/i);
    expect(logoText.length).toBeGreaterThan(0);
  });

  it('renders the sidebar navigation menu', () => {
    render(<App />);
    expect(screen.getByRole('navigation', { name: /Sidebar navigation/i })).toBeInTheDocument();
  });
});
