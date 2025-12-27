import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';
import { ServiceManager } from '../helpers/service.js';
import { HttpClient } from '../helpers/http-client.js';

describe('API: /api/health', () => {
  let service;
  let client;

  before(async () => {
    service = new ServiceManager({ port: '9488' });
    await service.start();
    client = new HttpClient(service.getBaseUrl());
  });

  after(async () => {
    if (service) {
      await service.stop();
    }
  });

  describe('Health check', () => {
    it('should return 200 OK', async () => {
      const response = await client.get('/api/health');

      expect(response.status).to.equal(200);
    });

    it('should return status: "ok"', async () => {
      const response = await client.get('/api/health');

      expect(response.body).to.have.property('status', 'ok');
    });

    it('should include version field', async () => {
      const response = await client.get('/api/health');

      expect(response.body).to.have.property('version');
      expect(response.body.version).to.be.a('string');
    });

    it('should include uptime field', async () => {
      const response = await client.get('/api/health');

      expect(response.body).to.have.property('uptime');
      expect(response.body.uptime).to.be.a('string');
      expect(response.body.uptime.length).to.be.greaterThan(0);
    });

    it('should include CORS headers', async () => {
      const response = await client.get('/api/health');

      expect(response.headers).to.have.property('access-control-allow-origin', '*');
      expect(response.headers).to.have.property('access-control-allow-methods');
    });

    it('should include Request ID header', async () => {
      const response = await client.get('/api/health');

      expect(response.headers).to.have.property('x-request-id');
      expect(response.headers['x-request-id']).to.be.a('string');
    });

    it('should respond quickly (< 100ms)', async () => {
      const start = Date.now();
      await client.get('/api/health');
      const duration = Date.now() - start;

      expect(duration).to.be.lessThan(100);
    });
  });
});

