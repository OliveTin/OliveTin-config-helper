import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';
import { ServiceManager } from '../helpers/service.js';
import { HttpClient } from '../helpers/http-client.js';

describe('Security Tests', () => {
  let service;
  let client;

  before(async () => {
    service = new ServiceManager({ port: '9490' });
    await service.start();
    client = new HttpClient(service.getBaseUrl());
  });

  after(async () => {
    if (service) {
      await service.stop();
    }
  });

  describe('Path traversal protection', () => {
    it('should prevent path traversal on static files (serves index.html for SPA)', async () => {
      const response = await client.get('/../../etc/passwd');

      expect(response.status).to.equal(200);
      expect(response.body).to.include('<!DOCTYPE html>');
    });

    it('should prevent path traversal with encoded slashes (serves index.html for SPA)', async () => {
      const response = await client.get('/..%2F..%2Fetc%2Fpasswd');

      expect(response.status).to.equal(200);
      expect(response.body).to.include('<!DOCTYPE html>');
    });

    it('should prevent path traversal with backslashes (serves index.html for SPA)', async () => {
      const response = await client.get('/..\\..\\etc\\passwd');

      expect(response.status).to.equal(200);
      expect(response.body).to.include('<!DOCTYPE html>');
    });
  });

  describe('Request size limits', () => {
    it('should enforce request size limits', async () => {
      const largeBody = {
        config: 'x'.repeat(11 * 1024 * 1024),
      };

      const response = await fetch(`${service.getBaseUrl()}/api/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(largeBody),
      });

      expect(response.status).to.equal(400);
    });
  });

  describe('YAML size limits', () => {
    it('should enforce YAML size limits', async () => {
      const largeYAML = 'x'.repeat(6 * 1024 * 1024);
      const response = await client.post('/api/import', {
        config: largeYAML,
      });

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('success', false);
      expect(response.body.error).to.include('exceeds maximum size');
    });
  });

  describe('CORS header validation', () => {
    it('should include proper CORS headers on all endpoints', async () => {
      const endpoints = ['/api/health', '/api/init', '/api/import', '/api/export'];

      for (const endpoint of endpoints) {
        const method = endpoint === '/api/health' || endpoint === '/api/init' ? 'get' : 'post';
        const body = method === 'post' 
          ? (endpoint === '/api/import' ? { config: 'actions: []' } : { config: { actions: [] } })
          : undefined;

        const response = body 
          ? await client.post(endpoint, body)
          : await client.get(endpoint);

        expect(response.headers).to.have.property('access-control-allow-origin', '*');
        expect(response.headers).to.have.property('access-control-allow-methods');
      }
    });
  });

  describe('Request ID injection prevention', () => {
    it('should preserve request IDs as-is (no sanitization needed in headers)', async () => {
      const maliciousId = '<script>alert("xss")</script>';
      const response = await client.get('/api/health', {
        headers: {
          'X-Request-ID': maliciousId,
        },
      });

      expect(response.headers['x-request-id']).to.equal(maliciousId);
      const bodyStr = JSON.stringify(response.body);
      expect(bodyStr).to.not.include('<script>');
    });
  });

  describe('Malformed JSON handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await fetch(`${service.getBaseUrl()}/api/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"config": "unclosed string',
      });

      expect(response.status).to.equal(400);
    });
  });
});

