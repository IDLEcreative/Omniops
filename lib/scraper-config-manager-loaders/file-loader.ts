/**
 * File-based configuration loading
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import type { ScraperConfig } from '../scraper-config-schemas';

/**
 * Load configuration from file
 */
export async function loadFromFile(filepath?: string): Promise<Partial<ScraperConfig> | null> {
  const configPaths = [
    filepath,
    path.join(process.cwd(), 'scraper-config.yaml'),
    path.join(process.cwd(), 'scraper-config.yml'),
    path.join(process.cwd(), 'scraper-config.json'),
    path.join(process.cwd(), '.scraper-config.yaml'),
    path.join(process.cwd(), '.scraper-config.json'),
  ].filter(Boolean) as string[];

  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      try {
        const fileContent = fs.readFileSync(configPath, 'utf-8');
        let parsedConfig: unknown;

        if (configPath.endsWith('.json')) {
          parsedConfig = JSON.parse(fileContent);
        } else if (configPath.endsWith('.yaml') || configPath.endsWith('.yml')) {
          parsedConfig = yaml.load(fileContent);
        }

        if (parsedConfig) {
          console.log(`Loaded configuration from ${configPath}`);
          return parsedConfig;
        }
      } catch (error) {
        console.error(`Error loading configuration from ${configPath}:`, error);
      }
    }
  }

  return null;
}
