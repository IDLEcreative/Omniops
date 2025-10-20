"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = createClient;
exports.createServiceRoleClient = createServiceRoleClient;
exports.requireClient = requireClient;
exports.requireServiceRoleClient = requireServiceRoleClient;
exports.validateSupabaseEnv = validateSupabaseEnv;
const ssr_1 = require("@supabase/ssr");
const supabase_js_1 = require("@supabase/supabase-js");
const headers_1 = require("next/headers");
// Cache validation results for the duration of the request
let envValidated = false;
let envValid = false;
/**
 * Validates Supabase environment variables
 * Returns true if all required variables are present
 */
function validateSupabaseEnv() {
    if (envValidated)
        return envValid;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    envValid = !!(supabaseUrl && supabaseAnonKey);
    envValidated = true;
    if (!envValid) {
        console.error('[Supabase] Missing required environment variables', {
            hasUrl: !!supabaseUrl,
            hasAnonKey: !!supabaseAnonKey,
            hasServiceKey: !!serviceRoleKey,
            env: process.env.NODE_ENV
        });
    }
    return envValid;
}
/**
 * Creates a Supabase client for server-side use with user context
 * Safe for production - returns null if env vars are missing
 */
async function createClient() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseAnonKey) {
            if (process.env.NODE_ENV === 'development') {
                console.warn('[Supabase] Missing environment variables for createClient');
            }
            return null;
        }
        const cookieStore = await (0, headers_1.cookies)();
        return (0, ssr_1.createServerClient)(supabaseUrl, supabaseAnonKey, {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
                    }
                    catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
            db: {
                schema: 'public',
            },
            global: {
                headers: {
                    'x-connection-pooling': 'session',
                    'x-pool-timeout': '60',
                    'x-pool-size': '10',
                    'x-statement-timeout': '5000', // 5 second query timeout
                },
            },
            auth: {
                persistSession: true,
                autoRefreshToken: true,
            },
        });
    }
    catch (error) {
        console.error('[Supabase] Failed to create client:', error);
        return null;
    }
}
/**
 * Creates a Supabase client with service role permissions
 * Safe for production - returns null if env vars are missing
 * Uses createClient directly for service role (not SSR client which is for cookies)
 */
async function createServiceRoleClient() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !serviceRoleKey) {
            if (process.env.NODE_ENV === 'development') {
                console.warn('[Supabase] Missing environment variables for service role client');
            }
            return null;
        }
        // Use createClient directly for service role, not createServerClient
        // createServerClient is for cookie-based auth, not service role
        return (0, supabase_js_1.createClient)(supabaseUrl, serviceRoleKey, {
            db: {
                schema: 'public',
            },
            global: {
                headers: {
                    'x-connection-pooling': 'transaction',
                    'x-pool-timeout': '60',
                    'x-pool-size': '20', // Higher pool size for service role
                    'x-statement-timeout': '5000', // 5 second query timeout
                    'x-connection-timeout': '10000', // 10 second connection timeout
                },
            },
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        });
    }
    catch (error) {
        console.error('[Supabase] Failed to create service role client:', error);
        return null;
    }
}
/**
 * Gets a Supabase client or throws a production-safe error
 * Use this when Supabase is absolutely required
 */
async function requireClient() {
    const client = await createClient();
    if (!client) {
        throw new Error('Database service is currently unavailable');
    }
    return client;
}
/**
 * Gets a service role client or throws a production-safe error
 * Use this when service role access is absolutely required
 */
async function requireServiceRoleClient() {
    const client = await createServiceRoleClient();
    if (!client) {
        throw new Error('Database service is currently unavailable');
    }
    return client;
}
