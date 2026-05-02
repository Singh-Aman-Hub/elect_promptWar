const express = require('express');

const router = express.Router();

const TIMELINE_DATA = [
  {
    id: 'tl_1952',
    year: 1952,
    title: 'First General Elections of India',
    date: 'October 1951 – February 1952',
    type: 'historical',
    description:
      'The first general elections held in independent India. 489 Lok Sabha seats contested. Indian National Congress won a landslide majority under Jawaharlal Nehru.',
    winner: 'Indian National Congress',
    seats: 489,
    voterTurnout: '45.7%',
    emoji: '🗳️',
  },
  {
    id: 'tl_1977',
    year: 1977,
    title: '6th General Elections — End of Emergency',
    date: 'March 1977',
    type: 'historical',
    description:
      'First election after the Emergency period (1975–77). The Janata Party alliance defeated Indira Gandhi\'s Congress, marking the first time a non-Congress government came to power at the Centre.',
    winner: 'Janata Party',
    seats: 542,
    voterTurnout: '60.5%',
    emoji: '⚡',
  },
  {
    id: 'tl_1984',
    year: 1984,
    title: '8th General Elections',
    date: 'December 1984',
    type: 'historical',
    description:
      'Held after the assassination of PM Indira Gandhi. Congress under Rajiv Gandhi won the highest-ever majority in Indian parliamentary history with 404 seats.',
    winner: 'Indian National Congress',
    seats: 542,
    voterTurnout: '64.1%',
    emoji: '📜',
  },
  {
    id: 'tl_1999',
    year: 1999,
    title: '13th General Elections',
    date: 'September–October 1999',
    type: 'historical',
    description:
      'BJP-led NDA coalition won a stable majority. Atal Bihari Vajpayee became PM and completed a full 5-year term — first non-Congress government to do so.',
    winner: 'NDA (BJP-led)',
    seats: 543,
    voterTurnout: '59.9%',
    emoji: '🏛️',
  },
  {
    id: 'tl_2009',
    year: 2009,
    title: '15th General Elections',
    date: 'April–May 2009',
    type: 'historical',
    description:
      'UPA under Manmohan Singh returned to power with an improved majority. First elections with Electronic Voting Machines used nationwide across all constituencies.',
    winner: 'UPA (Congress-led)',
    seats: 543,
    voterTurnout: '58.2%',
    emoji: '💻',
  },
  {
    id: 'tl_2014',
    year: 2014,
    title: '16th Lok Sabha — Modi Wave',
    date: 'April 7 – May 12, 2014',
    type: 'historical',
    description:
      'Narendra Modi-led BJP won an outright majority with 282 seats — first single-party majority in 30 years. Historic voter turnout with VVPAT pilot in select constituencies.',
    winner: 'BJP (NDA)',
    seats: 543,
    voterTurnout: '66.4%',
    emoji: '🌊',
  },
  {
    id: 'tl_2019',
    year: 2019,
    title: '17th Lok Sabha — NDA Returns',
    date: 'April 11 – May 19, 2019',
    type: 'historical',
    description:
      'NDA won a bigger mandate with BJP alone winning 303 seats. VVPAT used in all polling booths for the first time. Highest-ever voter turnout in Indian elections at 67.4%.',
    winner: 'BJP (NDA)',
    seats: 543,
    voterTurnout: '67.4%',
    emoji: '🏆',
  },
  {
    id: 'tl_2024',
    year: 2024,
    title: '18th Lok Sabha General Elections',
    date: 'April 19 – June 1, 2024',
    type: 'current',
    description:
      'Phase-wise elections across 7 phases. Over 970 million eligible voters — the largest democratic exercise in human history. Results announced on June 4, 2024.',
    winner: 'NDA (BJP-led)',
    seats: 543,
    voterTurnout: '65.8%',
    emoji: '🇮🇳',
  },
  {
    id: 'tl_2024_jk',
    year: 2024,
    title: 'Jammu & Kashmir Assembly Elections',
    date: 'September–October 2024',
    type: 'state',
    description:
      'First assembly elections in J&K after the abrogation of Article 370 and reorganization into two Union Territories. National Conference-Congress alliance won.',
    winner: 'National Conference + Congress',
    seats: 90,
    voterTurnout: '63.9%',
    emoji: '🏔️',
  },
  {
    id: 'tl_2025_delhi',
    year: 2025,
    title: 'Delhi Assembly Elections',
    date: 'February 2025',
    type: 'state',
    description:
      'Assembly elections for the 70-seat Delhi Vidhan Sabha. A keenly contested election between BJP and AAP.',
    winner: 'BJP',
    seats: 70,
    voterTurnout: '61.2%',
    emoji: '🏙️',
  },
  {
    id: 'tl_2025_bihar',
    year: 2025,
    title: 'Bihar Assembly Elections',
    date: 'October–November 2025',
    type: 'upcoming',
    description:
      'Upcoming Bihar Vidhan Sabha elections. 243 assembly constituencies. NDA vs INDIA alliance expected to be a closely fought contest.',
    winner: null,
    seats: 243,
    voterTurnout: null,
    emoji: '📅',
  },
];

router.get('/', (req, res) => {
  return res.status(200).json({
    timeline: TIMELINE_DATA,
    total: TIMELINE_DATA.length,
  });
});

module.exports = router;
