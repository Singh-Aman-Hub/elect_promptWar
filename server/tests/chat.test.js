const request = require('supertest');
const app = require('../index');

// Mock the Gemini SDK
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        startChat: jest.fn().mockReturnValue({
          sendMessage: jest.fn().mockResolvedValue({
            response: {
              text: () => 'Mock Gemini response about Indian elections.',
            },
          }),
        }),
      }),
    })),
  };
});

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.GEMINI_API_KEY = 'test-api-key';
});

describe('POST /api/chat', () => {
  it('should return 200 with a text response for a valid request', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({
        messages: [
          {
            role: 'user',
            parts: [{ text: 'How do I register to vote in India?' }],
          },
        ],
        language: 'en',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('response');
    expect(typeof res.body.response).toBe('string');
    expect(res.body.response.length).toBeGreaterThan(0);
  });

  it('should return 400 when messages array is missing', async () => {
    const res = await request(app).post('/api/chat').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 when messages array is empty', async () => {
    const res = await request(app).post('/api/chat').send({ messages: [], language: 'en' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 when last message is not from user', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({
        messages: [
          {
            role: 'model',
            parts: [{ text: 'I am the assistant.' }],
          },
        ],
        language: 'en',
      });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 for invalid language value', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({
        messages: [{ role: 'user', parts: [{ text: 'Hello' }] }],
        language: 'fr',
      });
    expect(res.statusCode).toBe(400);
  });

  it('should handle multi-turn conversation history', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({
        messages: [
          { role: 'user', parts: [{ text: 'What is Form 6?' }] },
          { role: 'model', parts: [{ text: 'Form 6 is for voter registration.' }] },
          { role: 'user', parts: [{ text: 'Where do I submit it?' }] },
        ],
        language: 'en',
      });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('response');
  });

  it('should sanitize HTML input', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({
        messages: [
          {
            role: 'user',
            parts: [{ text: '<script>alert("xss")</script>How do I vote?' }],
          },
        ],
        language: 'en',
      });
    expect(res.statusCode).toBe(200);
  });
});
