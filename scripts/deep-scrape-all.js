import { spawn } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROBE_RESULTS = JSON.parse(readFileSync(path.join(__dirname, '../probe-results.json'), 'utf8'));
const TARGETS = PROBE_RESULTS.filter(r => !r.index_url);

const LIGHTPANDA_PATH = 'C:/Users/Microck/Documents/GitHub/lightpanda';

async function scrapeRegistry(target) {
  console.log(`Scraping ${target.name} (${target.url})...`);
  
  const urlsToTry = [
    target.url,
    `${target.url.replace(/\/$/, '')}/docs/components`,
    `${target.url.replace(/\/$/, '')}/components`,
    `${target.url.replace(/\/$/, '')}/docs/blocks`,
    `${target.url.replace(/\/$/, '')}/blocks`
  ];

  let allComponents = [];

  for (const url of urlsToTry) {
    const script = `
      try {
        const page = await browser.goto('${url}');
        const components = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a'));
          return links
            .filter(l => {
              const href = l.href.toLowerCase();
              return href.includes('/components/') || 
                     href.includes('/docs/components/') || 
                     href.includes('/blocks/') ||
                     href.includes('/r/');
            })
            .map(l => ({
              name: l.textContent.trim(),
              url: l.href
            }))
            .filter(c => c.name && c.name.length > 2 && !c.name.includes('\\n') && c.name.length < 50);
        });
        console.log(JSON.stringify(components));
      } catch (e) {
        console.log("[]");
      }
    `;

    const result = await new Promise((resolve) => {
      const child = spawn(LIGHTPANDA_PATH, ['run', '-c', script], {
        cwd: __dirname,
        stdio: ['inherit', 'pipe', 'inherit']
      });

      let stdout = '';
      child.stdout.on('data', (data) => stdout += data);
      child.on('close', (code) => {
        if (code === 0) {
          try {
            resolve(JSON.parse(stdout));
          } catch (e) {
            resolve([]);
          }
        } else {
          resolve([]);
        }
      });
    });

    if (result.length > 0) {
      allComponents = [...allComponents, ...result];
      allComponents = allComponents.filter((v, i, a) => a.findIndex(t => t.url === v.url) === i);
      if (allComponents.length > 5) break;
    }
  }

  console.log(`  Found ${allComponents.length} components for ${target.name}`);
  return {
    registry: target.name,
    components: allComponents.map(c => ({
      name: c.name.toLowerCase().replace(/\s+/g, '-'),
      description: '',
      tags: ['scraped'],
      url: c.url
    }))
  };
}

async function main() {
  const finalDb = [];
  const BATCH_SIZE = 3;
  for (let i = 0; i < TARGETS.length; i += BATCH_SIZE) {
    const batch = TARGETS.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(t => scrapeRegistry(t)));
    finalDb.push(...results);
    writeFileSync('scraped-components-partial.json', JSON.stringify(finalDb, null, 2));
  }
  
  writeFileSync('scraped-components-full.json', JSON.stringify(finalDb, null, 2));
  console.log('Scraping complete!');
}

main();
