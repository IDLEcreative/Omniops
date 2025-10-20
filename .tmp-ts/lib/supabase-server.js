"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSupabaseEnv = exports.requireServiceRoleClient = exports.requireClient = exports.createServiceRoleClient = exports.createClient = void 0;
// Server-side Supabase exports only  
// This file should only be imported in server components and API routes
var server_1 = require("./supabase/server");
Object.defineProperty(exports, "createClient", { enumerable: true, get: function () { return server_1.createClient; } });
Object.defineProperty(exports, "createServiceRoleClient", { enumerable: true, get: function () { return server_1.createServiceRoleClient; } });
Object.defineProperty(exports, "requireClient", { enumerable: true, get: function () { return server_1.requireClient; } });
Object.defineProperty(exports, "requireServiceRoleClient", { enumerable: true, get: function () { return server_1.requireServiceRoleClient; } });
Object.defineProperty(exports, "validateSupabaseEnv", { enumerable: true, get: function () { return server_1.validateSupabaseEnv; } });
