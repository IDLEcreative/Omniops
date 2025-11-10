/**
 * Auto-generated types from Supabase
 * Main index file that re-exports all type definitions
 */

// Re-export all individual type modules
export type { Json } from './json.types'
export type { Tables } from './tables.types'
export type { Views } from './views.types'
export type { Functions } from './functions.types'
export type { Enums } from './enums.types'
export type { CompositeTypes } from './composites.types'

// Re-export main database types and utilities
export type {
  Database,
  TablesType,
  TablesInsert,
  TablesUpdate,
  EnumsType,
  CompositeTypesType,
  Constants
} from './database.types'

// Re-export Supabase client types
export type {
  SupabaseClient,
  User,
  Session,
  AuthError,
  AuthResponse,
  PostgrestSingleResponse,
} from '@supabase/supabase-js'

// For backward compatibility with old import path
export type { Database as default } from './database.types'