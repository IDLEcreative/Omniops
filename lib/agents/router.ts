export type ProviderKey = 'woocommerce' | 'generic';

/**
 * Decide which provider agent to use based on request config or env.
 * - If config explicitly specifies woocommerce.enabled, respect it.
 * - Otherwise, fall back to env presence.
 */
export function selectProviderAgent(
  config?: { features?: { woocommerce?: { enabled?: boolean } } },
  env: NodeJS.ProcessEnv = process.env
): ProviderKey {
  const woocommerceEnvConfigured = Boolean(
    env.WOOCOMMERCE_URL && env.WOOCOMMERCE_CONSUMER_KEY && env.WOOCOMMERCE_CONSUMER_SECRET
  );

  const hasExplicit = typeof config?.features?.woocommerce?.enabled === 'boolean';
  const enabled = hasExplicit
    ? Boolean(config!.features!.woocommerce!.enabled)
    : woocommerceEnvConfigured;

  return enabled ? 'woocommerce' : 'generic';
}

