/**
 * Business Type Classifier
 * Intelligently detects the type of business from website content
 * and adapts extraction strategies accordingly
 */

import { BusinessClassification } from './business-classifier-types';
import { BusinessClassifierRules } from './business-classifier-rules';

// Re-export types for backwards compatibility
export type {
  BusinessClassification,
  EntitySchema,
  ExtractionStrategy,
  BusinessTerminology
} from './business-classifier-types';

export { BusinessType } from './business-classifier-types';

export class BusinessClassifier {
  /**
   * Analyze website content to determine business type
   */
  static async classifyBusiness(
    domain: string,
    sampleContent: string[],
    metadata?: any
  ): Promise<BusinessClassification> {
    // Combine all content for analysis
    const fullContent = sampleContent.join(' ').toLowerCase();

    // Check for business type indicators
    const classifications = [
      BusinessClassifierRules.checkEcommerce(fullContent, metadata),
      BusinessClassifierRules.checkRealEstate(fullContent, metadata),
      BusinessClassifierRules.checkHealthcare(fullContent, metadata),
      BusinessClassifierRules.checkLegal(fullContent, metadata),
      BusinessClassifierRules.checkEducation(fullContent, metadata),
      BusinessClassifierRules.checkRestaurant(fullContent, metadata),
      BusinessClassifierRules.checkAutomotive(fullContent, metadata),
      BusinessClassifierRules.checkFinancial(fullContent, metadata),
      BusinessClassifierRules.checkHospitality(fullContent, metadata),
    ];

    // Find the highest confidence classification
    const bestMatch = classifications.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );

    // If confidence is too low, classify as professional services
    if (bestMatch.confidence < 0.3) {
      return BusinessClassifierRules.getProfessionalServicesClassification(fullContent);
    }

    return bestMatch;
  }
}
