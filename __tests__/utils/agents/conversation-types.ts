/**
 * Type definitions for agent conversation testing
 * Shared across all conversation test modules
 */

export interface ChatRequest {
  message: string;
  conversation_id?: string;
  session_id: string;
  domain: string;
  config?: {
    features?: {
      woocommerce?: { enabled: boolean };
      websiteScraping?: { enabled: boolean };
    };
  };
}

export interface ChatResponse {
  message: string;
  conversation_id: string;
  sources?: Array<{
    url: string;
    title: string;
    relevance: number;
  }>;
}

export interface ExpectationResult {
  passed: boolean;
  failures: string[];
}

export interface MessageExpectations {
  shouldContain?: string[];
  shouldNotContain?: string[];
  shouldReferenceHistory?: boolean;
  shouldMaintainContext?: boolean;
  contextKeywords?: string[];
}

export interface TestMessage {
  input: string;
  expectations: MessageExpectations;
}

export interface TestScenario {
  name: string;
  description: string;
  messages: TestMessage[];
}

export interface ScenarioResult {
  scenario: string;
  passed: boolean;
}
