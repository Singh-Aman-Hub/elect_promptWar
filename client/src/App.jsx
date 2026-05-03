import { useState, lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import {
  MessageCircle,
  BookOpen,
  MapPin,
  Newspaper,
  Clock,
  Menu,
  X,
  Vote,
  Zap,
  LogIn,
  ChevronRight,
  User as UserIcon,
  Globe
} from 'lucide-react';
import { AppProvider, useAppContext } from './context/AppContext';
import LanguageToggle from './components/LanguageToggle';
import ChatWindow from './components/ChatWindow';
import ErrorBoundary from './components/ErrorBoundary';
import {
  auth,
  logFirebaseEvent,
  signInWithGoogle,
  logout
} from './services';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect as useReactEffect } from 'react';

const StepperGuide = lazy(() => import('./components/StepperGuide'));
const BoothLocator = lazy(() => import('./components/BoothLocator'));
const NewsSection = lazy(() => import('./components/NewsSection'));
const Timeline = lazy(() => import('./components/Timeline'));

const TABS = [
  { id: 'chat', label: 'AI Assistant', icon: MessageCircle, color: 'text-blue-600', bg: 'bg-blue-100' },
  { id: 'guide', label: 'Election Guide', icon: BookOpen, color: 'text-orange-600', bg: 'bg-orange-100' },
  { id: 'booths', label: 'Booth Locator', icon: MapPin, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { id: 'news', label: 'Live News', icon: Newspaper, color: 'text-purple-600', bg: 'bg-purple-100' },
  { id: 'timeline', label: 'History Timeline', icon: Clock, color: 'text-rose-600', bg: 'bg-rose-100' },
];

const TAB_COMPONENTS = {
  chat: ChatWindow,
  guide: StepperGuide,
  booths: BoothLocator,
  news: NewsSection,
  timeline: Timeline,
};

/**
 * Main application layout and routing component.
 * Handles the sidebar navigation, mobile menu, and dynamic content rendering.
 * @returns {JSX.Element} The rendered application layout.
 */
function AppContent() {
  const { activeTab, setActiveTab } = useAppContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useReactEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'tab_change', { tab_name: tabId });
    }
    logFirebaseEvent('tab_view', { tab_name: tabId });
    setMobileMenuOpen(false);
  };

  const isChatTab = activeTab === 'chat';
  const ActiveComponent = TAB_COMPONENTS[activeTab] ?? null;

  return (
    <div className="min-h-screen flex bg-[#F0F4F8] text-[#1E293B] font-sans overflow-hidden">
      
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-72 h-screen p-6 flex-shrink-0 z-20">
        <div className="bg-white rounded-[32px] h-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col p-6 overflow-y-auto hide-scrollbar relative border border-white/50">
          
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10 pl-2">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#FF6B00] to-[#FF9933] shadow-lg shadow-orange-500/20">
              <Vote size={24} color="white" />
            </div>
            <div>
              <h1 className="font-display font-black text-2xl tracking-tight text-[#0F172A]">
                Elect<span className="text-[#FF6B00]">Voice</span>
              </h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-3 flex-1">
            <p className="text-xs font-bold tracking-widest text-[#94A3B8] uppercase ml-2 mb-2">Menu</p>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-semibold transition-all duration-300 group ${
                  activeTab === tab.id 
                  ? 'bg-[#0F172A] text-white shadow-xl shadow-slate-900/10 scale-[1.02]' 
                  : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                }`}
              >
                <div className={`p-2 rounded-xl transition-colors ${activeTab === tab.id ? 'bg-white/10' : tab.bg}`}>
                  <tab.icon size={18} className={activeTab === tab.id ? 'text-white' : tab.color} />
                </div>
                {tab.label}
                {activeTab === tab.id && <ChevronRight size={16} className="ml-auto opacity-50" />}
              </button>
            ))}
          </nav>

          {/* Bottom Actions */}
          <div className="mt-8 pt-6 border-t border-[#F1F5F9] flex flex-col gap-4">
            <div className="bg-[#F8FAFC] p-1.5 rounded-2xl">
               <LanguageToggle />
            </div>
            
            {user ? (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <img src={user.photoURL} alt={`${user.displayName} profile`} className="w-10 h-10 rounded-full shadow-sm" />
                <div className="flex flex-col flex-1 text-left overflow-hidden">
                  <p className="text-sm font-bold text-[#0F172A] truncate">{user.displayName}</p>
                  <button onClick={logout} className="text-xs text-red-500 font-semibold hover:text-red-600 text-left w-fit">
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center justify-center gap-2 p-4 rounded-2xl font-bold bg-[#FF6B00] text-white shadow-lg shadow-orange-500/20 hover:scale-[1.02] transition-all"
              >
                <LogIn size={18} />
                Sign In
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ── Mobile Header ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-20 bg-[#F0F4F8]/80 backdrop-blur-xl z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#FF6B00] to-[#FF9933] shadow-md">
            <Vote size={20} color="white" />
          </div>
          <h1 className="font-display font-black text-xl text-[#0F172A]">
            Elect<span className="text-[#FF6B00]">Voice</span>
          </h1>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open mobile menu"
          className="p-2.5 rounded-xl bg-white shadow-sm text-[#0F172A]"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60] bg-[#0F172A]/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white shadow-2xl p-6 flex flex-col animate-slide-in-right" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-display font-black text-2xl">Menu</h2>
              <button onClick={() => setMobileMenuOpen(false)} aria-label="Close mobile menu" className="p-2 bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <nav className="flex flex-col gap-2 flex-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-4 p-4 rounded-2xl font-semibold transition-all ${
                    activeTab === tab.id ? 'bg-[#0F172A] text-white' : 'bg-slate-50 text-[#64748B]'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${activeTab === tab.id ? 'bg-white/10' : tab.bg}`}>
                    <tab.icon size={18} className={activeTab === tab.id ? 'text-white' : tab.color} />
                  </div>
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="mt-auto pt-6 flex flex-col gap-4">
              <LanguageToggle />
              {user ? (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50">
                  <img src={user.photoURL} alt={`${user.displayName} profile`} className="w-10 h-10 rounded-full" />
                  <div className="text-left flex-1">
                    <p className="text-sm font-bold text-[#0F172A]">{user.displayName}</p>
                    <button onClick={logout} className="text-xs text-red-500 font-semibold">Sign Out</button>
                  </div>
                </div>
              ) : (
                <button onClick={signInWithGoogle} className="w-full py-4 rounded-2xl font-bold bg-[#FF6B00] text-white flex items-center justify-center gap-2">
                  <LogIn size={18} /> Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content Area ── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden pt-20 md:pt-0 pb-4 md:py-6 px-4 md:pr-6 md:pl-0 z-10">
        
        {/* Bento Box Grid Hero (Only on Chat) */}
        {isChatTab && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0 animate-fade-in-up">
            <div className="md:col-span-2 bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl shadow-blue-900/10">
              <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/10 blur-3xl rounded-full"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold mb-4 uppercase tracking-wider">
                  <Zap size={14} className="text-yellow-300" /> Powered by Gemini
                </div>
                <h2 className="font-display font-black text-4xl sm:text-5xl leading-[1.1] tracking-tight mb-2">
                  Your intelligent <br/> election companion.
                </h2>
                <p className="text-blue-100 font-medium max-w-md mt-4">
                  Ask anything about the democratic process, voter registration, or live updates in India.
                </p>
              </div>
            </div>

            <div className="hidden md:flex flex-col gap-4">
              <div className="flex-1 bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-center items-center text-center">
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-3">
                  <UserIcon size={24} />
                </div>
                <h3 className="font-display font-black text-3xl text-[#0F172A]">970M+</h3>
                <p className="text-[#64748B] font-semibold text-sm">Eligible Voters</p>
              </div>
              <div className="flex-1 bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-center items-center text-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-3">
                  <Globe size={24} />
                </div>
                <h3 className="font-display font-black text-3xl text-[#0F172A]">543</h3>
                <p className="text-[#64748B] font-semibold text-sm">Constituencies</p>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Content Card */}
        <div className={`bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col transition-all duration-500 border border-white/50 ${isChatTab ? 'flex-1 min-h-0' : 'flex-1 overflow-y-auto p-6 md:p-10'}`}>
          <ErrorBoundary>
            <Suspense fallback={
              <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 border-4 border-slate-100 border-t-[#FF6B00] rounded-full animate-spin"></div>
                  <p className="text-[#64748B] font-bold tracking-wide animate-pulse">Loading experience...</p>
                </div>
              </div>
            }>
              {ActiveComponent && <ActiveComponent />}
            </Suspense>
          </ErrorBoundary>
        </div>

      </main>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#0F172A',
            color: '#fff',
            borderRadius: '16px',
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
            fontSize: '14px',
            fontWeight: '600',
            padding: '16px 20px'
          },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
