const express = require('express');
const Joi = require('joi');
const NodeCache = require('node-cache');
const axios = require('axios');

const router = express.Router();
const newsCache = new NodeCache({ stdTTL: 1800 }); // Cache for 30 minutes

// Validate query parameters
const newsQuerySchema = Joi.object({
  q: Joi.string().max(200).default('India election 2024'),
});

router.get('/', async (req, res) => {
  const { error, value } = newsQuerySchema.validate(req.query);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { q: query } = value;
  const cacheKey = `news_${query.toLowerCase().replace(/\s+/g, '_')}`;

  // Check cache first
  const cachedResults = newsCache.get(cacheKey);
  if (cachedResults) {
    return res.status(200).json({ results: cachedResults, cached: true });
  }

  if (!process.env.GOOGLE_CSE_API_KEY || !process.env.GOOGLE_CSE_CX) {
    // Return mock data if API keys not configured
    return res.status(200).json({ results: getMockNews(), cached: false, mock: true });
  }

  try {
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: process.env.GOOGLE_CSE_API_KEY,
        cx: process.env.GOOGLE_CSE_CX,
        q: query,
        num: 5,
        sort: 'date',
      },
      timeout: 8000,
    });

    const items = (response.data.items || []).slice(0, 5).map((item) => ({
      title: item.title,
      snippet: item.snippet,
      link: item.link,
      displayLink: item.displayLink,
      image: item.pagemap?.cse_thumbnail?.[0]?.src || null,
      formattedDate: item.pagemap?.metatags?.[0]?.['article:published_time'] || null,
    }));

    // Cache the results
    newsCache.set(cacheKey, items);

    return res.status(200).json({ results: items, cached: false });
  } catch (err) {
    const errorMessage =
      process.env.NODE_ENV !== 'production' ? err.message : 'Failed to fetch news.';
    // Fallback to mock data on error
    return res.status(200).json({ results: getMockNews(), cached: false, mock: true, error: errorMessage });
  }
});

function getMockNews() {
  return [
    {
      title: 'ECI Announces Schedule for General Elections 2024',
      snippet:
        'The Election Commission of India (ECI) has announced the schedule for the 18th Lok Sabha General Elections. Voting will be held in 7 phases across the country.',
      link: 'https://eci.gov.in',
      displayLink: 'eci.gov.in',
      image: null,
      formattedDate: '2024-03-16',
    },
    {
      title: 'Voter Registration Deadline Approaching: How to Register Online',
      snippet:
        'Citizens can register as voters online through the NVSP portal at voters.eci.gov.in. Form 6 must be submitted by the deadline for eligibility to vote.',
      link: 'https://voters.eci.gov.in',
      displayLink: 'voters.eci.gov.in',
      image: null,
      formattedDate: '2024-03-10',
    },
    {
      title: 'Understanding EVM and VVPAT: A Citizen Guide',
      snippet:
        'Electronic Voting Machines (EVMs) with Voter Verifiable Paper Audit Trail (VVPAT) ensure transparency in the voting process. Here is how they work.',
      link: 'https://eci.gov.in/evm',
      displayLink: 'eci.gov.in',
      image: null,
      formattedDate: '2024-02-28',
    },
    {
      title: 'Model Code of Conduct: Rules All Candidates Must Follow',
      snippet:
        'The Model Code of Conduct comes into effect from the date of election announcement. Political parties and candidates must adhere to these rules during the election period.',
      link: 'https://eci.gov.in/model-code-of-conduct',
      displayLink: 'eci.gov.in',
      image: null,
      formattedDate: '2024-02-20',
    },
    {
      title: "India's 2024 Election: What You Need to Know",
      snippet:
        "With over 970 million eligible voters, India's 2024 general election is the largest democratic exercise in human history. Here's a complete guide.",
      link: 'https://thehindu.com/elections',
      displayLink: 'thehindu.com',
      image: null,
      formattedDate: '2024-01-15',
    },
  ];
}

module.exports = router;
