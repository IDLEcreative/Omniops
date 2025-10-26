/**
 * Services Business Classifier Rules
 * Classification rules for service-based businesses
 */

import { BusinessClassification, BusinessType } from './business-classifier-types';

export class ServicesClassifierRules {
  static checkHealthcare(content: string, metadata?: any): BusinessClassification {
    const indicators = [];
    let score = 0;

    if (content.includes('doctor') || content.includes('physician')) {
      indicators.push('doctors'); score += 0.25;
    }
    if (content.includes('patient')) { indicators.push('patients'); score += 0.2; }
    if (content.includes('appointment')) { indicators.push('appointments'); score += 0.25; }
    if (content.includes('medical') || content.includes('health')) {
      indicators.push('medical/health'); score += 0.15;
    }
    if (content.includes('insurance')) { indicators.push('insurance'); score += 0.15; }
    if (content.includes('treatment') || content.includes('procedure')) {
      indicators.push('treatments'); score += 0.2;
    }

    return {
      primaryType: BusinessType.HEALTHCARE,
      confidence: Math.min(score, 1),
      indicators,
      suggestedSchema: {
        primaryEntity: 'service',
        identifierField: 'service_code',
        availabilityField: 'available',
        priceField: 'fee',
        customFields: {
          provider: 'provider_name',
          specialty: 'specialty',
          insurance: 'insurance_accepted',
          duration: 'appointment_duration'
        }
      },
      extractionStrategy: {
        priorityFields: ['service_name', 'provider', 'specialty', 'insurance'],
        patterns: {
          phone: /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
          hours: /\d{1,2}:\d{2}\s*(am|pm)/i
        },
        specialProcessing: ['insurance_plans', 'locations', 'emergency_services']
      },
      terminology: {
        entityName: 'service',
        entityNamePlural: 'services',
        availableText: 'available',
        unavailableText: 'unavailable',
        priceLabel: 'fee',
        searchPrompt: 'Find services'
      }
    };
  }

  static checkLegal(content: string, metadata?: any): BusinessClassification {
    const indicators = [];
    let score = 0;

    if (content.includes('attorney') || content.includes('lawyer')) {
      indicators.push('attorneys'); score += 0.3;
    }
    if (content.includes('law firm')) { indicators.push('law firm'); score += 0.3; }
    if (content.includes('legal')) { indicators.push('legal'); score += 0.2; }
    if (content.includes('case') || content.includes('litigation')) {
      indicators.push('cases'); score += 0.15;
    }
    if (content.includes('consultation')) { indicators.push('consultation'); score += 0.15; }

    return {
      primaryType: BusinessType.LEGAL,
      confidence: Math.min(score, 1),
      indicators,
      suggestedSchema: {
        primaryEntity: 'service',
        identifierField: 'service_id',
        availabilityField: 'accepting_clients',
        priceField: 'consultation_fee',
        customFields: {
          practice_area: 'practice_area',
          attorney: 'attorney_name',
          experience: 'years_experience'
        }
      },
      extractionStrategy: {
        priorityFields: ['practice_area', 'attorney_name', 'consultation_fee'],
        patterns: {
          phone: /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
          email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
        },
        specialProcessing: ['case_results', 'testimonials', 'bar_admissions']
      },
      terminology: {
        entityName: 'service',
        entityNamePlural: 'services',
        availableText: 'accepting clients',
        unavailableText: 'not accepting clients',
        priceLabel: 'consultation fee',
        searchPrompt: 'Find legal services'
      }
    };
  }

  static checkEducation(content: string, metadata?: any): BusinessClassification {
    const indicators = [];
    let score = 0;

    if (content.includes('course') || content.includes('class')) {
      indicators.push('courses'); score += 0.25;
    }
    if (content.includes('student')) { indicators.push('students'); score += 0.2; }
    if (content.includes('tuition')) { indicators.push('tuition'); score += 0.25; }
    if (content.includes('enrollment') || content.includes('enroll')) {
      indicators.push('enrollment'); score += 0.2;
    }
    if (content.includes('degree') || content.includes('certificate')) {
      indicators.push('degrees'); score += 0.2;
    }

    return {
      primaryType: BusinessType.EDUCATION,
      confidence: Math.min(score, 1),
      indicators,
      suggestedSchema: {
        primaryEntity: 'course',
        identifierField: 'course_code',
        availabilityField: 'enrollment_open',
        priceField: 'tuition',
        customFields: {
          instructor: 'instructor',
          credits: 'credit_hours',
          schedule: 'schedule',
          prerequisites: 'prerequisites'
        }
      },
      extractionStrategy: {
        priorityFields: ['course_name', 'instructor', 'schedule', 'tuition'],
        patterns: {
          courseCode: /[A-Z]{2,4}\s*\d{3,4}/,
          credits: /(\d+)\s*credit/i
        },
        specialProcessing: ['prerequisites', 'syllabus', 'registration']
      },
      terminology: {
        entityName: 'course',
        entityNamePlural: 'courses',
        availableText: 'open for enrollment',
        unavailableText: 'closed',
        priceLabel: 'tuition',
        searchPrompt: 'Search courses'
      }
    };
  }

  static checkFinancial(content: string, metadata?: any): BusinessClassification {
    const indicators = [];
    let score = 0;

    if (content.includes('account')) { indicators.push('accounts'); score += 0.2; }
    if (content.includes('loan') || content.includes('mortgage')) {
      indicators.push('loans'); score += 0.25;
    }
    if (content.includes('rate') || content.includes('apr')) {
      indicators.push('rates'); score += 0.2;
    }
    if (content.includes('investment') || content.includes('banking')) {
      indicators.push('financial services'); score += 0.2;
    }

    return {
      primaryType: BusinessType.FINANCIAL,
      confidence: Math.min(score, 1),
      indicators,
      suggestedSchema: {
        primaryEntity: 'service',
        identifierField: 'service_code',
        availabilityField: 'available',
        priceField: 'fee',
        customFields: {
          type: 'service_type',
          rate: 'interest_rate',
          term: 'term_length',
          requirements: 'requirements'
        }
      },
      extractionStrategy: {
        priorityFields: ['service_name', 'rate', 'fees', 'requirements'],
        patterns: {
          rate: /\d+\.?\d*%/,
          fee: /\$[\d,]+/
        },
        specialProcessing: ['calculators', 'eligibility', 'disclosures']
      },
      terminology: {
        entityName: 'service',
        entityNamePlural: 'services',
        availableText: 'available',
        unavailableText: 'unavailable',
        priceLabel: 'fee',
        searchPrompt: 'Find services'
      }
    };
  }

  static getProfessionalServicesClassification(content: string): BusinessClassification {
    return {
      primaryType: BusinessType.PROFESSIONAL_SERVICES,
      confidence: 0.5,
      indicators: ['generic business content'],
      suggestedSchema: {
        primaryEntity: 'service',
        identifierField: 'service_id',
        availabilityField: 'available',
        priceField: 'price',
        customFields: {
          description: 'description',
          duration: 'duration',
          category: 'category'
        }
      },
      extractionStrategy: {
        priorityFields: ['service_name', 'description', 'price', 'contact'],
        patterns: {
          price: /\$[\d,]+\.?\d*/,
          phone: /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
          email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
        },
        specialProcessing: ['team', 'portfolio', 'testimonials']
      },
      terminology: {
        entityName: 'service',
        entityNamePlural: 'services',
        availableText: 'available',
        unavailableText: 'unavailable',
        priceLabel: 'price',
        searchPrompt: 'Find services'
      }
    };
  }
}
