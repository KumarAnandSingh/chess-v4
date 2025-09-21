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
    test('GET /health should return OK', async () => {
      const response = await request(server)
        .get('/health')
        .expect(200);

      expect(response.text).toBe('OK');
    });
  });

  describe('404 Error Handling', () => {
    test('GET /nonexistent should return 404', async () => {
      await request(server)
        .get('/nonexistent')
        .expect(404);
    });
  });

  describe('Basic Server Functionality', () => {
    test('Server should be an Express app', () => {
      expect(server).toBeDefined();
      expect(typeof server).toBe('function');
    });
  });
});