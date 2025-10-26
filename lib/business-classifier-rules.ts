/**
 * Business Classifier Rules
 * Main coordinator for business classification rules
 * Delegates to domain-specific classifiers
 */

import { BusinessClassification } from './business-classifier-types';
import { EcommerceClassifierRules } from './business-classifier-rules-ecommerce';
import { ServicesClassifierRules } from './business-classifier-rules-services';
import { RetailClassifierRules } from './business-classifier-rules-retail';

/**
 * Main business classifier rules class
 * Delegates to specialized domain classifiers
 */
export class BusinessClassifierRules {
  // E-commerce classifiers
  static checkEcommerce(content: string, metadata?: any): BusinessClassification {
    return EcommerceClassifierRules.checkEcommerce(content, metadata);
  }

  // Service business classifiers
  static checkHealthcare(content: string, metadata?: any): BusinessClassification {
    return ServicesClassifierRules.checkHealthcare(content, metadata);
  }

  static checkLegal(content: string, metadata?: any): BusinessClassification {
    return ServicesClassifierRules.checkLegal(content, metadata);
  }

  static checkEducation(content: string, metadata?: any): BusinessClassification {
    return ServicesClassifierRules.checkEducation(content, metadata);
  }

  static checkFinancial(content: string, metadata?: any): BusinessClassification {
    return ServicesClassifierRules.checkFinancial(content, metadata);
  }

  static getProfessionalServicesClassification(content: string): BusinessClassification {
    return ServicesClassifierRules.getProfessionalServicesClassification(content);
  }

  // Retail business classifiers
  static checkRealEstate(content: string, metadata?: any): BusinessClassification {
    return RetailClassifierRules.checkRealEstate(content, metadata);
  }

  static checkRestaurant(content: string, metadata?: any): BusinessClassification {
    return RetailClassifierRules.checkRestaurant(content, metadata);
  }

  static checkAutomotive(content: string, metadata?: any): BusinessClassification {
    return RetailClassifierRules.checkAutomotive(content, metadata);
  }

  static checkHospitality(content: string, metadata?: any): BusinessClassification {
    return RetailClassifierRules.checkHospitality(content, metadata);
  }
}
