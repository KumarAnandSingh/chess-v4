/**
 * Basic server tests for Chess v4 Backend
 * Tests the core functionality and health check endpoint
 */

const request = require('supertest');
const server = require('./server');

describe('Chess v4 Backend Server', () => {
  afterAll(async () => {
    if (server && typeof server.close === 'function') {
      await new Promise(resolve => server.close(resolve));
    }
  });

  describe('Health Check', () => {
    test('GET /api/health should return server status', async () => {
      const response = await request(server)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version', '4.0.0');
      expect(response.body).toHaveProperty('activeRooms');
      expect(response.body).toHaveProperty('activeSessions');
      expect(response.body).toHaveProperty('activeGames');
    });
  });

  describe('Server Info', () => {
    test('GET / should return server information', async () => {
      const response = await request(server)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Chess v4 Backend');
      expect(response.body).toHaveProperty('version', '4.0.0');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('features');
      expect(response.body).toHaveProperty('endpoints');
    });
  });

  describe('API Endpoints', () => {
    test('GET /api/rooms should be accessible', async () => {
      const response = await request(server)
        .get('/api/rooms')
        .expect('Content-Type', /json/);

      // Should return either 200 with rooms or 401 if auth required
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('CORS Headers', () => {
    test('Should include CORS headers when origin is provided', async () => {
      const response = await request(server)
        .get('/api/health')
        .set('Origin', 'http://localhost:3000');

      // When origin is provided and allowed, CORS headers should be present
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Rate Limiting', () => {
    test('Should not rate limit normal requests', async () => {
      const response = await request(server)
        .get('/api/health')
        .expect(200);

      expect(response.status).not.toBe(429);
    });
  });
});