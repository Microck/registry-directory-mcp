# registry directory mcp

an mcp server that lets llms search and discover shadcn/ui registries and components from [registry.directory](https://registry.directory).

it indexes 40+ community registries (magic ui, aceternity, kokonut, etc.) and uses deep-scraped metadata to ensure everything is searchable, even if the registry doesn't expose a public index.

## quickstart for ai agents

**opencode**
> fetch and follow instructions from https://raw.githubusercontent.com/Microck/registry-directory-mcp/master/.opencode/INSTALL.md

**codex / cursor / other**
> fetch and follow instructions from https://raw.githubusercontent.com/Microck/registry-directory-mcp/master/.codex/INSTALL.md

## features

- **deep index**: 150+ premium components pre-indexed with tags and descriptions.
- **registry discovery**: search 40+ shadcn/ui compatible registries by name, category, or vibe.
- **smart fallback**: automatically probes registries for public indices and falls back to scraped data.
- **ai ranking**: includes a `recommend_best_components` tool that filters by quality and requirement matching.

## usage

### tools

- `search_registries`: search for registries by name, description, tags, or category.
- `search_components`: search for specific components across all registries.
- `get_registry_index`: fetch the official component list from a registry url.
- `get_categories`: list all available component categories and tags.
- `recommend_best_components`: ranks and suggests the best components for your specific need.
- `get_component_details`: fetch full json/code for a component if available.

### example

```json
{
  "name": "recommend_best_components",
  "arguments": {
    "requirement": "need an animated marquee for a landing page hero"
  }
}
```

## installation

```bash
git clone https://github.com/Microck/registry-directory-mcp.git
cd registry-directory-mcp
npm install
npm run build
```

## configuration

add to your mcp client config (e.g., `claude_desktop_config.json` or `opencode`):

```json
{
  "mcpServers": {
    "registry-directory": {
      "command": "node",
      "args": ["/path/to/registry-directory-mcp/dist/index.js"]
    }
  }
}
```

## license

mit
