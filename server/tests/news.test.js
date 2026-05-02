const request = require('supertest');
const app = require('../index');

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  // Do not set GOOGLE_CSE_API_KEY to trigger mock data fallback
  delete process.env.GOOGLE_CSE_API_KEY;
  delete process.env.GOOGLE_CSE_CX;
});

describe('GET /api/news', () => {
  it('should return 200 with an array of results', async () => {
    const res = await request(app).get('/api/news');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('results');
    expect(Array.isArray(res.body.results)).toBe(true);
  });

  it('should return at most 5 results', async () => {
    const res = await request(app).get('/api/news');
    expect(res.statusCode).toBe(200);
    expect(res.body.results.length).toBeLessThanOrEqual(5);
  });

  it('should accept a custom query parameter', async () => {
    const res = await request(app).get('/api/news?q=EVM+voting+machine');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('results');
  });

  it('should return 400 if query is too long', async () => {
    const longQuery = 'a'.repeat(201);
    const res = await request(app).get(`/api/news?q=${longQuery}`);
    expect(res.statusCode).toBe(400);
  });

  it('each result should have required fields', async () => {
    const res = await request(app).get('/api/news');
    expect(res.statusCode).toBe(200);
    const results = res.body.results;
    results.forEach((item) => {
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('snippet');
      expect(item).toHaveProperty('link');
      expect(item).toHaveProperty('displayLink');
    });
  });
});

describe('GET /api/booths', () => {
  it('should return 200 with booths array when lat/lng provided', async () => {
    const res = await request(app).get('/api/booths?lat=28.6139&lng=77.2090');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('booths');
    expect(Array.isArray(res.body.booths)).toBe(true);
  });

  it('should return 200 with booths when constituency provided', async () => {
    const res = await request(app).get('/api/booths?constituency=New%20Delhi');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('booths');
  });

  it('should return 400 when neither lat nor constituency provided', async () => {
    const res = await request(app).get('/api/booths');
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/timeline', () => {
  it('should return 200 with timeline array', async () => {
    const res = await request(app).get('/api/timeline');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('timeline');
    expect(Array.isArray(res.body.timeline)).toBe(true);
  });

  it('timeline items should have required fields', async () => {
    const res = await request(app).get('/api/timeline');
    res.body.timeline.forEach((item) => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('year');
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('type');
    });
  });
});
