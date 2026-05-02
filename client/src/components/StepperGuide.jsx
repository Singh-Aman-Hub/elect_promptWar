import { useState } from 'react';
import { ChevronDown, ChevronRight, MessageCircle, CheckCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { sendChatMessage } from '../services/geminiService';

const ELECTION_STEPS = [
  {
    id: 1,
    icon: '📢',
    title: 'Election Announcement',
    subtitle: 'ECI declares schedule',
    color: '#FF9933',
    summary:
      'The Election Commission of India (ECI) announces the election schedule, activating the Model Code of Conduct (MCC).',
    details: `The Election Commission of India (ECI) — a constitutional body — announces the election dates after extensive preparation.

**What happens at this stage:**
- ECI issues the official election notification in the *Official Gazette*
- Dates for voting phases, counting, and result declaration are announced
- The **Model Code of Conduct (MCC)** immediately comes into effect
- Political parties, candidates, and the government must follow MCC rules
- The government cannot announce new welfare schemes or make transfers of key officials without EC permission

**Key Body:** Election Commission of India (ECI)
**Legal Basis:** Article 324 of the Indian Constitution`,
    geminiPrompt:
      'Explain in detail how the Election Commission of India announces elections and what the Model Code of Conduct means for citizens.',
  },
  {
    id: 2,
    icon: '📋',
    title: 'Voter Registration',
    subtitle: 'Form 6 / NVSP portal',
    color: '#138808',
    summary:
      'Citizens aged 18+ can register as voters using Form 6 on the NVSP portal (voters.eci.gov.in) or via the Voter Helpline App.',
    details: `Voter registration is the foundation of democratic participation. Any Indian citizen who is 18 years or older on the qualifying date can enroll.

**How to Register:**
- **Online:** Visit [voters.eci.gov.in](https://voters.eci.gov.in) → Fill Form 6
- **Offline:** Submit Form 6 at the local Electoral Registration Officer (ERO)
- **Mobile:** Download the **Voter Helpline App** (1950)

**Documents Required:**
- Age proof (Aadhaar, Birth Certificate, Passport)
- Address proof (Aadhaar, Utility Bill, Rent Agreement)
- Passport-size photograph

**Other Important Forms:**
- **Form 7** — Objection to inclusion of a name
- **Form 8** — Correction of entries / change of address
- **Form 8A** — Transposition within same constituency

**Qualifying Date:** January 1st of the year of the revision`,
    geminiPrompt:
      'Walk me through the complete voter registration process in India, including Form 6, the NVSP portal, and what documents are needed.',
  },
  {
    id: 3,
    icon: '📝',
    title: 'Nomination of Candidates',
    subtitle: 'Filing & scrutiny',
    color: '#9333ea',
    summary:
      'Candidates file nomination papers with a deposit. Papers are scrutinized and candidates can withdraw within the deadline.',
    details: `Any eligible Indian citizen can contest elections by filing a nomination.

**Process:**
1. Candidate files nomination papers with the Returning Officer (RO)
2. Papers must be supported by a **proposer** from the constituency
3. A **security deposit** must be paid:
   - Lok Sabha: ₹25,000 (₹12,500 for SC/ST)
   - State Assembly: ₹10,000 (₹5,000 for SC/ST)
4. **Scrutiny of papers** by the Returning Officer
5. **Withdrawal of candidature** — last date is usually 2 weeks before polling
6. Final list of candidates is published

**Disqualification grounds:**
- Convicted with 2+ years imprisonment
- Holding office of profit under the government
- Not being a citizen of India
- Being declared insolvent`,
    geminiPrompt:
      'Explain the process of nomination of candidates for Indian elections, including filing, scrutiny, deposits, and withdrawal.',
  },
  {
    id: 4,
    icon: '🎤',
    title: 'Campaigning Period',
    subtitle: 'Rules & restrictions',
    color: '#0ea5e9',
    summary:
      'Political parties campaign within MCC guidelines. Campaign silence begins 48 hours before polling. No cash/gifts to voters.',
    details: `The campaigning period is when political parties and candidates try to win voter support.

**Rules under Model Code of Conduct:**
- No use of religion, caste, or community to seek votes
- No appeal to voters on communal lines
- No distribution of liquor, cash, or gifts (bribery)
- Government resources cannot be used for campaign activities
- Equal access to public places and venues for all parties

**Important Timelines:**
- **Campaign Silence Period:** 48 hours before polling begins — no public meetings or processions
- **No canvassing** within 100 meters of a polling booth on polling day

**Media & Advertising:**
- Paid political ads must be certified by the Media Certification & Monitoring Committee (MCMC)
- Exit polls results cannot be published until polling closes in all phases

**Expenditure Limits:**
- Lok Sabha candidate: ₹95 lakh per constituency (larger states)
- State Assembly: ₹40 lakh per constituency`,
    geminiPrompt:
      'What are the rules for election campaigning in India under the Model Code of Conduct? What is not allowed?',
  },
  {
    id: 5,
    icon: '🗳️',
    title: 'Polling Day',
    subtitle: 'EVM + VVPAT voting',
    color: '#f59e0b',
    summary:
      'Voters cast their vote on an EVM. A VVPAT slip confirms the vote. Polling typically runs from 7 AM to 6 PM.',
    details: `Polling day is when citizens exercise their franchise. India uses Electronic Voting Machines (EVMs) with Voter Verifiable Paper Audit Trail (VVPAT).

**At the Polling Booth:**
1. Voter arrives with Voter ID card or alternative ID (Aadhaar, Passport, etc.)
2. Name is verified against the electoral roll
3. Voter's finger is marked with **indelible ink**
4. Voter enters the voting compartment — **presses the button** next to the chosen candidate on the **Ballot Unit**
5. A **VVPAT slip** pops out showing the candidate's name and symbol for 7 seconds
6. The slip is automatically stored in a sealed box

**About EVM:**
- Standalone device — not connected to internet
- Runs on battery — works even without electricity
- M3 EVMs are tamper-proof by design
- Manufactured only by BEL and ECIL (government PSUs)

**NOTA:** If a voter doesn't want to vote for any candidate, they can press the **NOTA** (None of the Above) button.

**Polling Hours:** Generally 7:00 AM to 6:00 PM (may vary by constituency)`,
    geminiPrompt: 'Explain exactly how EVM and VVPAT work on polling day in India. Is EVM hackable?',
  },
  {
    id: 6,
    icon: '📊',
    title: 'Vote Counting & Results',
    subtitle: 'Tabulation & declaration',
    color: '#ef4444',
    summary:
      'Counting happens at designated centres. EVMs are unsealed and votes tabulated round by round. Results declared constituency-wise.',
    details: `Vote counting is a meticulously controlled process supervised by the Election Commission.

**Counting Process:**
1. Strong rooms where EVMs are stored are opened in the presence of candidates/agents
2. **Postal ballot papers** (military personnel, senior officials) are counted first
3. EVM counting begins — typically round by round
4. Results of each round are displayed on a large board
5. **Returning Officer** declares the winner after all rounds
6. Winner receives an **Election Certificate**

**Who supervises:**
- Returning Officer (RO) chairs the counting
- Counting agents of each candidate are present
- Election observers appointed by ECI monitor the process

**VVPAT Verification:**
- ECI mandates VVPAT slip counting for 5 randomly selected EVMs per assembly segment

**Result Declaration:**
- Results are declared constituency by constituency
- Party reaching majority (272 for Lok Sabha) forms the government`,
    geminiPrompt:
      'How are votes counted in Indian elections? What is the role of postal ballots and VVPAT verification?',
  },
  {
    id: 7,
    icon: '🏛️',
    title: 'Government Formation',
    subtitle: 'Oath & majority',
    color: '#8b5cf6',
    summary:
      "The party/alliance with majority forms the government. President invites the leader to form the government. PM/CM takes oath.",
    details: `After results are declared, the constitutional process of government formation begins.

**For Lok Sabha (Central Government):**
1. Party or alliance with 272+ seats (simple majority) forms the government
2. President of India invites the leader of the majority party/coalition
3. **President swears in** the Prime Minister and Council of Ministers
4. PM must prove majority on the floor of the Lok Sabha within 30 days (Confidence Vote)

**For State Assemblies:**
- Governor invites the party/alliance with majority
- **Governor swears in** the Chief Minister and Cabinet

**Coalition Government:**
- If no single party has majority, parties negotiate and form a coalition
- A **Common Minimum Programme (CMP)** is agreed upon
- The government is formed with a coalition partner's support

**Key Constitutional Articles:**
- **Article 75** — Appointment of PM and Council of Ministers
- **Article 164** — State CMs and Council of Ministers
- **Article 356** — President's Rule (if no government can be formed)

**Speaker Election:**
- Newly elected Lok Sabha/Vidhan Sabha members elect a Speaker as the first business`,
    geminiPrompt:
      'How is a government formed after Indian elections? What happens if no party gets a majority? Explain coalition government.',
  },
];

/**
 * StepperGuide — visual interactive election process guide
 */
export default function StepperGuide() {
  const [expandedStep, setExpandedStep] = useState(null);
  const [loadingStep, setLoadingStep] = useState(null);
  const { addMessage, setActiveTab, language } = useAppContext();

  const toggleStep = (stepId) => {
    setExpandedStep((prev) => (prev === stepId ? null : stepId));
  };

  const askGeminiAboutStep = async (step, event) => {
    event.stopPropagation();
    setLoadingStep(step.id);

    try {
      const userMessage = { role: 'user', parts: [{ text: step.geminiPrompt }] };
      addMessage(userMessage);
      setActiveTab('chat');

      const response = await sendChatMessage([userMessage], language);
      addMessage({ role: 'model', parts: [{ text: response }] });
    } catch (err) {
      addMessage({
        role: 'model',
        parts: [{ text: `Sorry, I couldn't get an explanation right now. Error: ${err.message}` }],
      });
    } finally {
      setLoadingStep(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="font-display font-bold text-2xl text-gradient-saffron mb-2">
          Indian Election Process
        </h2>
        <p className="text-sm" style={{ color: '#8b949e' }}>
          From announcement to government formation — click any step to explore
        </p>
      </div>

      {/* Steps */}
      {ELECTION_STEPS.map((step, index) => {
        const isExpanded = expandedStep === step.id;
        const isLoading = loadingStep === step.id;

        return (
          <div key={step.id} className="relative animate-fade-in-up" style={{ animationDelay: `${index * 0.07}s` }}>
            {/* Connector line */}
            {index < ELECTION_STEPS.length - 1 && (
              <div
                className="absolute left-6 top-full w-0.5 h-3 z-10"
                style={{ background: 'rgba(255,153,51,0.2)' }}
              />
            )}

            <div
              className="rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer"
              style={{
                background: isExpanded
                  ? 'rgba(255,153,51,0.07)'
                  : 'rgba(22,27,34,0.8)',
                border: isExpanded
                  ? `1px solid rgba(255,153,51,0.3)`
                  : '1px solid rgba(255,255,255,0.07)',
                boxShadow: isExpanded ? `0 4px 20px rgba(255,153,51,0.1)` : 'none',
              }}
            >
              {/* Step header */}
              <button
                onClick={() => toggleStep(step.id)}
                aria-expanded={isExpanded}
                aria-controls={`step-content-${step.id}`}
                className="w-full flex items-center gap-4 p-4 text-left transition-all hover:bg-white/[0.02]"
              >
                {/* Step number + icon */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold"
                    style={{
                      background: isExpanded
                        ? `linear-gradient(135deg, ${step.color}, ${step.color}88)`
                        : 'rgba(255,255,255,0.06)',
                      border: `2px solid ${isExpanded ? step.color : 'rgba(255,255,255,0.1)'}`,
                    }}
                  >
                    {step.icon}
                  </div>
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      background: isExpanded ? step.color : 'rgba(255,255,255,0.1)',
                      color: isExpanded ? 'white' : '#8b949e',
                    }}
                  >
                    {step.id}
                  </div>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold text-sm"
                    style={{ color: isExpanded ? step.color : '#e6edf3' }}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#8b949e' }}>
                    {step.subtitle}
                  </p>
                  <p
                    className="mt-1 text-xs leading-relaxed"
                    style={{ color: '#8b949e' }}
                  >
                    {step.summary}
                  </p>
                </div>

                {/* Chevron */}
                <div style={{ color: '#8b949e', flexShrink: 0 }}>
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </button>

              {/* Expandable details */}
              <div
                id={`step-content-${step.id}`}
                className={`step-content ${isExpanded ? 'expanded' : 'collapsed'}`}
              >
                <div className="px-4 pb-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="mt-4 p-4 rounded-xl text-sm leading-relaxed markdown-content"
                    style={{
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      whiteSpace: 'pre-line',
                    }}
                  >
                    <div dangerouslySetInnerHTML={{ __html: step.details.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/\n/g, '<br/>') }} />
                  </div>

                  {/* Ask Gemini button */}
                  <button
                    onClick={(e) => askGeminiAboutStep(step, e)}
                    disabled={isLoading}
                    aria-label={`Ask AI to explain ${step.title}`}
                    className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 disabled:opacity-60 cursor-pointer"
                    style={{
                      background: `linear-gradient(135deg, ${step.color}22, ${step.color}11)`,
                      border: `1px solid ${step.color}44`,
                      color: step.color,
                    }}
                  >
                    <MessageCircle size={14} />
                    {isLoading ? 'Getting explanation...' : 'Ask AI to explain this step →'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Completion badge */}
      <div
        className="flex items-center justify-center gap-2 py-4 rounded-2xl animate-fade-in-up"
        style={{
          background: 'rgba(19,136,8,0.1)',
          border: '1px solid rgba(19,136,8,0.2)',
          animationDelay: '0.7s',
        }}
      >
        <CheckCircle size={18} color="#138808" />
        <span className="text-sm font-medium" style={{ color: '#138808' }}>
          All 7 stages of the Indian election process
        </span>
      </div>
    </div>
  );
}
