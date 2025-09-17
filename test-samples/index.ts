/**
 * Sample index - entry point with high fan-out
 */

// Import all samples - creates high fan-out
import SampleA, { VERSION as SAMPLE_A_VERSION } from './sample-a';
import { SampleB, SAMPLE_B_CONFIG } from './sample-b';
import DefaultDataLoader, { 
  createLoader, 
  quickLoad, 
  API_VERSION,
  TIMEOUT 
} from './sample-c';
import * as utils from './utils';
import config from './config.json';

// Type-only imports
import type { SampleAProps } from './sample-a';
import type { DataValidator, ProcessedItem } from './utils';

// Re-exports (barrel pattern)
export { SampleA, SampleB, DefaultDataLoader };
export { createLoader, quickLoad };
export * from './utils';
export type { SampleAProps, DataValidator, ProcessedItem };

// Constants
export const APP_VERSION = '1.0.0';
export const APP_CONFIG = config;

// Main application class
export class Application {
  private sampleA: SampleA;
  private sampleB: SampleB;
  private dataLoader: DefaultDataLoader;

  constructor() {
    this.sampleA = new SampleA({
      title: 'Sample Application',
      data: []
    });
    
    this.sampleB = new SampleB();
    this.dataLoader = new DefaultDataLoader();
  }

  async initialize(): Promise<void> {
    console.log(`Starting Application v${APP_VERSION}`);
    console.log(`Sample A version: ${SAMPLE_A_VERSION}`);
    console.log(`Sample B config:`, SAMPLE_B_CONFIG);
    console.log(`API version: ${API_VERSION}`);
    console.log(`Timeout: ${TIMEOUT}ms`);

    // Load initial data
    const data = await this.dataLoader.getData();
    const processedData = utils.processData(data);
    
    console.log(`Loaded ${processedData.length} items`);
  }

  async run(): Promise<void> {
    await this.initialize();
    
    // Process with sample B
    const data = await quickLoad();
    const result = this.sampleB.process(data);
    
    console.log('Application running successfully');
    console.log(`Processed ${result.length} items`);
  }

  getStats() {
    return {
      version: APP_VERSION,
      sampleAVersion: SAMPLE_A_VERSION,
      sampleBConfig: SAMPLE_B_CONFIG,
      apiVersion: API_VERSION,
      config: APP_CONFIG,
      utilsConfig: utils.UTILS_CONFIG
    };
  }
}

// Factory function
export function createApplication(): Application {
  return new Application();
}

// Quick start function
export async function quickStart(): Promise<void> {
  const app = createApplication();
  await app.run();
}

// Default export
export default Application;