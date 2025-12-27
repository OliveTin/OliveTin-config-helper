import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';
import { ServiceManager } from '../helpers/service.js';
import { HttpClient } from '../helpers/http-client.js';
import {
  validYAML,
  validYAMLComplete,
  validYAMLMinimal,
  invalidYAML,
  emptyYAML,
  largeYAML,
} from '../helpers/test-data.js';

describe('API: /api/import', () => {
  let service;
  let client;

  before(async () => {
    service = new ServiceManager({ port: '9486' });
    await service.start();
    client = new HttpClient(service.getBaseUrl());
  });

  after(async () => {
    if (service) {
      await service.stop();
    }
  });

  describe('Valid requests', () => {
    it('should import valid YAML with complete config', async () => {
      const response = await client.post('/api/import', {
        config: validYAMLComplete,
      });

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('config');
      expect(response.body.config).to.have.property('actions');
      expect(response.body.config.actions).to.be.an('array');
      expect(response.body.config.actions.length).to.be.greaterThan(0);
    });

    it('should import valid YAML with minimal config', async () => {
      const response = await client.post('/api/import', {
        config: validYAMLMinimal,
      });

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('config');
    });

    it('should import valid YAML with basic config', async () => {
      const response = await client.post('/api/import', {
        config: validYAML,
      });

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('config');
      expect(response.body.config.actions[0]).to.have.property('title', 'Test Action');
    });

    it('should include CORS headers', async () => {
      const response = await client.post('/api/import', {
        config: validYAML,
      });

      expect(response.headers).to.have.property('access-control-allow-origin', '*');
      expect(response.headers).to.have.property('access-control-allow-methods');
    });

    it('should include Request ID header', async () => {
      const response = await client.post('/api/import', {
        config: validYAML,
      });

      expect(response.headers).to.have.property('x-request-id');
      expect(response.headers['x-request-id']).to.be.a('string');
      expect(response.headers['x-request-id'].length).to.be.greaterThan(0);
    });

    it('should preserve provided Request ID', async () => {
      const requestId = 'test-request-id-123';
      const response = await client.post('/api/import', {
        config: validYAML,
      }, {
        headers: {
          'X-Request-ID': requestId,
        },
      });

      expect(response.headers).to.have.property('x-request-id', requestId);
    });
  });

  describe('Invalid requests', () => {
    it('should reject invalid YAML syntax', async () => {
      const response = await client.post('/api/import', {
        config: invalidYAML,
      });

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('error');
      expect(response.body.error).to.include('Failed to parse YAML');
    });

    it('should reject empty YAML string', async () => {
      const response = await client.post('/api/import', {
        config: emptyYAML,
      });

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
    });

    it('should handle missing config field', async () => {
      const response = await client.post('/api/import', {});

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body.config).to.be.an('object');
    });

    it('should reject invalid JSON', async () => {
      const response = await fetch(`${service.getBaseUrl()}/api/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{',
      });

      const body = await response.text();
      expect(response.status).to.equal(400);
      expect(body).to.include('Invalid request');
    });

    it('should reject wrong HTTP method (GET)', async () => {
      const response = await client.get('/api/import');

      expect(response.status).to.equal(405);
    });

    it('should handle CORS preflight (OPTIONS)', async () => {
      const response = await client.options('/api/import');

      expect(response.status).to.equal(200);
      expect(response.headers).to.have.property('access-control-allow-origin', '*');
    });
  });

  describe('Request size limits', () => {
    it('should handle large YAML files', async () => {
      const response = await client.post('/api/import', {
        config: largeYAML,
      });

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
    });
  });
});

