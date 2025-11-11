function ensureBlob() {
  if (typeof Blob !== 'undefined') {
    return;
  }

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

function ensureFormData() {
  if (typeof FormData !== 'undefined') {
    return;
  }

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
      this.data.forEach((values, key) => {
        values.forEach((value) => callback(value, key, this));
      });
    }
  };
}

function ensureHeaders() {
  if (typeof Headers !== 'undefined') {
    return;
  }

  global.Headers = class Headers {
    constructor(init) {
      this.map = new Map();

      if (!init) {
        return;
      }

      if (init instanceof Headers) {
        init.forEach((value, key) => this.append(key, value));
        return;
      }

      if (Array.isArray(init)) {
        init.forEach(([key, value]) => this.append(key, value));
        return;
      }

      if (typeof init === 'object') {
        Object.entries(init).forEach(([key, value]) => this.append(key, value));
      }
    }

    append(name, value) {
      const key = name.toLowerCase();
      if (this.map.has(key)) {
        const existing = this.map.get(key);
        this.map.set(key, `${existing}, ${value}`);
        return;
      }

      this.map.set(key, String(value));
    }

    get(name) {
      return this.map.get(name.toLowerCase()) || null;
    }

    set(name, value) {
      this.map.set(name.toLowerCase(), String(value));
    }

    has(name) {
      return this.map.has(name.toLowerCase());
    }

    delete(name) {
      return this.map.delete(name.toLowerCase());
    }

    forEach(callback, thisArg) {
      this.map.forEach((value, key) => callback.call(thisArg, value, key, this));
    }

    entries() {
      return this.map.entries();
    }

    keys() {
      return this.map.keys();
    }

    values() {
      return this.map.values();
    }
  };
}

function ensureResponse() {
  if (typeof Response !== 'undefined') {
    return;
  }

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

    static json(data, init = {}) {
      const body = JSON.stringify(data);
      const headers = { 'Content-Type': 'application/json', ...(init.headers || {}) };
      return new Response(body, { ...init, headers });
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

function ensureRequest() {
  if (typeof Request !== 'undefined') {
    return;
  }

  global.Request = class Request {
    constructor(url, init = {}) {
      const _url = url;
      const _method = init.method || 'GET';
      const _headers =
        init.headers instanceof Headers ? init.headers : new Headers(init.headers || {});
      const _body = init.body;
      const _mode = init.mode || 'cors';
      const _credentials = init.credentials || 'same-origin';
      const _cache = init.cache || 'default';
      const _redirect = init.redirect || 'follow';
      const _referrer = init.referrer || '';
      const _integrity = init.integrity || '';
      const _signal = init.signal || null;
      const _duplex = init.duplex || undefined;

      defineReadOnly(this, 'url', _url);
      defineReadOnly(this, 'method', _method);
      defineReadOnly(this, 'headers', _headers);
      defineReadOnly(this, 'body', _body);
      defineReadOnly(this, 'mode', _mode);
      defineReadOnly(this, 'credentials', _credentials);
      defineReadOnly(this, 'cache', _cache);
      defineReadOnly(this, 'redirect', _redirect);
      defineReadOnly(this, 'referrer', _referrer);
      defineReadOnly(this, 'integrity', _integrity);
      defineReadOnly(this, 'signal', _signal);
      defineReadOnly(this, 'duplex', _duplex);
    }

    clone() {
      const headerObj = {};
      this.headers.forEach((value, key) => {
        headerObj[key] = value;
      });

      return new Request(this.url, {
        method: this.method,
        headers: headerObj,
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
      return Promise.resolve(JSON.parse(this.body || '{}'));
    }

    text() {
      return Promise.resolve(this.body || '');
    }

    arrayBuffer() {
      return Promise.resolve(new ArrayBuffer(0));
    }

    formData() {
      return Promise.resolve(new FormData());
    }
  };
}

function ensureFetch() {
  if (typeof fetch !== 'undefined') {
    return;
  }

  global.fetch = jest.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify({}), {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
      })
    )
  );
}

function defineReadOnly(target, key, value) {
  Object.defineProperty(target, key, {
    get: () => value,
    enumerable: true,
    configurable: false,
  });
}

export function polyfillFetchApi() {
  ensureBlob();
  ensureFormData();
  ensureHeaders();
  ensureResponse();
  ensureRequest();
  ensureFetch();
}
