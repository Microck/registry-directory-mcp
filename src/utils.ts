import axios from 'axios';
import { Registry, RegistryIndexItem, ComponentResult } from './types.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const registriesData = require('./data/registries.json') as Registry[];
const componentsDb = require('./data/components.json') as any[];

export const REGISTRIES: Registry[] = registriesData.map(r => {
  const name = r.name.toLowerCase();
  const tags: string[] = [];
  let category = 'general';

  if (name.includes('animation') || name.includes('magic') || name.includes('animate') || name.includes('motion')) {
    category = 'animation';
    tags.push('animated', 'framer-motion', 'visuals');
  } else if (name.includes('form') || name.includes('input')) {
    category = 'forms';
    tags.push('validation', 'inputs', 'zod');
  } else if (name.includes('block') || name.includes('layout')) {
    category = 'blocks';
    tags.push('sections', 'templates', 'landing-page');
  } else if (name.includes('icon')) {
    category = 'icons';
    tags.push('animated-icons', 'lucide');
  } else if (name === 'shadcn/ui') {
    category = 'official';
    tags.push('core', 'standard');
  }

  return {
    ...r,
    category,
    tags: [...new Set([...(r.tags || []), ...tags])]
  };
});

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
    } catch {
      continue;
    }
  }

  return [];
}

export async function searchAllComponents(query: string): Promise<ComponentResult[]> {
  const results: ComponentResult[] = [];
  const normalizedQuery = query.toLowerCase();

  for (const entry of componentsDb) {
    const registry = REGISTRIES.find(r => r.name === entry.registry);
    if (!registry) continue;

    for (const comp of entry.components) {
      if (comp.name.toLowerCase().includes(normalizedQuery) || 
          (comp.description && comp.description.toLowerCase().includes(normalizedQuery)) ||
          comp.tags?.some((t: string) => t.toLowerCase().includes(normalizedQuery))) {
        results.push({
          registryName: registry.name,
          componentName: comp.name,
          description: comp.description || '',
          url: `${registry.url.replace(/\/$/, '')}/r/${comp.name}.json`
        });
      }
    }
  }

  const promises = REGISTRIES.map(async (registry) => {
    if (results.some(r => r.registryName === registry.name)) return;

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
    } catch {
    }
  });

  await Promise.all(promises);
  return results;
}
