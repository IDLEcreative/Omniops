/**
 * Widget Configuration Validation Schemas
 *
 * Zod schemas for validating widget configuration requests
 * Brand-agnostic, multi-tenant validation
 */

import { z } from 'zod'

export const ThemeSettingsSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  borderRadius: z.string().optional(),
  fontSize: z.string().optional(),
  fontFamily: z.string().optional(),
  darkMode: z.boolean().optional(),
  customCSS: z.string().max(10000).optional(),
})

export const PositionSettingsSchema = z.object({
  position: z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left']).optional(),
  offsetX: z.number().min(0).max(200).optional(),
  offsetY: z.number().min(0).max(200).optional(),
  width: z.number().min(300).max(600).optional(),
  height: z.number().min(400).max(800).optional(),
  mobileBreakpoint: z.number().min(320).max(1024).optional(),
})

export const AISettingsSchema = z.object({
  personality: z.enum(['professional', 'friendly', 'helpful', 'concise', 'technical']).optional(),
  responseLength: z.enum(['short', 'balanced', 'detailed']).optional(),
  confidenceThreshold: z.number().min(0).max(1).optional(),
  fallbackBehavior: z.enum(['apologize_and_offer_help', 'redirect_to_human', 'suggest_alternatives']).optional(),
  language: z.string().optional(),
  customSystemPrompt: z.string().max(2000).optional(),
  enableSmartSuggestions: z.boolean().optional(),
  maxTokens: z.number().min(50).max(2000).optional(),
  temperature: z.number().min(0).max(1).optional(),
})

export const BehaviorSettingsSchema = z.object({
  welcomeMessage: z.string().max(500).optional(),
  placeholderText: z.string().max(100).optional(),
  botName: z.string().max(50).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  showAvatar: z.boolean().optional(),
  showTypingIndicator: z.boolean().optional(),
  autoOpen: z.boolean().optional(),
  openDelay: z.number().min(0).max(60000).optional(),
  minimizable: z.boolean().optional(),
  soundNotifications: z.boolean().optional(),
  persistConversation: z.boolean().optional(),
  messageDelay: z.number().min(0).max(5000).optional(),
  animationType: z.enum(['none', 'pulse', 'bounce', 'rotate', 'fade', 'wiggle']).optional(),
  animationSpeed: z.enum(['slow', 'normal', 'fast']).optional(),
  animationIntensity: z.enum(['subtle', 'normal', 'strong']).optional(),
})

export const IntegrationSettingsSchema = z.object({
  enableWooCommerce: z.boolean().optional(),
  enableWebSearch: z.boolean().optional(),
  enableKnowledgeBase: z.boolean().optional(),
  apiRateLimit: z.number().min(1).max(1000).optional(),
  webhookUrl: z.string().url().optional().or(z.literal('')),
  customHeaders: z.record(z.string()).optional(),
  allowedDomains: z.array(z.string()).optional(),
  dataSourcePriority: z.array(z.string()).optional(),
})

export const AnalyticsSettingsSchema = z.object({
  trackConversations: z.boolean().optional(),
  trackUserBehavior: z.boolean().optional(),
  trackPerformance: z.boolean().optional(),
  customEvents: z.array(z.string()).optional(),
  dataRetentionDays: z.number().min(1).max(365).optional(),
  anonymizeData: z.boolean().optional(),
  shareAnalyticsWithCustomer: z.boolean().optional(),
})

export const AdvancedSettingsSchema = z.object({
  corsOrigins: z.array(z.string()).optional(),
  cacheEnabled: z.boolean().optional(),
  cacheTTL: z.number().min(0).max(86400).optional(),
  debugMode: z.boolean().optional(),
  customJSHooks: z.record(z.string()).optional(),
  securityHeaders: z.record(z.string()).optional(),
  rateLimitOverride: z.number().optional().nullable(),
  experimentalFeatures: z.array(z.string()).optional(),
})

export const BrandingSettingsSchema = z.object({
  showPoweredBy: z.boolean().optional(),
  customBrandingText: z.string().max(100).optional(),
  customLogoUrl: z.string().url().optional().or(z.literal('')),
  minimizedIconUrl: z.string().url().optional().or(z.literal('')),
  minimizedIconHoverUrl: z.string().url().optional().or(z.literal('')),
  minimizedIconActiveUrl: z.string().url().optional().or(z.literal('')),
  customFaviconUrl: z.string().url().optional().or(z.literal('')),
  brandColors: z.record(z.string()).optional(),
})

export const CreateWidgetConfigSchema = z.object({
  customerConfigId: z.string().uuid(),
  themeSettings: ThemeSettingsSchema.optional(),
  positionSettings: PositionSettingsSchema.optional(),
  aiSettings: AISettingsSchema.optional(),
  behaviorSettings: BehaviorSettingsSchema.optional(),
  integrationSettings: IntegrationSettingsSchema.optional(),
  analyticsSettings: AnalyticsSettingsSchema.optional(),
  advancedSettings: AdvancedSettingsSchema.optional(),
  brandingSettings: BrandingSettingsSchema.optional(),
})

export const UpdateWidgetConfigSchema = CreateWidgetConfigSchema.partial()

export type ThemeSettings = z.infer<typeof ThemeSettingsSchema>
export type PositionSettings = z.infer<typeof PositionSettingsSchema>
export type AISettings = z.infer<typeof AISettingsSchema>
export type BehaviorSettings = z.infer<typeof BehaviorSettingsSchema>
export type IntegrationSettings = z.infer<typeof IntegrationSettingsSchema>
export type AnalyticsSettings = z.infer<typeof AnalyticsSettingsSchema>
export type AdvancedSettings = z.infer<typeof AdvancedSettingsSchema>
export type BrandingSettings = z.infer<typeof BrandingSettingsSchema>
export type CreateWidgetConfig = z.infer<typeof CreateWidgetConfigSchema>
export type UpdateWidgetConfig = z.infer<typeof UpdateWidgetConfigSchema>
