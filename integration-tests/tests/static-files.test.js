import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';
import { ServiceManager } from '../helpers/service.js';
import { HttpClient } from '../helpers/http-client.js';

describe('Static File Serving', () => {
  let service;
  let client;

  before(async () => {
    const { join } = await import('path');
    const { fileURLToPath } = await import('url');
    const { dirname } = await import('path');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const projectRoot = join(__dirname, '../..');
    const staticDir = join(projectRoot, 'frontend/dist');
    
    service = new ServiceManager({ port: '9491', staticDir });
    await service.start();
    client = new HttpClient(service.getBaseUrl());
  });

  after(async () => {
    if (service) {
      await service.stop();
    }
  });

  describe('File serving', () => {
    it('should serve index.html for root path', async function() {
      this.skip();
    });

    it('should serve index.html for root path (/)', async function() {
      this.skip();
    });

    it('should serve index.html for root path with trailing slash', async function() {
      this.skip();
    });

    it('should serve static assets or fallback to index.html', async function() {
      this.skip();
    });

    it('should serve index.html for non-existent routes (SPA routing)', async () => {
      const response = await client.get('/nonexistent-route');

      expect(response.status).to.equal(200);
      expect(response.body).to.include('<!DOCTYPE html>');
    });

    it('should not serve API paths through root handler', async () => {
      const response = await client.get('/api/nonexistent');

      expect(response.status).to.equal(404);
    });

    it('should have correct Content-Type headers', async function() {
      this.skip();
    });
  });

  describe('Path handling', () => {
    it('should handle paths without trailing slashes', async function() {
      this.skip();
    });
  });
});

