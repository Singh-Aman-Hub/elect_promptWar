const express = require('express');
const Joi = require('joi');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { chatRateLimiter } = require('../middleware/rateLimit');

const router = express.Router();

const xss = require('xss');

// Sanitize user input — block XSS attacks and strip HTML tags completely
function sanitizeInput(text) {
  return xss(text, {
    whiteList: {}, // completely strip all HTML tags
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style', 'xml', 'iframe', 'embed']
  }).trim();
}

// Build the system prompt based on language
function buildSystemPrompt(language = 'en') {
  const langMap = {
    en: 'English',
    hi: 'Hindi',
    ta: 'Tamil',
  };
  const langName = langMap[language] || 'English';

  return `You are ElectVoice — an expert Election Education Assistant for Indian citizens.
Your role is to help citizens understand the complete Indian election process in a clear, accurate, and engaging manner.

IMPORTANT INSTRUCTIONS:
- Always respond in ${langName}
- Provide accurate, factual information about Indian elections, ECI (Election Commission of India) rules, and democratic processes
- Use simple language that any citizen can understand
- Format responses with proper markdown: use **bold** for key terms, use bullet lists for steps/options
- When explaining processes, use numbered steps
- Include references to official forms (Form 6, Form 7, Form 8) where relevant
- Mention the NVSP portal (voters.eci.gov.in) for voter registration queries
- Explain EVMs (Electronic Voting Machines) and VVPATs accurately
- Be helpful about NOTA (None of the Above) options
- Explain the Model Code of Conduct fairly and factually
- Keep responses focused on Indian election processes
- Do NOT provide partisan political opinions or favor any political party
- If asked about non-election topics, politely redirect to election-related questions

Topics you are expert in:
- Voter registration (Form 6, NVSP, Voter ID)
- Election schedule announcement by ECI
- Nomination of candidates
- Model Code of Conduct
- Campaigning rules and regulations
- EVM (Electronic Voting Machine) working
- VVPAT (Voter Verifiable Paper Audit Trail)
- Polling day procedures
- Vote counting process
- Results and government formation
- Rajya Sabha vs Lok Sabha vs Vidhan Sabha elections
- By-elections
- NOTA (None of the Above)
- Electoral rolls and revisions
- Reserved constituencies (SC/ST)
- Election expenses limits
- Anti-defection law`;
}

// Validate request body
const chatSchema = Joi.object({
  messages: Joi.array()
    .items(
      Joi.object({
        role: Joi.string().valid('user', 'model').required(),
        parts: Joi.array()
          .items(
            Joi.object({
              text: Joi.string().max(4000).required(),
            })
          )
          .required(),
      })
    )
    .min(1)
    .max(50)
    .required(),
  language: Joi.string().valid('en', 'hi', 'ta').default('en'),
});

router.post('/', chatRateLimiter, async (req, res) => {
  // Validate request body
  const { error, value } = chatSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { messages, language } = value;

  // Sanitize the last user message
  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== 'user') {
    return res.status(400).json({ error: 'Last message must be from the user.' });
  }
  lastMessage.parts[0].text = sanitizeInput(lastMessage.parts[0].text);

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: 'Gemini API key not configured.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: buildSystemPrompt(language),
    });

    // Build Gemini history (exclude the last user message which is sent via sendMessage)
    // Gemini requires history to start with a 'user' message, so we strip any
    // leading 'model' messages (e.g. the initial welcome message from the UI)
    let history = messages.slice(0, -1).map((msg) => ({
      role: msg.role,
      parts: msg.parts,
    }));

    // Drop messages from the beginning until the first 'user' message
    while (history.length > 0 && history[0].role !== 'user') {
      history = history.slice(1);
    }

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage.parts[0].text);
    const responseText = result.response.text();

    return res.status(200).json({ response: responseText });
  } catch (err) {
    const rawMessage = err.message || '';

    // Detect quota / rate limit errors from Gemini
    if (rawMessage.includes('429') || rawMessage.toLowerCase().includes('quota')) {
      return res.status(429).json({
        error: 'The AI is temporarily unavailable due to quota limits. Please wait a moment and try again.',
      });
    }

    // Detect auth errors
    if (rawMessage.includes('401') || rawMessage.toLowerCase().includes('api key')) {
      return res.status(503).json({ error: 'Gemini API key is invalid or not authorized.' });
    }

    // Generic error — only expose details in dev
    const errorMessage =
      process.env.NODE_ENV !== 'production'
        ? `AI Error: ${rawMessage.substring(0, 200)}`
        : 'Failed to get AI response. Please try again.';
    return res.status(500).json({ error: errorMessage });
  }
});

module.exports = router;
