process.env.USE_MOCKS = 'true';
process.env.BROKER_TYPE = 'mock';
process.env.DB_FILE = ':memory:';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const createApp = require('../src/app');

let app;

beforeAll(() => {
  app = createApp();
});

test('GET /docs serves Swagger UI (HTML)', async () => {
  const res = await request(app).get('/docs').expect(200);
  expect(res.headers['content-type']).toMatch(/html/);
});

test('GET /docs/spec.json returns OpenAPI JSON', async () => {
  const res = await request(app).get('/docs/spec.json').expect(200);
  expect(res.body).toHaveProperty('openapi');
  expect(res.body.openapi).toMatch(/^3\./);
});
