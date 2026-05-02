const express = require('express');
const Joi = require('joi');

const router = express.Router();

// Validate query params
const boothQuerySchema = Joi.object({
  lat: Joi.number().min(-90).max(90),
  lng: Joi.number().min(-180).max(180),
  constituency: Joi.string().max(100),
  state: Joi.string().max(100),
}).or('lat', 'constituency');

// Mock booth data indexed by constituency/location
const MOCK_BOOTHS = {
  default: [
    {
      id: 'booth_001',
      name: 'Government Higher Secondary School - Booth 1',
      address: '14, M.G. Road, Near Central Park, New Delhi - 110001',
      lat: 28.6292,
      lng: 77.2182,
      distance: '0.3 km',
      boothNo: '001',
      constituency: 'New Delhi',
      state: 'Delhi',
      timings: '7:00 AM - 6:00 PM',
    },
    {
      id: 'booth_002',
      name: 'Municipal Corporation Primary School - Booth 2',
      address: '22, Connaught Place, New Delhi - 110001',
      lat: 28.6315,
      lng: 77.2167,
      distance: '0.7 km',
      boothNo: '002',
      constituency: 'New Delhi',
      state: 'Delhi',
      timings: '7:00 AM - 6:00 PM',
    },
    {
      id: 'booth_003',
      name: 'Kendriya Vidyalaya - Booth 3',
      address: '5, Janpath Road, New Delhi - 110011',
      lat: 28.6228,
      lng: 77.2119,
      distance: '1.2 km',
      boothNo: '003',
      constituency: 'New Delhi',
      state: 'Delhi',
      timings: '7:00 AM - 6:00 PM',
    },
    {
      id: 'booth_004',
      name: 'Delhi Public Library Building - Booth 4',
      address: '7, S.P. Mukherjee Marg, Civil Lines, Delhi - 110054',
      lat: 28.6799,
      lng: 77.2236,
      distance: '1.8 km',
      boothNo: '004',
      constituency: 'Chandni Chowk',
      state: 'Delhi',
      timings: '7:00 AM - 6:00 PM',
    },
    {
      id: 'booth_005',
      name: 'Rajkiya Pratibha Vikas Vidyalaya - Booth 5',
      address: '9, Rani Jhansi Road, Paharganj, New Delhi - 110055',
      lat: 28.6472,
      lng: 77.2119,
      distance: '2.3 km',
      boothNo: '005',
      constituency: 'New Delhi',
      state: 'Delhi',
      timings: '7:00 AM - 6:00 PM',
    },
    {
      id: 'booth_006',
      name: 'St. Stephen\'s College Community Hall - Booth 6',
      address: '1, University Enclave, Delhi - 110007',
      lat: 28.6836,
      lng: 77.2144,
      distance: '3.1 km',
      boothNo: '006',
      constituency: 'Chandni Chowk',
      state: 'Delhi',
      timings: '7:00 AM - 6:00 PM',
    },
  ],
};

router.get('/', (req, res) => {
  const { error, value } = boothQuerySchema.validate(req.query);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { lat, lng, constituency, state } = value;

  // In a real implementation, you would query an actual booths database or ECI API
  // For demo purposes, we return mocked booth data
  let booths = MOCK_BOOTHS.default;

  // If coordinates are provided, simulate distance calculation
  if (lat && lng) {
    booths = booths.map((booth, index) => ({
      ...booth,
      // Simulate varying distances
      distance: `${(0.3 + index * 0.5).toFixed(1)} km`,
    }));
  }

  // Filter by constituency if provided
  if (constituency) {
    const filtered = booths.filter(
      (b) => b.constituency.toLowerCase().includes(constituency.toLowerCase())
    );
    if (filtered.length > 0) {
      booths = filtered;
    }
  }

  return res.status(200).json({
    booths,
    total: booths.length,
    note: 'Booth data is mocked for demo purposes. In production, this would use the official ECI database.',
  });
});

module.exports = router;
