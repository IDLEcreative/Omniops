/**
 * Auto-generated types from Supabase
 * This file now re-exports from the modular structure for backward compatibility
 *
 * The types have been refactored into smaller modules to comply with the 300 LOC rule.
 * See types/supabase/ directory for the individual type files.
 */

// Re-export everything from the modular structure
export * from './supabase/index'

// Default export for backward compatibility
export type { Database as default } from './supabase/database.types'

// Legacy alias exports (for any code using the old names)
export type {
  Database,
  TablesType as Tables,
  TablesInsert,
  TablesUpdate,
  EnumsType as Enums,
  CompositeTypesType as CompositeTypes
} from './supabase/database.types'

export type { Json } from './supabase/json.types'
export { Constants } from './supabase/database.types'