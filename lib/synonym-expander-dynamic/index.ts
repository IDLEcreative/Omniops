/**
 * Dynamic Synonym Expansion System with Domain Isolation
 */

import { DynamicSynonymExpanderManagement } from './management';

export class DynamicSynonymExpander extends DynamicSynonymExpanderManagement {
  constructor() {
    super();
  }
}

// Export singleton instance
export const synonymExpander = new DynamicSynonymExpander();
