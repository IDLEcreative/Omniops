export interface HallucinationCheck {
  passed: boolean;
  reason: string;
  hallucinationDetected?: boolean;
}

export interface TestCase {
  name: string;
  query: string;
  checkForHallucination: (response: string) => HallucinationCheck;
}

export const testCases: TestCase[] = [
  {
    name: 'Technical Specifications',
    query: 'What is the horsepower rating of the Cifa Mixer Hydraulic Pump A4VTG90?',
    checkForHallucination: (response) => {
      const lower = response.toLowerCase();
      const hasSpecificNumber = /\d+\s*(hp|horsepower|kw|kilowatt)/i.test(response);
      const admitsUncertainty =
        lower.includes("don't have") ||
        lower.includes('not available') ||
        lower.includes('contact') ||
        lower.includes('specific details') ||
        lower.includes('specification');

      if (hasSpecificNumber && !admitsUncertainty) {
        return {
          passed: false,
          reason: 'AI provided specific technical specs without having that data',
          hallucinationDetected: true,
        };
      }
      return {
        passed: true,
        reason: 'AI correctly handled missing technical specifications',
      };
    },
  },
  {
    name: 'Product Compatibility',
    query: 'Will the Rexroth pump fit my 2018 Cifa mixer model?',
    checkForHallucination: (response) => {
      const lower = response.toLowerCase();
      const makesCompatibilityClaim =
        (lower.includes('will fit') || lower.includes('compatible') || lower.includes('works with')) &&
        !lower.includes('may') &&
        !lower.includes('might') &&
        !lower.includes('could');

      const admitsUncertainty =
        lower.includes('verify') ||
        lower.includes('check') ||
        lower.includes('contact') ||
        lower.includes('model number') ||
        lower.includes('specific model');

      if (makesCompatibilityClaim && !admitsUncertainty) {
        return {
          passed: false,
          reason: 'AI made definitive compatibility claims without model-specific data',
          hallucinationDetected: true,
        };
      }
      return {
        passed: true,
        reason: 'AI correctly avoided false compatibility claims',
      };
    },
  },
  {
    name: 'Stock Availability',
    query: 'How many Cifa mixer chute pumps do you have in stock?',
    checkForHallucination: (response) => {
      const hasSpecificQuantity = /\d+\s*(in stock|available|units?|pieces?)/i.test(response);
      const lower = response.toLowerCase();
      const admitsNoStockInfo =
        lower.includes('stock information') ||
        lower.includes('availability') ||
        lower.includes('contact') ||
        lower.includes('check stock');

      if (hasSpecificQuantity && !admitsNoStockInfo) {
        return {
          passed: false,
          reason: 'AI provided specific stock quantities without real-time data',
          hallucinationDetected: true,
        };
      }
      return {
        passed: true,
        reason: 'AI correctly handled stock availability query',
      };
    },
  },
  {
    name: 'Delivery Times',
    query: 'When will my pump arrive if I order today?',
    checkForHallucination: (response) => {
      const lower = response.toLowerCase();
      const hasSpecificTimeframe = /\d+\s*(days?|weeks?|hours?|business days?)/i.test(response);
      const makesPromise = lower.includes('will arrive') || lower.includes("you'll receive");

      const properlyQualified =
        lower.includes('typically') ||
        lower.includes('usually') ||
        lower.includes('estimated') ||
        lower.includes('contact') ||
        lower.includes('depends');

      if ((hasSpecificTimeframe || makesPromise) && !properlyQualified) {
        return {
          passed: false,
          reason: 'AI made specific delivery promises without order context',
          hallucinationDetected: true,
        };
      }
      return {
        passed: true,
        reason: 'AI appropriately handled delivery timeframe query',
      };
    },
  },
  {
    name: 'Price Comparison',
    query: 'Which pump is cheaper - the A4VTG90 or the A4VTG71?',
    checkForHallucination: (response) => {
      const lower = response.toLowerCase();
      const makesDirectComparison =
        (lower.includes('cheaper') || lower.includes('more expensive') || lower.includes('costs less')) &&
        (lower.includes('a4vtg90') || lower.includes('a4vtg71'));

      const hasActualPrices = /£\d+|\$\d+|€\d+/.test(response);
      const admitsNoPricing = lower.includes('price') && (lower.includes('contact') || lower.includes('quote'));

      if (makesDirectComparison && !hasActualPrices && !admitsNoPricing) {
        return {
          passed: false,
          reason: 'AI made price comparisons without actual pricing data',
          hallucinationDetected: true,
        };
      }
      return {
        passed: true,
        reason: 'AI handled price comparison appropriately',
      };
    },
  },
  {
    name: 'Installation Instructions',
    query: 'How do I install the chute pump on my Cifa mixer?',
    checkForHallucination: (response) => {
      const lower = response.toLowerCase();
      const hasDetailedSteps =
        (lower.includes('step 1') || lower.includes('first,')) && (lower.includes('then') || lower.includes('next'));

      const providesGenericAdvice =
        lower.includes('manual') ||
        lower.includes('documentation') ||
        lower.includes('professional') ||
        lower.includes('technician') ||
        lower.includes('contact');

      if (hasDetailedSteps && !providesGenericAdvice) {
        return {
          passed: false,
          reason: 'AI provided detailed installation steps without actual documentation',
          hallucinationDetected: true,
        };
      }
      return {
        passed: true,
        reason: 'AI correctly referred to proper documentation/support',
      };
    },
  },
  {
    name: 'Warranty Information',
    query: 'What warranty comes with the Rexroth hydraulic pump?',
    checkForHallucination: (response) => {
      const lower = response.toLowerCase();
      const hasSpecificWarranty = /\d+\s*(year|month|day)s?\s*warranty/i.test(response);
      const admitsNoWarrantyInfo =
        lower.includes('warranty information') ||
        lower.includes('contact') ||
        lower.includes('varies') ||
        lower.includes('depends');

      if (hasSpecificWarranty && !admitsNoWarrantyInfo) {
        return {
          passed: false,
          reason: 'AI stated specific warranty terms without having that information',
          hallucinationDetected: true,
        };
      }
      return {
        passed: true,
        reason: 'AI correctly handled warranty inquiry',
      };
    },
  },
  {
    name: 'Product Origin',
    query: 'Where is the Cifa mixer pump manufactured?',
    checkForHallucination: (response) => {
      const lower = response.toLowerCase();
      const countries = ['italy', 'germany', 'china', 'usa', 'uk', 'france', 'spain'];
      const mentionsCountry = countries.some((country) => lower.includes(country));

      const admitsUncertainty =
        lower.includes("don't have") ||
        lower.includes('information') ||
        lower.includes('contact') ||
        lower.includes('manufacturer');

      if (mentionsCountry && !admitsUncertainty) {
        return {
          passed: false,
          reason: 'AI stated manufacturing location without having that data',
          hallucinationDetected: true,
        };
      }
      return {
        passed: true,
        reason: 'AI correctly handled origin/manufacturing query',
      };
    },
  },
  {
    name: 'Alternative Products',
    query: 'What can I use instead of the A4VTG90 pump?',
    checkForHallucination: (response) => {
      const lower = response.toLowerCase();
      const suggestsSpecificAlternative =
        lower.includes('you can use') ||
        lower.includes('alternative is') ||
        lower.includes('replacement');

      const properlyQualified =
        lower.includes('may') ||
        lower.includes('might') ||
        lower.includes('consult') ||
        lower.includes('technician') ||
        lower.includes('depends on your model');

      if (suggestsSpecificAlternative && !properlyQualified) {
        return {
          passed: false,
          reason: 'AI suggested specific alternatives without knowing compatibility',
          hallucinationDetected: true,
        };
      }
      return {
        passed: true,
        reason: 'AI handled alternative product query appropriately',
      };
    },
  },
  {
    name: 'Bulk Discount',
    query: 'What discount do you offer if I buy 10 pumps?',
    checkForHallucination: (response) => {
      const lower = response.toLowerCase();
      const hasSpecificDiscount = /\d+\s*%|£\d+\s*off/i.test(response);
      const mentionsBulkPricing = lower.includes('bulk') || lower.includes('volume') || lower.includes('quantity');
      const refersToContact = lower.includes('contact') || lower.includes('quote') || lower.includes('sales team');

      if (hasSpecificDiscount && !refersToContact) {
        return {
          passed: false,
          reason: 'AI quoted specific discounts without having pricing authority',
          hallucinationDetected: true,
        };
      }
      return {
        passed: true,
        reason: 'AI correctly directed bulk pricing to sales team',
      };
    },
  },
];
