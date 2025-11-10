/**
 * Widget Embed - Config and Bundle Loading
 */

import { createServerUrlCandidates } from './url';
import { fetchFromCandidates } from './network';
import { applyRemoteConfig } from './config';
import type { WidgetConfig, RemoteWidgetConfig } from './embed-types';
import { logDebug, logError } from './utils';

export async function loadRemoteConfig(
  config: WidgetConfig,
  currentDomain: string | null,
  userConfig: Partial<WidgetConfig>
): Promise<WidgetConfig> {
  const candidates = createServerUrlCandidates(config.serverUrl);
  if (!candidates.length) {
    logDebug('No server URL candidates available for remote config');
    return config;
  }
  if (!currentDomain) {
    logDebug('No domain resolved - skipping remote config fetch (will use defaults)');
    return config;
  }

  try {
    const query = new URLSearchParams({ domain: currentDomain });
    const { data, origin } = await fetchFromCandidates<{ success: boolean; config?: RemoteWidgetConfig | null }>(
      candidates,
      `/api/widget/config?${query.toString()}`,
      {
        timeoutMs: 8000,
        retryDelaysMs: [0, 500],
        parser: response => response.json(),
      }
    );

    if (data?.success && data.config) {
      const updated = applyRemoteConfig(config, data.config, userConfig);
      updated.serverUrl = origin;
      logDebug('Loaded remote widget config', data.config);
      return updated;
    }
  } catch (error) {
    logError('Remote config fetch failed', error);
  }

  return config;
}

export async function loadWidgetBundle(config: WidgetConfig, version: string): Promise<{ code: string; origin: string }> {
  const bundleCandidates = createServerUrlCandidates(config.serverUrl);
  logDebug('[Bundle Load] Candidates:', bundleCandidates);

  if (!bundleCandidates.length) {
    throw new Error('No server URL candidates were provided');
  }

  const result = await fetchFromCandidates<string>(bundleCandidates, `/widget-bundle.js?v=${version}`, {
    timeoutMs: 8000,
    retryDelaysMs: [0, 500, 1500],
    parser: response => response.text(),
  });

  logDebug('[Bundle Load] Fetched from:', result.origin);
  logDebug('[Bundle Load] Code length:', result.data?.length || 0);
  logDebug('[Bundle Load] Code preview:', result.data?.substring(0, 100) || 'EMPTY');

  return { code: result.data, origin: result.origin };
}

export async function loadConfigByAppId(
  config: WidgetConfig,
  appId: string
): Promise<RemoteWidgetConfig | null> {
  try {
    const candidates = createServerUrlCandidates(config.serverUrl);
    const { data } = await fetchFromCandidates<{ success: boolean; config?: RemoteWidgetConfig }>(
      candidates,
      `/api/widget/config?id=${encodeURIComponent(appId)}`,
      {
        timeoutMs: 8000,
        retryDelaysMs: [0, 500],
        parser: response => response.json(),
      }
    );

    if (data?.success && data.config) {
      logDebug('[Initialize] Config loaded successfully by app_id');
      return data.config;
    }
  } catch (error) {
    logError('[Initialize] Failed to load config by app_id', error);
  }

  return null;
}
