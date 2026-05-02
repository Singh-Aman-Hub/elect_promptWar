import { useAppContext } from '../context/AppContext';

const LANGUAGES = [
  { code: 'en', label: 'EN', fullName: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हि', fullName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ta', label: 'த', fullName: 'தமிழ்', flag: '🇮🇳' },
];

/**
 * LanguageToggle — switches the UI and Gemini response language
 */
export default function LanguageToggle() {
  const { language, setLanguage } = useAppContext();

  return (
    <div
      className="flex items-center gap-2 p-1.5 rounded-xl flex-wrap justify-center"
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
      role="group"
      aria-label="Language selector"
    >
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          aria-label={`Switch to ${lang.fullName}`}
          aria-pressed={language === lang.code}
          title={lang.fullName}
          className="relative px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer"
          style={{
            background: language === lang.code ? 'rgba(255,153,51,0.2)' : 'transparent',
            color: language === lang.code ? '#FF9933' : '#8b949e',
            border: language === lang.code ? '1px solid rgba(255,153,51,0.4)' : '1px solid transparent',
          }}
        >
          {lang.label}
        </button>
      ))}
      <p className="w-full text-[10px] text-center mt-1 opacity-50" style={{ color: '#8b949e' }}>
        * Additional languages supported via Google Translate
      </p>
    </div>
  );
}
