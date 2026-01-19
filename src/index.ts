import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { REGISTRIES, fetchRegistryIndex, searchAllComponents } from "./utils.js";
import axios from "axios";
import process from "process";

const server = new Server(
  {
    name: "registry-directory-mcp",
    version: "1.2.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "registries://list",
        name: "Full Registry List",
        mimeType: "application/json",
        description: "Complete list of 40+ shadcn/ui registries with metadata, tags, and categories.",
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === "registries://list") {
    return {
      contents: [
        {
          uri: "registries://list",
          mimeType: "application/json",
          text: JSON.stringify(REGISTRIES, null, 2),
        },
      ],
    };
  }
  throw new Error("Resource not found");
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_registries",
        description: "Search for registries by name, description, tags, or category.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search term (e.g., 'animation', 'blocks', 'magic')",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "search_components",
        description: "Deep search for components across all registries (Magic UI, Aceternity, etc.).",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Component name or tag (e.g., 'marquee', 'text animation')",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "get_registry_index",
        description: "Fetch the official component list from a registry URL.",
        inputSchema: {
          type: "object",
          properties: {
            registry_url: {
              type: "string",
              description: "Base URL of the registry",
            },
          },
          required: ["registry_url"],
        },
      },
      {
        name: "get_categories",
        description: "Get all available registry categories and tags.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "recommend_best_components",
        description: "AI-friendly tool that recommends best components for a specific need.",
        inputSchema: {
          type: "object",
          properties: {
            requirement: {
              type: "string",
              description: "Requirement (e.g., 'need an animated button for landing page')",
            },
          },
          required: ["requirement"],
        },
      },
      {
        name: "get_component_details",
        description: "Get full JSON/code for a component if the URL points to a .json file.",
        inputSchema: {
          type: "object",
          properties: {
            component_url: {
              type: "string",
              description: "URL to component .json",
            },
          },
          required: ["component_url"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "search_registries") {
    const { query } = z.object({ query: z.string() }).parse(args);
    const q = query.toLowerCase();
    const results = REGISTRIES.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags?.some(t => t.toLowerCase().includes(q)) ||
        r.category?.toLowerCase().includes(q)
    );
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }

  if (name === "search_components") {
    const { query } = z.object({ query: z.string() }).parse(args);
    const results = await searchAllComponents(query);
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }

  if (name === "get_registry_index") {
    const { registry_url } = z.object({ registry_url: z.string() }).parse(args);
    const index = await fetchRegistryIndex(registry_url);
    return {
      content: [{ type: "text", text: index.length > 0 ? JSON.stringify(index, null, 2) : "No index found." }],
    };
  }

  if (name === "get_categories") {
    const categories = [...new Set(REGISTRIES.map(r => r.category).filter(Boolean))];
    const tags = [...new Set(REGISTRIES.flatMap(r => r.tags || []))];
    return {
      content: [{ type: "text", text: JSON.stringify({ categories, tags }, null, 2) }],
    };
  }

  if (name === "recommend_best_components") {
    const { requirement } = z.object({ requirement: z.string() }).parse(args);
    const results = await searchAllComponents(requirement);
    const ranked = results.sort((a, b) => {
      if (a.registryName === 'shadcn/ui') return -1;
      if (requirement.toLowerCase().includes('anim') && a.registryName.match(/magic|animate|aceternity|react bits/i)) return -1;
      return 0;
    });
    return {
      content: [{ type: "text", text: JSON.stringify(ranked.slice(0, 8), null, 2) }],
    };
  }

  if (name === "get_component_details") {
    const { component_url } = z.object({ component_url: z.string() }).parse(args);
    try {
      const response = await axios.get(component_url, { timeout: 5000 });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }

  throw new Error(`Tool not found: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
