import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// Get absolute path to the server script
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, "dist/index.js");

console.log(`Starting server from: ${serverPath}`);

async function runTest() {
  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
  });

  const client = new Client(
    {
      name: "test-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  try {
    console.log("Connecting to server...");
    await client.connect(transport);
    console.log("Connected!");

    // List Tools
    console.log("\n--- Testing List Tools ---");
    const tools = await client.listTools();
    console.log("Tools available:", tools.tools.map(t => t.name).join(", "));
    if (tools.tools.length === 0) throw new Error("No tools found!");

    // Search Registries
    console.log("\n--- Testing search_registries (query: 'shadcn') ---");
    const searchResult = await client.callTool({
      name: "search_registries",
      arguments: { query: "shadcn" },
    });
    
    // @ts-ignore
    console.log("Result:", JSON.parse(searchResult.content[0].text).length, "registries found");

    // Get Registry Index
    console.log("\n--- Testing get_registry_index (query: 'https://ui.shadcn.com/') ---");
    try {
        const indexResult = await client.callTool({
        name: "get_registry_index",
        arguments: { registry_url: "https://ui.shadcn.com/" },
        });
        if (indexResult.isError) {
             // @ts-ignore
            console.log("Registry index fetch failed (expected for some):", indexResult.content[0].text);
        } else {
             // @ts-ignore
            const index = JSON.parse(indexResult.content[0].text);
            console.log("Index fetched!", index.length, "items");
        }
    } catch (e) {
        console.log("Tool execution error (might be network/timeout):", e);
    }

    // Search Components
    console.log("\n--- Testing search_components (query: 'button') ---");
    const componentResult = await client.callTool({
      name: "search_components",
      arguments: { query: "button" },
    });
     // @ts-ignore
    const components = JSON.parse(componentResult.content[0].text);
    console.log("Found", components.length, "components matching 'button'");
    if (components.length > 0) {
        console.log("First match:", components[0]);
    }

  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    console.log("\nClosing connection...");
    await client.close();
  }
}

runTest();
