import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';
import { ServiceManager } from '../helpers/service.js';
import { HttpClient } from '../helpers/http-client.js';
import {
  validConfig,
  validConfigComplete,
  validConfigEmpty,
} from '../helpers/test-data.js';

describe('API: /api/export', () => {
  let service;
  let client;

  before(async () => {
    service = new ServiceManager({ port: '9487' });
    await service.start();
    client = new HttpClient(service.getBaseUrl());
  });

  after(async () => {
    if (service) {
      await service.stop();
    }
  });

  describe('Valid requests', () => {
    it('should export valid config to YAML', async () => {
      const response = await client.post('/api/export', {
        config: validConfig,
      });

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('yaml');
      expect(response.body.yaml).to.be.a('string');
      expect(response.body.yaml.length).to.be.greaterThan(0);
    });

    it('should export config with all fields populated', async () => {
      const response = await client.post('/api/export', {
        config: validConfigComplete,
      });

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('yaml');
      expect(response.body.yaml).to.include('actions:');
    });

    it('should export config with empty arrays', async () => {
      const response = await client.post('/api/export', {
        config: validConfigEmpty,
      });

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('yaml');
    });

    it('should include CORS headers', async () => {
      const response = await client.post('/api/export', {
        config: validConfig,
      });

      expect(response.headers).to.have.property('access-control-allow-origin', '*');
    });

    it('should include Request ID header', async () => {
      const response = await client.post('/api/export', {
        config: validConfig,
      });

      expect(response.headers).to.have.property('x-request-id');
    });
  });

  describe('Invalid requests', () => {
    it('should reject missing config field', async () => {
      const response = await client.post('/api/export', {});

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('error');
      expect(response.body.error).to.include('Config is required');
    });

    it('should reject invalid JSON', async () => {
      const response = await fetch(`${service.getBaseUrl()}/api/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{',
      });

      const body = await response.text();
      expect(response.status).to.equal(400);
    });

    it('should reject wrong HTTP method (GET)', async () => {
      const response = await client.get('/api/export');

      expect(response.status).to.equal(405);
    });

    it('should handle CORS preflight (OPTIONS)', async () => {
      const response = await client.options('/api/export');

      expect(response.status).to.equal(200);
      expect(response.headers).to.have.property('access-control-allow-origin', '*');
    });
  });

  describe('Round-trip tests', () => {
    it('should maintain data integrity: import → export → import', async () => {
      const originalYAML = `
actions:
  - title: Round Trip Test
    shell: echo "test"
    icon: test
    id: round-trip-1
`;

      const importResponse = await client.post('/api/import', {
        config: originalYAML,
      });

      expect(importResponse.status).to.equal(200);
      expect(importResponse.body.success).to.be.true;

      const exportedConfig = importResponse.body.config;

      const exportResponse = await client.post('/api/export', {
        config: exportedConfig,
      });

      expect(exportResponse.status).to.equal(200);
      expect(exportResponse.body.success).to.be.true;

      const reimportResponse = await client.post('/api/import', {
        config: exportResponse.body.yaml,
      });

      expect(reimportResponse.status).to.equal(200);
      expect(reimportResponse.body.success).to.be.true;
      expect(reimportResponse.body.config.actions[0].title).to.equal('Round Trip Test');
    });
  });
});

