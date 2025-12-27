import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';
import { ServiceManager } from '../helpers/service.js';
import { HttpClient } from '../helpers/http-client.js';

describe('API: /api/init', () => {
  let service;
  let client;

  before(async () => {
    service = new ServiceManager({ port: '9489' });
    await service.start();
    client = new HttpClient(service.getBaseUrl());
  });

  after(async () => {
    if (service) {
      await service.stop();
    }
  });

  describe('Init endpoint', () => {
    it('should return version information', async () => {
      const response = await client.get('/api/init');

      expect(response.status).to.equal(200);
    });

    it('should include version field', async () => {
      const response = await client.get('/api/init');

      expect(response.body).to.have.property('version');
      expect(response.body.version).to.be.a('string');
    });

    it('should include commit field', async () => {
      const response = await client.get('/api/init');

      expect(response.body).to.have.property('commit');
      expect(response.body.commit).to.be.a('string');
    });

    it('should include date field', async () => {
      const response = await client.get('/api/init');

      expect(response.body).to.have.property('date');
      expect(response.body.date).to.be.a('string');
    });

    it('should include CORS headers', async () => {
      const response = await client.get('/api/init');

      expect(response.headers).to.have.property('access-control-allow-origin', '*');
    });

    it('should include Request ID header', async () => {
      const response = await client.get('/api/init');

      expect(response.headers).to.have.property('x-request-id');
    });
  });
});

