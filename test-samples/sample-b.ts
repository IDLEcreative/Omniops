/**
 * Sample file B - creates circular dependency with sample-a
 */

import { SampleA, VERSION } from './sample-a';
import type { SampleAProps } from './sample-a';
import { processData } from './utils';

export class SampleB {
  private version = VERSION;

  process(data: any[]): any[] {
    return processData(data);
  }

  createSampleA(props: SampleAProps): SampleA {
    // This creates a circular dependency: A imports B, B imports A
    return new SampleA(props);
  }

  getVersion(): string {
    return this.version;
  }
}

export const SAMPLE_B_CONFIG = {
  name: 'SampleB',
  version: '2.0.0'
};

// Re-export from utils
export { processData, validateData } from './utils';