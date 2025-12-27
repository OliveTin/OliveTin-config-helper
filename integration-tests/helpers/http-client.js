export class HttpClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async request(method, path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const config = {
      method,
      headers,
      redirect: 'follow',
      signal: AbortSignal.timeout(5000),
    };

    if (options.body) {
      config.body = typeof options.body === 'string' 
        ? options.body 
        : JSON.stringify(options.body);
    }

    const response = await fetch(url, config);
    
    let body = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      body = await response.json();
    } else {
      body = await response.text();
    }

    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body,
    };
  }

  async get(path, options = {}) {
    return this.request('GET', path, options);
  }

  async post(path, body, options = {}) {
    return this.request('POST', path, { ...options, body });
  }

  async options(path, options = {}) {
    return this.request('OPTIONS', path, options);
  }
}

