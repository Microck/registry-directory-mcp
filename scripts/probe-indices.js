import axios from 'axios';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const registriesData = JSON.parse(readFileSync(path.join(__dirname, '../src/data/registries.json'), 'utf8'));

const INDEX_PATHS = [
  '/registry/index.json',
  '/index.json',
  '/registry.json',
  '/api/components',
  '/r/index.json'
];

async function probe() {
  const results = [];
  
  for (const registry of registriesData) {
    console.log(`Probing ${registry.name}...`);
    let found = false;
    const baseUrl = registry.url.replace(/\/$/, '');
    
    for (const path of INDEX_PATHS) {
      try {
        const url = `${baseUrl}${path}`;
        const response = await axios.get(url, { timeout: 3000 });
        if (response.status === 200 && Array.isArray(response.data)) {
          console.log(`  [FOUND] ${url}`);
          results.push({
            name: registry.name,
            url: registry.url,
            index_url: url,
            components: response.data
          });
          found = true;
          break;
        }
      } catch (e) {}
    }
    
    if (!found) {
      console.log(`  [NOT FOUND] ${registry.name}`);
      results.push({
        name: registry.name,
        url: registry.url,
        index_url: null,
        components: []
      });
    }
  }
  
  writeFileSync('probe-results.json', JSON.stringify(results, null, 2));
}

probe();
