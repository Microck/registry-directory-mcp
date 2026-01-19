import axios from 'axios';
import { Registry, RegistryIndexItem, ComponentResult } from './types.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const registriesData = require('./data/registries.json') as Registry[];

export const REGISTRIES: Registry[] = registriesData;

const INDEX_PATHS = [
  '/registry/index.json',
  '/index.json',
  '/registry.json',
  '/api/components',
  '/r/index.json'
];

const registryCache = new Map<string, RegistryIndexItem[]>();

export async function fetchRegistryIndex(registryUrl: string): Promise<RegistryIndexItem[]> {
  const baseUrl = registryUrl.replace(/\/$/, '');

  if (registryCache.has(baseUrl)) {
    return registryCache.get(baseUrl)!;
  }

  for (const path of INDEX_PATHS) {
    try {
      const url = `${baseUrl}${path}`;
      const response = await axios.get(url, { timeout: 3000 });
      
      if (response.status === 200 && Array.isArray(response.data)) {
        const items = response.data.filter((item: any) => item.name && typeof item.name === 'string');
        if (items.length > 0) {
          registryCache.set(baseUrl, items);
          return items;
        }
      }
    } catch (e) {
      continue;
    }
  }

  return [];
}

export async function searchAllComponents(query: string): Promise<ComponentResult[]> {
  const results: ComponentResult[] = [];
  const normalizedQuery = query.toLowerCase();

  const promises = REGISTRIES.map(async (registry) => {
    try {
      const items = await fetchRegistryIndex(registry.url);
      for (const item of items) {
        if (item.name.toLowerCase().includes(normalizedQuery) || 
            (item.description && item.description.toLowerCase().includes(normalizedQuery))) {
          results.push({
            registryName: registry.name,
            componentName: item.name,
            description: item.description || '',
            url: `${registry.url.replace(/\/$/, '')}/r/${item.name}.json`
          });
        }
      }
    } catch (e) {
    }
  });

  await Promise.all(promises);
  return results;
}
