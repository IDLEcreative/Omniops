/**
 * AI Quote System Types
 * Defines all data structures for business intelligence collection and pricing recommendations
 */

export interface TrafficData {
  monthlyVisitors: number;
  source: 'cloudflare' | 'similarweb' | 'estimated';
  confidence: number; // 0-100
  trend?: 'growing' | 'stable' | 'declining';
}

export interface WebsiteData {
  totalPages: number;
  productCount: number;
  blogPostCount: number;
  categories: string[];
  languages: string[];
  hasBlog: boolean;
  hasEcommerce: boolean;
  technologies: {
    ecommercePlatform?: 'woocommerce' | 'shopify' | 'magento' | 'custom';
    cms?: string;
    frameworks: string[];
  };
}

export interface CompanyData {
  name: string;
  registrationNumber?: string;
  employeeCount?: number;
  revenue?: number;
  industry?: string;
  foundedYear?: number;
  location?: string;
  companyStatus: 'active' | 'dissolved' | 'unknown';
}

export interface DomainData {
  domainAge: number; // Years since registration
  registrar?: string;
  createdDate?: Date;
  expiresDate?: Date;
  nameservers?: string[];
}

export interface BusinessIntelligence {
  domain: string;
  collectedAt: Date;
  traffic: TrafficData;
  website: WebsiteData;
  company: CompanyData;
  domainInfo: DomainData;
}

export interface PricingSignals {
  trafficSignal: 'high' | 'medium' | 'low';
  employeeSignal: 'high' | 'medium' | 'low';
  revenueSignal: 'high' | 'medium' | 'low';
  contentSignal: 'extensive' | 'moderate' | 'minimal';
  domainAgeSignal: 'established' | 'growing' | 'new';
}

export interface PricingRecommendation {
  tier: 'small_business' | 'sme' | 'mid_market' | 'enterprise';
  monthlyPrice: number;
  confidence: number;
  estimatedCompletions: number;
  reasoning: string[];
  signals: PricingSignals;
  analyzedAt: Date;
}

export interface TierFeatures {
  unlimitedSeats: boolean;
  unlimitedScraping: boolean;
  woocommerce: boolean;
  shopify: boolean;
  prioritySupport: boolean;
  advancedAnalytics: boolean;
  slaUptime?: string;
  monthlyConversations: number;
}

export interface QuoteResponse {
  tier: string;
  tierDisplayName: string;
  monthlyPrice: number;
  monthlyConversations: number;
  confidence: number;
  estimatedCompletions: number;
  reasoning: string[];
  signals: PricingSignals;
  features: TierFeatures;
  savings: {
    vsCSTeam: number;
    percentageSavings: number;
  };
}

export interface AIQuoteAnalysisRequest {
  domain: string;
}

export interface AIQuoteAnalysisResponse {
  success: boolean;
  quote: QuoteResponse;
  intelligence: {
    traffic: TrafficData;
    company: Partial<CompanyData>;
    website: Partial<WebsiteData>;
  };
  analysisTime: number; // seconds
  error?: string;
  details?: string;
}
