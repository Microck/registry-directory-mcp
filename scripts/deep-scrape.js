import { spawn } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TARGETS = [
  { name: 'Magic UI', url: 'https://magicui.design/docs/components/announcement-beam' },
  { name: 'Aceternity UI', url: 'https://ui.aceternity.com/components' },
  { name: 'Kokonut UI', url: 'https://kokonutui.com/docs/components/input-01' },
  { name: 'Animate UI', url: 'https://animate-ui.com/docs/components/text-animate' },
  { name: 'React Bits', url: 'https://reactbits.dev/docs/text-animations/split-text' },
  { name: 'Pure UI', url: 'https://pure-ui.com/docs/components/button' },
  { name: 'Shadcn Blocks', url: 'https://shadcnblocks.com/docs/blocks/hero-01' },
  { name: 'Neobrutalism', url: 'https://neobrutalism.dev/docs/components/button' },
  { name: 'Eldora UI', url: 'https://www.eldoraui.site/docs/components/announcement-beam' },
  { name: 'useLayouts', url: 'https://uselayouts.com/docs/components/button' }
];

async function scrape(target) {
  console.log(`Scraping ${target.name}...`);
  const script = `
    const page = await browser.goto('${target.url}');
    const components = await page.evaluate(() => {
      // Find sidebar or main grid links
      const links = Array.from(document.querySelectorAll('a'));
      return links
        .filter(l => l.href.includes('/components/') || l.href.includes('/docs/components/') || l.href.includes('/blocks/'))
        .map(l => ({
          name: l.textContent.trim(),
          url: l.href
        }))
        .filter(c => c.name && c.name.length > 2 && !c.name.includes('\\n'));
    });
    console.log(JSON.stringify(components));
  `;

  return new Promise((resolve) => {
    const child = spawn('C:/Users/Microck/Documents/GitHub/lightpanda', ['run', '-c', script], {
      cwd: __dirname,
      stdio: ['inherit', 'pipe', 'inherit']
    });

    let stdout = '';
    child.stdout.on('data', (data) => {
      stdout += data;
    });

    child.on('close', (code) => {
      if (code === 0) {
        try {
          const data = JSON.parse(stdout);
          resolve({ name: target.name, components: data });
        } catch (e) {
          resolve({ name: target.name, components: [], error: 'Parse error' });
        }
      } else {
        resolve({ name: target.name, components: [], error: `Code ${code}` });
      }
    });
  });
}

async function main() {
  const allResults = [];
  for (const target of TARGETS) {
    const result = await scrape(target);
    allResults.push(result);
  }
  writeFileSync('scrape-results.json', JSON.stringify(allResults, null, 2));
}

main();
