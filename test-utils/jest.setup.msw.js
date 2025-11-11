import { configureMswDebug } from './jest-msw/debug.js';
import { polyfillNodeGlobals } from './jest-msw/node-globals.js';
import { polyfillMessaging } from './jest-msw/messaging.js';
import { polyfillFetchApi } from './jest-msw/fetch-api.js';

configureMswDebug();
polyfillNodeGlobals();
polyfillMessaging();
polyfillFetchApi();
