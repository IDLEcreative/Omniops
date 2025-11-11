export interface ConversationMessage {
  user: string;
  expectations: {
    natural_language: boolean;
    context_aware: boolean;
    no_hallucinations: boolean;
    helpful: boolean;
  };
}

export interface RealWorldScenario {
  name: string;
  description: string;
  user_persona: string;
  messages: ConversationMessage[];
}

export interface ScenarioRunResult {
  name: string;
  passed: boolean;
  totalScore: number;
  maxScore: number;
}
