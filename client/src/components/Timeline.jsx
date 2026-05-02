import { useState, useEffect } from 'react';
import { Calendar, Trophy, Clock, ChevronRight, Loader2 } from 'lucide-react';
import PropTypes from 'prop-types';
import { fetchTimeline } from '../services/searchService';
import { useAppContext } from '../context/AppContext';
import { sendChatMessage } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const TYPE_CONFIG = {
  historical: { label: 'Historical', color: '#8b949e', bg: 'rgba(139,148,158,0.1)' },
  current: { label: 'Latest', color: '#FF9933', bg: 'rgba(255,153,51,0.15)', glow: true },
  state: { label: 'State Election', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
  upcoming: { label: 'Upcoming', color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
};

/**
 * Timeline — horizontal election history with Gemini explanation on click
 */
export default function Timeline() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [explanation, setExplanation] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);
  const { language, addMessage, setActiveTab } = useAppContext();

  useEffect(() => {
    fetchTimeline()
      .then((data) => {
        setEvents(data);
        // Auto-select latest election
        const latest = data.find((e) => e.type === 'current') || data[data.length - 2];
        if (latest) handleEventClick(latest, data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  const handleEventClick = async (event, allEvents = events) => {
    if (selectedEvent?.id === event.id) return;
    setSelectedEvent(event);
    setExplanation('');
    setIsExplaining(true);

    const prompt = `Tell me about the ${event.title} (${event.date}) in Indian election history. Include key facts about voter turnout, result, and its historical significance.`;

    try {
      const msg = [{ role: 'user', parts: [{ text: prompt }] }];
      const response = await sendChatMessage(msg, language);
      setExplanation(response);
    } catch {
      setExplanation(
        `**${event.title}** (${event.date})\n\n${event.description}\n\n*Winner: ${event.winner || 'TBD'} | Seats: ${event.seats} | Turnout: ${event.voterTurnout || 'N/A'}*`
      );
    } finally {
      setIsExplaining(false);
    }
  };

  const handleAskInChat = () => {
    if (!selectedEvent) return;
    const prompt = `Tell me everything about the ${selectedEvent.title} (${selectedEvent.date}) Indian election.`;
    addMessage({ role: 'user', parts: [{ text: prompt }] });
    setActiveTab('chat');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 size={32} className="animate-spin" style={{ color: '#FF9933' }} />
        <p className="text-sm" style={{ color: '#8b949e' }}>Loading election timeline...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#fca5a5' }}>
        ❌ {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="font-display font-bold text-2xl text-gradient-saffron mb-1">
          Indian Election Timeline
        </h2>
        <p className="text-sm" style={{ color: '#8b949e' }}>
          From 1952 to 2025 — click any event for AI-powered insights
        </p>
      </div>

      {/* Type legend */}
      <div className="flex flex-wrap justify-center gap-3">
        {Object.entries(TYPE_CONFIG).map(([type, config]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: config.color }}
            />
            <span className="text-xs" style={{ color: '#8b949e' }}>
              {config.label}
            </span>
          </div>
        ))}
      </div>

      {/* Horizontal scrollable timeline */}
      <div className="overflow-x-auto pb-4">
        <div className="relative" style={{ minWidth: `${events.length * 150}px`, paddingTop: '80px', paddingBottom: '60px' }}>
          {/* Horizontal line */}
          <div
            className="absolute left-0 right-0"
            style={{
              top: '50%',
              transform: 'translateY(-50%)',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, rgba(255,153,51,0.3), rgba(255,153,51,0.6), rgba(255,153,51,0.3), transparent)',
            }}
          />

          <div className="flex justify-between px-8 relative z-10 items-center h-full">
            {events.map((event, index) => {
              const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.historical;
              const isSelected = selectedEvent?.id === event.id;
              const isAbove = index % 2 === 0;

              return (
                <div
                  key={event.id}
                  className="relative flex flex-col items-center justify-center cursor-pointer group"
                  style={{ width: '150px', flexShrink: 0 }}
                  onClick={() => handleEventClick(event)}
                >
                  {/* Label above */}
                  {isAbove && (
                    <div className="absolute z-0 w-32 text-center" style={{ bottom: '100%', marginBottom: '12px' }}>
                      <p
                        className="text-xs font-semibold leading-tight"
                        style={{ color: isSelected ? config.color : '#8b949e' }}
                      >
                        {event.title.split('—')[0].trim()}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#6e7681', fontSize: '10px' }}>
                        {event.year}
                      </p>
                    </div>
                  )}

                  {/* Dot */}
                  <div
                    className="w-4 h-4 rounded-full z-10 transition-all group-hover:scale-125 my-auto"
                    style={{
                      background: isSelected ? config.color : 'rgba(255,255,255,0.2)',
                      border: `2px solid ${config.color}`,
                      boxShadow: isSelected && config.glow ? `0 0 12px ${config.color}` : 'none',
                    }}
                    aria-label={`${event.title} ${event.year}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleEventClick(event)}
                  />

                  {/* Label below */}
                  {!isAbove && (
                    <div className="absolute z-0 w-32 text-center" style={{ top: '100%', marginTop: '12px' }}>
                      <p
                        className="text-xs font-semibold leading-tight"
                        style={{ color: isSelected ? config.color : '#8b949e' }}
                      >
                        {event.title.split('—')[0].trim()}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#6e7681', fontSize: '10px' }}>
                        {event.year}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selectedEvent && (
        <div
          className="relative z-10 rounded-2xl p-5 animate-fade-in"
          style={{
            background: 'rgba(22,27,34,0.9)',
            border: `1px solid ${TYPE_CONFIG[selectedEvent.type]?.color || '#8b949e'}33`,
          }}
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedEvent.emoji}</span>
              <div>
                <h3 className="font-display font-bold text-lg text-white">
                  {selectedEvent.title}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs" style={{ color: '#8b949e' }}>
                    <Calendar size={11} /> {selectedEvent.date}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: TYPE_CONFIG[selectedEvent.type]?.bg,
                      color: TYPE_CONFIG[selectedEvent.type]?.color,
                    }}
                  >
                    {TYPE_CONFIG[selectedEvent.type]?.label}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleAskInChat}
              aria-label="Ask AI about this election in chat"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:scale-105 cursor-pointer flex-shrink-0"
              style={{
                background: 'rgba(255,153,51,0.15)',
                border: '1px solid rgba(255,153,51,0.3)',
                color: '#FF9933',
              }}
            >
              Ask AI <ChevronRight size={12} />
            </button>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-3 mb-4">
            {selectedEvent.seats && (
              <StatBadge label="Total Seats" value={selectedEvent.seats} icon="🏛️" />
            )}
            {selectedEvent.voterTurnout && (
              <StatBadge label="Voter Turnout" value={selectedEvent.voterTurnout} icon="📊" />
            )}
            {selectedEvent.winner && (
              <StatBadge label="Winner" value={selectedEvent.winner} icon="🏆" />
            )}
          </div>

          {/* AI Explanation */}
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {isExplaining ? (
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
                <span className="text-sm" style={{ color: '#8b949e' }}>
                  AI is analyzing this election...
                </span>
              </div>
            ) : (
              <div className="markdown-content text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {explanation || selectedEvent.description}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBadge({ label, value, icon }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <span>{icon}</span>
      <div>
        <p className="text-xs" style={{ color: '#8b949e' }}>{label}</p>
        <p className="text-xs font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}

StatBadge.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.string.isRequired,
};

