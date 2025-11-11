function ensureBroadcastChannel() {
  if (typeof BroadcastChannel !== 'undefined') {
    return;
  }

  global.BroadcastChannel = class BroadcastChannel {
    constructor(name) {
      this.name = name;
      this.closed = false;
      this.onmessage = null;
      this.onmessageerror = null;
    }

    postMessage() {
      // No-op: tests only need interface presence
    }

    close() {
      this.closed = true;
    }
  };
}

function ensureMessageChannel() {
  if (typeof MessagePort !== 'undefined') {
    return;
  }

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

    start() {}
    close() {}
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

export function polyfillMessaging() {
  ensureBroadcastChannel();
  ensureMessageChannel();
}
