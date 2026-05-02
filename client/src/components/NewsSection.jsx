import { useState, useEffect } from 'react';
import { Search, ExternalLink, RefreshCw, Newspaper } from 'lucide-react';
import PropTypes from 'prop-types';
import { fetchElectionNews } from '../services/searchService';

/**
 * NewsSection — live election news via Google Custom Search API
 */
export default function NewsSection() {
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('India election 2024');
  const [inputValue, setInputValue] = useState('');
  const [isMock, setIsMock] = useState(false);

  const loadNews = async (query = 'India election 2024') => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await fetchElectionNews(query);
      setNews(results);
      // Check if response came with mock flag (indirectly via article structure)
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNews(searchQuery);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const query = inputValue.trim();
    setSearchQuery(query);
    loadNews(query);
  };

  const getFaviconUrl = (displayLink) => {
    return `https://www.google.com/s2/favicons?domain=${displayLink}&sz=16`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-gradient-saffron">
            Election News
          </h2>
          <p className="text-sm mt-0.5" style={{ color: '#8b949e' }}>
            Latest from ECI, NDTV, The Hindu & more
          </p>
        </div>
        <button
          onClick={() => loadNews(searchQuery)}
          disabled={isLoading}
          aria-label="Refresh news"
          className="p-2 rounded-xl transition-all hover:bg-white/5 disabled:opacity-50 cursor-pointer"
          style={{ color: '#8b949e', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: '#8b949e' }}
          />
          <input
            id="news-search-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputValue.trim()) {
                handleSearch(e);
              }
            }}
            placeholder="Search election topics..."
            aria-label="Search election news"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#e6edf3',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(255,153,51,0.4)')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={isLoading}
          aria-label="Search news"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 disabled:opacity-60 cursor-pointer ml-2 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #FF9933, #e85c00)', color: 'white' }}
        >
          Search
        </button>
      </div>

      {/* Quick topic chips */}
      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
        {['ECI 2024', 'Voter Registration', 'EVM Security', 'Model Code', 'NOTA'].map((topic) => (
          <button
            key={topic}
            onClick={() => {
              setInputValue(topic);
              setSearchQuery(topic);
              loadNews(topic);
            }}
            aria-label={`Search for ${topic}`}
            className="text-xs px-3 py-1.5 rounded-full transition-all hover:scale-105 cursor-pointer mr-2 mb-2 inline-block"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#8b949e',
            }}
          >
            {topic}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div
          className="px-4 py-3 rounded-xl text-sm"
          style={{
            background: 'rgba(220,38,38,0.1)',
            border: '1px solid rgba(220,38,38,0.3)',
            color: '#fca5a5',
          }}
          role="alert"
        >
          ❌ {error}
        </div>
      )}

      {/* News cards */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <NewsCardSkeleton key={i} />)
        ) : news.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Newspaper size={48} style={{ color: '#8b949e', opacity: 0.3 }} />
            <p className="text-sm" style={{ color: '#8b949e' }}>
              No results found. Try a different search term.
            </p>
          </div>
        ) : (
          news.map((item, index) => (
            <NewsCard key={index} item={item} index={index} getFaviconUrl={getFaviconUrl} />
          ))
        )}
      </div>

      <p className="text-xs text-center" style={{ color: '#484f58' }}>
        Powered by Google Custom Search · Sources: ECI, NDTV, The Hindu, elections.in
      </p>
    </div>
  );
}

function NewsCard({ item, index, getFaviconUrl }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block transition-all hover:scale-[1.01] animate-fade-in-up group"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '12px',
        padding: '12px 16px',
        marginBottom: '8px',
        animationDelay: `${index * 0.07}s`,
        textDecoration: 'none',
      }}
      aria-label={`Read article: ${item.title}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3
            className="font-semibold text-sm leading-snug mb-2 group-hover:text-saffron-400 transition-colors"
            style={{ color: '#e6edf3' }}
          >
            {item.title}
          </h3>
          <p
            className="text-xs leading-relaxed mb-3"
            style={{ color: '#8b949e', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {item.snippet}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src={getFaviconUrl(item.displayLink)}
                alt=""
                width={14}
                height={14}
                className="rounded-sm"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <span className="text-xs" style={{ color: '#6e7681' }}>
                {item.displayLink}
              </span>
            </div>
            <ExternalLink
              size={12}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: '#FF9933' }}
            />
          </div>
        </div>
      </div>
    </a>
  );
}

function NewsCardSkeleton() {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'rgba(22,27,34,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="space-y-2">
        <div className="skeleton h-4 w-5/6" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-3/4" />
        <div className="skeleton h-3 w-1/3 mt-2" />
      </div>
    </div>
  );
}

NewsCard.propTypes = {
  item: PropTypes.shape({
    title: PropTypes.string.isRequired,
    link: PropTypes.string.isRequired,
    snippet: PropTypes.string.isRequired,
    displayLink: PropTypes.string.isRequired,
  }).isRequired,
  index: PropTypes.number.isRequired,
  getFaviconUrl: PropTypes.func.isRequired,
};

