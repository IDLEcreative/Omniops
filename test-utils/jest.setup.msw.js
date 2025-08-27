// Polyfill for TextEncoder/TextDecoder in Node environment
if (typeof TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Polyfill for TransformStream
if (typeof TransformStream === 'undefined') {
  const { TransformStream } = require('stream/web');
  global.TransformStream = TransformStream;
}

// Polyfill for ReadableStream if not available
if (typeof ReadableStream === 'undefined') {
  const { ReadableStream } = require('stream/web');
  global.ReadableStream = ReadableStream;
}

// Polyfill for WritableStream if not available
if (typeof WritableStream === 'undefined') {
  const { WritableStream } = require('stream/web');
  global.WritableStream = WritableStream;
}

// Polyfill for BroadcastChannel
if (typeof BroadcastChannel === 'undefined') {
  global.BroadcastChannel = class BroadcastChannel {
    constructor(name) {
      this.name = name;
      this.closed = false;
      this.onmessage = null;
      this.onmessageerror = null;
    }

    postMessage(message) {
      // In test environment, we don't actually need to broadcast messages
      // This is just a stub for MSW
    }

    close() {
      this.closed = true;
    }
  };
}

// Polyfill for MessagePort and MessageChannel
if (typeof MessagePort === 'undefined') {
  global.MessagePort = class MessagePort {
    constructor() {
      this.onmessage = null;
      this.onmessageerror = null;
      this._otherPort = null;
    }

    postMessage(message) {
      if (this._otherPort && this._otherPort.onmessage) {
        setTimeout(() => {
          this._otherPort.onmessage({ data: message });
        }, 0);
      }
    }

    start() {
      // No-op for test environment
    }

    close() {
      // No-op for test environment
    }
  };

  global.MessageChannel = class MessageChannel {
    constructor() {
      this.port1 = new MessagePort();
      this.port2 = new MessagePort();
      this.port1._otherPort = this.port2;
      this.port2._otherPort = this.port1;
    }
  };
}

// Polyfill for Response in Node environment
if (typeof Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.statusText = init.statusText || 'OK';
      this.headers = new Map(Object.entries(init.headers || {}));
      this.ok = this.status >= 200 && this.status < 300;
      this.redirected = false;
      this.type = 'basic';
      this.url = '';
    }

    json() {
      return Promise.resolve(JSON.parse(this.body));
    }

    text() {
      return Promise.resolve(this.body);
    }

    clone() {
      return new Response(this.body, {
        status: this.status,
        statusText: this.statusText,
        headers: this.headers,
      });
    }

    arrayBuffer() {
      return Promise.resolve(new ArrayBuffer(0));
    }

    blob() {
      return Promise.resolve(new Blob([this.body]));
    }
  };
}

// Polyfill for Request in Node environment
if (typeof Request === 'undefined') {
  global.Request = class Request {
    constructor(url, init = {}) {
      this.url = url;
      this.method = init.method || 'GET';
      this.headers = new Map(Object.entries(init.headers || {}));
      this.body = init.body;
      this.mode = init.mode || 'cors';
      this.credentials = init.credentials || 'same-origin';
      this.cache = init.cache || 'default';
      this.redirect = init.redirect || 'follow';
      this.referrer = init.referrer || '';
      this.integrity = init.integrity || '';
    }

    clone() {
      return new Request(this.url, {
        method: this.method,
        headers: this.headers,
        body: this.body,
        mode: this.mode,
        credentials: this.credentials,
        cache: this.cache,
        redirect: this.redirect,
        referrer: this.referrer,
        integrity: this.integrity,
      });
    }

    json() {
      return Promise.resolve(JSON.parse(this.body));
    }

    text() {
      return Promise.resolve(this.body);
    }

    arrayBuffer() {
      return Promise.resolve(new ArrayBuffer(0));
    }
  };
}

// Polyfill for Headers in Node environment
if (typeof Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init = {}) {
      this.map = new Map(Object.entries(init));
    }

    get(name) {
      return this.map.get(name.toLowerCase());
    }

    set(name, value) {
      this.map.set(name.toLowerCase(), value);
    }

    has(name) {
      return this.map.has(name.toLowerCase());
    }

    delete(name) {
      return this.map.delete(name.toLowerCase());
    }

    forEach(callback) {
      this.map.forEach(callback);
    }
  };
}

// Polyfill for fetch if not available
if (typeof fetch === 'undefined') {
  try {
    global.fetch = require('node-fetch');
  } catch (e) {
    // If node-fetch is not available, create a basic mock
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
        ok: true,
        status: 200,
      })
    );
  }
}

// Polyfill for FormData if not available
if (typeof FormData === 'undefined') {
  global.FormData = class FormData {
    constructor() {
      this.data = new Map();
    }

    append(name, value) {
      if (!this.data.has(name)) {
        this.data.set(name, []);
      }
      this.data.get(name).push(value);
    }

    get(name) {
      const values = this.data.get(name);
      return values ? values[0] : null;
    }

    getAll(name) {
      return this.data.get(name) || [];
    }

    has(name) {
      return this.data.has(name);
    }

    delete(name) {
      return this.data.delete(name);
    }

    forEach(callback) {
      this.data.forEach((values, name) => {
        values.forEach(value => callback(value, name, this));
      });
    }
  };
}

// Polyfill for Blob if not available
if (typeof Blob === 'undefined') {
  global.Blob = class Blob {
    constructor(parts = [], options = {}) {
      this.parts = parts;
      this.type = options.type || '';
    }

    get size() {
      return this.parts.reduce((acc, part) => {
        if (typeof part === 'string') {
          return acc + part.length;
        }
        return acc + (part.size || 0);
      }, 0);
    }

    text() {
      return Promise.resolve(this.parts.join(''));
    }
  };
}