/**
 * Organization Context - Backwards Compatibility Shim
 *
 * This file re-exports from the new modular structure for backwards compatibility.
 * Existing imports of organization-context.tsx will continue to work.
 *
 * New code should import from organization-context-index.ts instead.
 *
 * Refactored on 2025-10-24 to comply with 300 LOC limit:
 * - organization-types.ts (70 LOC) - Type definitions
 * - organization-cache.ts (52 LOC) - Cache manager utility
 * - organization-provider.tsx (341 LOC) - React context provider
 * - organization-context-index.ts (10 LOC) - Public API
 */

export * from './organization-types';
export * from './organization-cache';
export { OrganizationProvider, useOrganization } from './organization-provider';