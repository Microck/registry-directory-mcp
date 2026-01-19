const { spawn } = require("child_process");
const { writeFileSync } = require("fs");
const path = require("path");

const OUTPUT_FILE = path.join(__dirname, "../src/data/enriched-registries.json");

const REGISTRIES_TO_SCRAPE = [
  {
    name: "Magic UI",
    url: "https://magicui.design/",
    description: "UI library for Design Engineers",
    category: "animation"
  },
  {
    name: "Aceternity UI",
    url: "https://ui.aceternity.com/",
    description: "Professional Next.js, Tailwind CSS and Framer Motion components.",
    category: "animation"
  },
  {
    name: "Animate UI",
    url: "https://animate-ui.com/",
    description: "Fully animated, open-source component distribution built with React, TypeScript, Tailwind CSS, Motion, and Shadcn CLI.",
    category: "animation"
  },
  {
    name: "Shadix UI",
    url: "https://shadix-ui.vercel.app/",
    description: "Explore a custom registry of production-ready, animated components for shadcn/ui.",
    category: "animation"
  },
  {
    name: "React Bits",
    url: "https://reactbits.dev/",
    description: "An open source collection of animated, interactive & fully customizable React components.",
    category: "animation"
  }
];

const SCRAPER_SCRIPT = `
const results = [];

for (const url of process.argv.slice(2)) {
  console.log("Scraping:", url);
  
  try {
    const page = await browser.goto(url);
    
    const hasRegistryLink = await page.evaluate(() => {
      const link = document.querySelector('a[href*="/registry"], a[href*="/components"]');
      return !!link;
    });
    
    const componentCount = await page.evaluate(() => {
      const countEl = document.querySelector('[data-component-count]');
      return countEl ? parseInt(countEl.getAttribute('data-component-count')) : 0;
    });
    
    results.push({
      name: new URL(url).hostname.replace('www.', ''),
      url: url,
      has_registry_api: hasRegistryLink,
      component_count: componentCount,
      scraped_at: new Date().toISOString()
    });
  } catch (e) {
    results.push({
      name: new URL(url).hostname.replace('www.', ''),
      url: url,
      error: String(e)
    });
  }
}

console.log(JSON.stringify(results));
`;

function runLightpandaScrape() {
  console.log("Using Lightpanda to scrape registries...");
  console.log("Working dir:", __dirname);
  
  const scriptPath = path.join(__dirname, "scripts/scrape-registries.js");
  console.log("Script path:", scriptPath);
  
  const args = [
    path.join(__dirname, "../lightpanda"),
    "run",
    "-c", SCRAPER_SCRIPT,
    ...REGISTRIES_TO_SCRAPE.map(r => r.url)
  ];

  console.log("Args:", args);
  
  return new Promise((resolve, reject) => {
    const child = spawn("node.exe", args, {
      stdio: "inherit",
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (data) => {
      stdout += data;
    });
    child.stderr.on("data", (data) => {
      stderr += data;
    });

    child.on("close", (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
          console.log(`Scraped ${result.length} registries`);
          console.log(`Written to: ${OUTPUT_FILE}`);
          resolve(result);
        } catch {
          writeFileSync(OUTPUT_FILE, stdout);
          console.log(`Written raw output to: ${OUTPUT_FILE}`);
          resolve(JSON.parse(stdout));
        }
      } else {
        reject(new Error(`Lightpanda failed with code ${code}: ${stderr}`));
      }
    });
  });
}

runLightpandaScrape()
  .then((results) => {
    console.log("Scraping complete!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
