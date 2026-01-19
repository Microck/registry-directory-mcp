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
import process from "process";

const server = new Server(
  {
    name: "mcp-registry-directory",
    version: "1.0.0",
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
        name: "List of Registries",
        mimeType: "application/json",
        description: "A comprehensive list of shadcn/ui compatible registries",
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
        description: "Search for registries by name or description",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "get_registry_index",
        description: "Get the raw component index of a specific registry (if available)",
        inputSchema: {
          type: "object",
          properties: {
            registry_url: {
              type: "string",
              description: "The base URL of the registry",
            },
          },
          required: ["registry_url"],
        },
      },
      {
        name: "search_components",
        description: "Search for components across all known registries (best effort)",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query for components",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "filter_by_category",
        description: "Filter registries by category tag (animation, official, etc.)",
        inputSchema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              description: "Category to filter by (e.g., 'animation', 'official')",
            },
          },
          required: ["category"],
        },
      },
      {
        name: "sort_registries",
        description: "Sort registries by popularity, recency, or component count",
        inputSchema: {
          type: "object",
          properties: {
            sort_by: {
              type: "string",
              description: "Sort method: 'popularity', 'recency', or 'component_count'",
              enum: ["popularity", "recency", "component_count"],
            },
          },
          required: ["sort_by"],
        },
      },
      {
        name: "get_component_details",
        description: "Get full details for a specific component including dependencies and code",
        inputSchema: {
          type: "object",
          properties: {
            component_url: {
              type: "string",
              description: "Full URL to the component's JSON definition",
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
    const results = REGISTRIES.filter(
      (r) =>
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.description.toLowerCase().includes(query.toLowerCase())
    );
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  }

  if (name === "get_registry_index") {
    const { registry_url } = z.object({ registry_url: z.string() }).parse(args);
    const index = await fetchRegistryIndex(registry_url);
    if (index.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "Could not find a valid component index for this registry. It might not expose a standard JSON index.",
          },
        ],
        isError: true,
      };
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(index, null, 2),
        },
      ],
    };
  }

  if (name === "search_components") {
    const { query } = z.object({ query: z.string() }).parse(args);
    const results = await searchAllComponents(query);
    if (results.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No components found matching your query. Note: Not all registries expose a searchable index.",
          },
        ],
      };
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  }

  if (name === "filter_by_category") {
    const { category } = z.object({ category: z.string() }).parse(args);
    const results = REGISTRIES.filter(r => r.category === category);
    if (results.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No registries found in category "${category}". Available categories: animation, official`,
          },
        ],
      };
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  }

  if (name === "sort_registries") {
    const { sort_by } = z.object({ sort_by: z.enum(["popularity", "recency", "component_count"]) }).parse(args);
    
    const sorted = [...REGISTRIES].sort((a, b) => {
      if (sort_by === "recency") {
        const aDate = new Date(a.scraped_at || a.last_updated || '0');
        const bDate = new Date(b.scraped_at || b.last_updated || '0');
        return bDate.getTime() - aDate.getTime();
      }
      if (sort_by === "component_count") {
        const aCount = a.component_count || 0;
        const bCount = b.component_count || 0;
        return bCount - aCount;
      }
      return 0;
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(sorted, null, 2),
        },
      ],
    };
  }

  if (name === "get_component_details") {
    const { component_url } = z.object({ component_url: z.string() }).parse(args);
    
    try {
      const response = await axios.get(component_url, { timeout: 5000 });
      
      if (response.status === 200) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `Failed to fetch component: HTTP ${response.status}`,
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching component: ${error.message}`,
          },
        ],
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
