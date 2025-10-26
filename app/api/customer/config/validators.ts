/**
 * Customer Configuration Validators
 *
 * Type definitions and validation schemas for customer config API
 */

import { z } from 'zod'

// Request type definitions
export interface CreateConfigRequest {
  domain: string
  customerId?: string
  settings?: {
    autoScrape?: boolean
    scrapingFrequency?: 'daily' | 'weekly' | 'monthly'
    priority?: 'high' | 'normal' | 'low'
    maxPages?: number
    includeSubdomains?: boolean
  }
  metadata?: Record<string, any>
}

export interface UpdateConfigRequest {
  domain?: string
  settings?: {
    autoScrape?: boolean
    scrapingFrequency?: 'daily' | 'weekly' | 'monthly'
    priority?: 'high' | 'normal' | 'low'
    maxPages?: number
    includeSubdomains?: boolean
  }
  metadata?: Record<string, any>
}

export interface CustomerConfig {
  id: string
  customer_id: string | null
  domain: string
  settings: Record<string, any>
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

// Validation schemas with sane defaults
export const SettingsSchema = z.object({
  autoScrape: z.boolean().default(true),
  scrapingFrequency: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
  priority: z.enum(['high', 'normal', 'low']).default('normal'),
  maxPages: z.number().int().positive().max(100000).default(50),
  includeSubdomains: z.boolean().default(false),
})

export const CreateConfigSchema = z.object({
  domain: z.string().trim().min(1, 'Domain is required'),
  customerId: z.string().trim().optional(),
  settings: SettingsSchema.partial().default({}),
  metadata: z.record(z.any()).optional().default({}),
})

export const UpdateConfigSchema = z.object({
  domain: z.string().trim().optional(),
  settings: SettingsSchema.partial().optional(),
  metadata: z.record(z.any()).optional(),
})
