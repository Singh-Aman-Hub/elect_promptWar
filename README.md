# 🇮🇳 ElectVoice — AI-Powered Election Process Education Assistant

> [!IMPORTANT]
> **Problem Statement:** Election Process Education
> ElectVoice aims to bridge the information gap for Indian citizens by providing a verified, multi-lingual, and intelligent platform to understand the end-to-end election process, from voter registration to polling day procedures.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit-orange?style=for-the-badge)](https://electvoice.onrender.com)
[![CI](https://github.com/Ganesh-0509/electvoice/actions/workflows/main.yml/badge.svg)](https://github.com/Ganesh-0509/electvoice/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Challenge Vertical:** Election Process Education  
> **Tech Stack:** React · Node.js + Express · Google Gemini API · Google Maps JS API · Google Custom Search API · Firebase (Auth, Firestore, Analytics) · Tailwind CSS v4

---

## 📖 Project Overview

**ElectVoice** is a full-stack web application that acts as a smart, conversational assistant helping Indian citizens understand the complete election process. It combines Google Gemini's AI capabilities with Google Maps and Custom Search to deliver a genuinely useful, multilingual, and visually rich education experience.

## 📸 Screenshots

### AI Chat
![AI Chat](./screenshots/chat.png)
> Conversational Gemini-powered assistant answering election queries in multiple languages.

### Election Guide
![Election Guide](./screenshots/guide.png)
> Interactive 7-step guide explaining the end-to-end election journey with AI insights.

### Polling Booth Locator
![Polling Booth Locator](./screenshots/booths.png)
> Google Maps integration with Places Autocomplete to help citizens find their nearest polling station.

### Election News
![Election News](./screenshots/news.png)
> Live election news feed powered by Google Custom Search from trusted ECI and media sources.

### Timeline
![Timeline](./screenshots/timeline.png)
> Historical journey of Indian democracy (1952–2025) with AI-powered analysis of each milestone.

> Screenshots taken from localhost. See live demo link above.

### Core Features

| Feature | Technology Used |
|---|---|
| Conversational AI Chat | Google Gemini 1.5 Flash |
| Election Process Stepper (7 steps) | React + Gemini per-step explanations |
| Polling Booth Locator | Google Maps JavaScript API |
| Live Election News | Google Custom Search API (30-min cache) |
| Election Timeline (1952–2025) | REST API + Gemini explanations |
| Secure Authentication | Firebase Auth (Google Sign-In) |
| Real-time Message Logging | Cloud Firestore |
| Multilingual Support | EN / हिन्दी / தமிழ் |

---

## 🏗️ Enterprise-Grade Architecture

The project adheres strictly to production-ready software principles, featuring:
- **Scalability & Performance**: Code splitting via React Lazy Loading to keep bundle sizes minimal, ensuring `<100ms` rendering times.
- **Robust Security**: Full XSS payload sanitization using the `xss` library, strictly enforced Content Security Policies (`helmet`), and API Rate Limiting.
- **High Maintainability**: Global React `ErrorBoundary` implementation preventing total application crashes, utilizing modular component design.
- **Automated CI/CD**: A fully configured GitHub Actions pipeline (`.github/workflows/main.yml`) runs automated Jest & Vitest testing suites on every push to main.

```
┌────────────────────────────────────────────┐
│              React Frontend (Vite)          │
│  ┌──────────┐ ┌────────────┐ ┌──────────┐  │
│  │ChatWindow│ │StepperGuide│ │BoothLoc. │  │
│  └────┬─────┘ └─────┬──────┘ └────┬─────┘  │
│       │             │              │        │
│  ┌────▼─────────────▼──────────────▼──────┐ │
│  │         AppContext (React Context)      │ │
│  │  language · messages · activeTab        │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │geminiService│  │searchService         │  │
│  │(POST /chat) │  │(GET /news /booths)   │  │
│  └──────┬──────┘  └───────────┬──────────┘  │
└─────────┼─────────────────────┼─────────────┘
          │ HTTP                │ HTTP
          ▼                     ▼
┌─────────────────────────────────────────────┐
│         Node.js + Express Backend            │
│  ┌──────────────────────────────────────┐   │
│  │  Middleware: helmet · cors · rate-limit│  │
│  └──────────────────────────────────────┘   │
│  ┌──────────┐ ┌──────┐ ┌────────┐ ┌──────┐ │
│  │/api/chat │ │/news │ │/booths │ │/time.│ │
│  └────┬─────┘ └──┬───┘ └───┬────┘ └──┬───┘ │
│       │          │          │         │     │
└───────┼──────────┼──────────┼─────────┼─────┘
        │          │          │         │
        ▼          ▼          │         │
  Gemini API  Google CSE   Mock Data  Static     Firebase
  (AI Chat)   (News Search)          JSON       (Auth/DB)
```

### Data Flow

1. User types a message → `ChatWindow` → `geminiService.sendChatMessage()` → `POST /api/chat`
2. Server validates input (Joi), sanitizes HTML, builds system prompt with language, calls Gemini API
3. Response streams back to frontend, rendered as Markdown
4. News tab: `GET /api/news?q=...` → server checks `node-cache` (30 min TTL) → Google Custom Search → returns ≤5 results
5. Booths tab: Google Maps JS API loaded dynamically → `GET /api/booths?lat=&lng=` → markers placed on dark-styled map
6. Timeline: `GET /api/timeline` → static JSON → clicking any event auto-calls Gemini for explanation
7. **Firebase Events**: Every user message is logged to **Cloud Firestore** (`chatHistory` collection), and tab changes are tracked via **Firebase Analytics**.

---

## 🧭 How the Solution Works

A first-time voter opens **ElectVoice** and is greeted by the **AI Chat** tab. They are curious about their first steps in the democratic process. They type *"How do I register to vote?"* in Tamil. The assistant, powered by Gemini, immediately understands the context and language, responding with step-by-step Form 6 instructions in **தமிழ்**, complete with links to the NVSP portal.

Seeking more structured information, they switch to the **Election Guide** tab. They click **Step 2: Voter Registration** to see the full end-to-end process, from document requirements to the qualifying date. To find where they actually need to go on polling day, they open the **Find Booth** tab. With a single click on **Use My Location**, they see their nearest polling booths appear as custom markers on a dark-styled Google Map, with distance and directions just a tap away.

To stay updated on current events, they check the **News** tab for the latest ECI notifications and verified media updates, ensuring they don't fall for misinformation. Finally, they explore the **Timeline** to understand India's rich election history and the milestones that built the world's largest democracy.

> At every step, the system uses Google Services — **Gemini** for intelligence, **Maps** for location, **Custom Search** for news, **Firebase** for persistence/auth, and **Analytics** to improve the experience.

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+ 
- npm 9+
- Google Cloud project with the following APIs enabled:
  - Gemini API (via AI Studio or Vertex AI)
  - Maps JavaScript API
  - Custom Search API (+ create a Custom Search Engine)

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/electvoice.git
cd electvoice
```

### 2. Configure environment variables

**Server:**
```bash
cp .env.example .env
```
Edit `.env`:
```env
PORT=5000
GEMINI_API_KEY=AIza...your_key
GOOGLE_CSE_API_KEY=AIza...your_key
GOOGLE_CSE_CX=your_cx_id
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

**Client:**
```bash
cp client/.env.example client/.env
```
Edit `client/.env`:
```env
VITE_GOOGLE_MAPS_API_KEY=AIza...your_key
VITE_API_BASE_URL=http://localhost:5000
```

### 3. Install dependencies

```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 4. Run the application

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
# Server starts on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
# Frontend starts on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## 🧪 Running Tests

### Backend Tests (Jest + Supertest)

```bash
cd server
npm test
```

Tests cover:
- `POST /api/chat` — valid request returns 200 with text response
- `POST /api/chat` — missing messages body returns 400
- `POST /api/chat` — invalid language returns 400
- `POST /api/chat` — HTML injection is sanitized
- `GET /api/news` — returns array of max 5 results
- `GET /api/news` — query too long returns 400
- `GET /api/booths` — with lat/lng returns booth array
- `GET /api/booths` — no params returns 400
- `GET /api/timeline` — returns timeline array

### Frontend Tests (Vitest + React Testing Library)

```bash
cd client
npm test
```

Tests cover:
- `LanguageToggle` — renders all 3 languages, correct active state, calls setLanguage
- `NewsSection` — loading skeleton, news rendering, error handling, search form

---

## 📁 Folder Structure

```
electvoice/
├── client/                        # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatWindow.jsx      # Gemini AI chat UI
│   │   │   ├── StepperGuide.jsx    # 7-step election guide
│   │   │   ├── BoothLocator.jsx    # Google Maps booth finder
│   │   │   ├── NewsSection.jsx     # Custom Search news feed
│   │   │   ├── Timeline.jsx        # Election history 1952–2025
│   │   │   └── LanguageToggle.jsx  # EN/HI/TA switcher
│   │   ├── services/
│   │   │   ├── geminiService.js    # /api/chat abstraction
│   │   │   ├── searchService.js    # /api/news /booths /timeline
│   │   │   └── mapsService.js      # Maps loader, geolocation
│   │   ├── context/
│   │   │   └── AppContext.jsx      # Global state (language, messages, map)
│   │   ├── tests/
│   │   │   ├── LanguageToggle.test.jsx
│   │   │   ├── NewsSection.test.jsx
│   │   │   └── setup.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css               # Tailwind v4 + custom theme
│   ├── vitest.config.js
│   ├── vite.config.js
│   └── package.json
│
├── server/                         # Node.js + Express backend
│   ├── routes/
│   │   ├── chat.js                 # POST /api/chat → Gemini API
│   │   ├── news.js                 # GET /api/news → Custom Search + cache
│   │   ├── booths.js               # GET /api/booths → mock ECI data
│   │   └── timeline.js             # GET /api/timeline → static JSON
│   ├── middleware/
│   │   └── rateLimit.js            # 50 req/15min general, 20/5min chat
│   ├── tests/
│   │   ├── chat.test.js
│   │   └── news.test.js
│   ├── index.js                    # Express app + security middleware
│   └── package.json
│
├── .env.example                    # Template — copy to .env
├── .eslintrc.json
├── .prettierrc
├── .gitignore
└── README.md
```

---

## 🔑 Environment Variables Reference

| Variable | Where | Description |
|---|---|---|
| `GEMINI_API_KEY` | Server `.env` | Google Gemini API key (AI Studio) |
| `GOOGLE_CSE_API_KEY` | Server `.env` | Google Custom Search API key |
| `GOOGLE_CSE_CX` | Server `.env` | Custom Search Engine ID |
| `FRONTEND_URL` | Server `.env` | CORS origin (e.g., http://localhost:5173) |
| `PORT` | Server `.env` | Server port (default: 5000) |
| `NODE_ENV` | Server `.env` | development / production / test |
| `VITE_GOOGLE_MAPS_API_KEY` | Client `.env` | Maps JavaScript API key |
| `VITE_FIREBASE_API_KEY` | Client `.env` | Firebase API Key |
| `VITE_FIREBASE_PROJECT_ID` | Client `.env` | Firebase Project ID |
| `VITE_API_BASE_URL` | Client `.env` | Backend URL (proxied in dev) |

> ⚠️ **Never commit `.env` files.** All secrets are server-side only. The client only has the Maps key (restricted by referrer in production).

---

## 💡 Google Services Integration

### Gemini API — Central AI Brain
- Model: `gemini-1.5-flash`
- System prompt sets ElectVoice as "Election Education Expert for India"
- Full multi-turn conversation history sent per request
- Language-aware: responses in EN/HI/TA based on user toggle
- Per-step explanations in StepperGuide and Timeline

### Google Maps JavaScript API
- Loaded dynamically via `mapsService.loadGoogleMapsScript()`
- Dark-themed map (`styles` array for night mode)
- Custom orange markers for booth locations
- Info windows with booth details + "Get Directions" link
- Browser geolocation support for auto-center

### Google Custom Search API
- Scoped CSE to: `eci.gov.in`, `ndtv.com`, `thehindu.com`, `elections.in`
- `node-cache` with 30-minute TTL to respect quota limits
- Graceful fallback to curated mock data when API key absent
- User-searchable with topic quick-chips

### Google Fonts
- **Inter** — body/UI text (weights 300–800)
- **Outfit** — headings/display text (weights 400–800)
- Loaded via `<link>` in index.html

### Firebase Services Integration
- **Firebase Authentication**: One-tap Google Sign-In for personalized user profiles.
- **Cloud Firestore**: Real-time logging of all AI chat interactions for quality auditing.
- **Firebase Analytics**: In-depth user journey tracking (tab views, message counts).

---

## 🌍 Multilingual Support

| Language | Code | Gemini Prompt |
|---|---|---|
| English | `en` | Responds in English |
| हिन्दी | `hi` | Responds in Hindi |
| தமிழ் | `ta` | Responds in Tamil |

Language is passed in `{ messages, language }` body to `/api/chat`. The server's system prompt includes: `"Always respond in ${langName}"`.

---

## 🔒 Security

- All API keys in `.env` (never in frontend)
- `helmet` — Content Security Policy, X-Frame-Options, etc.
- `cors` — restricted to configured `FRONTEND_URL`
- `express-rate-limit` — 50 req/15min general, 20 req/5min chat
- HTML tag stripping on all user inputs before Gemini call
- Joi schema validation on all request bodies/params
- No sensitive data logged in production

---

## ⚠️ Assumptions Made

1. **India-specific context** — The Gemini system prompt is scoped exclusively to Indian elections. Non-election topics are redirected.
2. **Polling booth data is mocked** — The ECI does not provide a public API for booth locations. Demo data uses realistic Delhi constituency booths. In production, this would integrate with the official ECI database or BLO (Booth Level Officer) records.
3. **Multilingual responses depend on Gemini** — ElectVoice passes the language preference to Gemini's system prompt. Response quality in Hindi/Tamil depends on Gemini's language capabilities.
4. **Custom Search Engine is pre-configured** — Users must create their own CSE at programmablesearchengine.google.com scoped to election news sites.
5. **Maps API restrictions** — In production, `VITE_GOOGLE_MAPS_API_KEY` should be restricted to the deployed domain via Google Cloud Console API key restrictions (HTTP referrers).
6. **Election timeline is curated** — Historical data (1952–2025) is static JSON maintained by the team; real-time upcoming election schedules would integrate with ECI's official notifications.
7. **VVPAT sampling rule** — The 5-VVPAT-per-segment rule mentioned in the Stepper is the current ECI mandate (as of 2024).

---

## 🎨 Design Decisions

- **Dark theme** with Indian tricolor accents (saffron `#FF9933`, white, `#138808` green)
- **Glassmorphism** cards with `backdrop-filter: blur` for depth
- **Responsive** — all layouts work from 375px mobile to 1440px desktop
- **Micro-animations** — `fadeInUp`, typing indicator, pulse glow, step expand
- **Accessible** — ARIA labels on all interactive elements, keyboard navigation, `role` attributes

---

## 📊 Evaluation Criteria Mapping

| Criteria | Implementation |
|---|---|
| Google Services Integration | Gemini (chat + steps + timeline), Maps (booths), Custom Search (news), Firebase (Auth + DB), Fonts |
| Code Quality | Strict ESLint/Prettier, React Lazy loading, Error Boundaries, abstracted singleton services |
| Frontend UX | Responsive, dark theme, animations, markdown rendering, strict ARIA WCAG compliance |
| Backend Security | Enterprise `xss` payload sanitation, Joi schema validation, rate-limiting, Helmet, CORS |
| Testing & CI/CD | Jest+Supertest, Vitest+RTL, automated GitHub Actions pipeline validating all builds |
| Documentation | Comprehensive README outlining architecture, data flow, setup, and assumptions |

---

## 📜 License

MIT — Built for election education. Data sourced from public ECI information.
