import { TextEncoder as NodeTextEncoder, TextDecoder as NodeTextDecoder } from 'util';
import { randomUUID as nodeRandomUUID } from 'crypto';
import {
  TransformStream as NodeTransformStream,
  ReadableStream as NodeReadableStream,
  WritableStream as NodeWritableStream,
} from 'stream/web';

export function polyfillNodeGlobals() {
  if (typeof TextEncoder === 'undefined') {
    global.TextEncoder = NodeTextEncoder;
    global.TextDecoder = NodeTextDecoder;
  }

  if (typeof crypto === 'undefined' || !crypto.randomUUID) {
    global.crypto = global.crypto || {};
    global.crypto.randomUUID = nodeRandomUUID;
  }

  if (typeof TransformStream === 'undefined') {
    global.TransformStream = NodeTransformStream;
  }

  if (typeof ReadableStream === 'undefined') {
    global.ReadableStream = NodeReadableStream;
  }

  if (typeof WritableStream === 'undefined') {
    global.WritableStream = NodeWritableStream;
  }
}
