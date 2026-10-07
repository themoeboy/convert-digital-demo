export const STOREFRONT_API_VERSION = '2026-10';

/**
 * @typedef {{ token: string, country?: string, language?: string }} StorefrontConfig
 */

/** @type {StorefrontConfig | null | undefined} */
let cachedConfig;

/** @returns {StorefrontConfig | null} */
export function getStorefrontConfig() {
  if (cachedConfig !== undefined) return cachedConfig;

  const script = document.getElementById('storefront-api-config');
  cachedConfig = null;
  if (script?.textContent) {
    try {
      const config = JSON.parse(script.textContent);
      if (config?.token) cachedConfig = config;
    } catch (error) {
      console.error('Invalid Storefront API config JSON', error);
    }
  }
  return cachedConfig;
}

/**
 * @template T
 * @param {string} query
 * @param {Record<string, unknown>} [variables]
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<T>} The `data` field of the response.
 */
export async function storefrontFetch(query, variables = {}, { signal } = {}) {
  const config = getStorefrontConfig();
  if (!config) {
    throw new Error('Storefront API token is not set. Add it in Theme settings > Storefront API.');
  }

  const usesContext = /\$country\b|\$language\b/.test(query);
  const response = await fetch(`/api/${STOREFRONT_API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': config.token,
    },
    body: JSON.stringify({
      query,
      variables: usesContext
        ? { country: config.country, language: config.language, ...variables }
        : variables,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Storefront API request failed: ${response.status} ${response.statusText}`);
  }

  const { data, errors } = await response.json();
  if (errors?.length) {
    throw new Error(errors.map((/** @type {{ message: string }} */ error) => error.message).join('; '));
  }
  return data;
}
