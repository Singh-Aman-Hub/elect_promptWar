/**
 * searchService.js
 * Abstracts communication with the /api/news and /api/booths backend endpoints.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Fetch election news from Google Custom Search (via server).
 * @param {string} query - Search term
 * @returns {Promise<Array>} - Array of news result objects
 */
export async function fetchElectionNews(query = 'India election 2024') {
  const params = new URLSearchParams({ q: query });
  const response = await fetch(`${API_BASE}/api/news?${params}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  const data = await response.json();
  return data.results || [];
}

/**
 * Fetch nearby polling booths.
 * @param {Object} params - { lat, lng } or { constituency, state }
 * @returns {Promise<Array>} - Array of booth objects
 */
export async function fetchPollingBooths({ lat, lng, constituency, state } = {}) {
  const params = new URLSearchParams();
  if (lat !== undefined) params.append('lat', lat);
  if (lng !== undefined) params.append('lng', lng);
  if (constituency) params.append('constituency', constituency);
  if (state) params.append('state', state);

  const response = await fetch(`${API_BASE}/api/booths?${params}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  const data = await response.json();
  return data.booths || [];
}

/**
 * Fetch election timeline data.
 * @returns {Promise<Array>} - Array of timeline event objects
 */
export async function fetchTimeline() {
  const response = await fetch(`${API_BASE}/api/timeline`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  const data = await response.json();
  return data.timeline || [];
}
