# registry directory mcp

an mcp server that lets llms search and discover shadcn/ui registries and components from [registry.directory](https://registry.directory).

it indexes 40+ community registries (magic ui, aceternity, kokonut, etc.) and tries to fetch their component lists so you can search across all of them at once.

## quickstart for ai agents

**opencode**
tell opencode:
> fetch and follow instructions from https://raw.githubusercontent.com/microck/registry-directory-mcp/master/.opencode/INSTALL.md

**codex / cursor / other**
tell your agent:
> fetch and follow instructions from https://raw.githubusercontent.com/microck/registry-directory-mcp/master/.codex/INSTALL.md

## features

- **registry search**: search 40+ shadcn/ui compatible registries by name or description.
- **component discovery**: attempts to fetch and search component indices from registries that expose them.
- **best-effort indexing**: tries multiple known paths (`/registry/index.json`, `/r/index.json`, etc.) to find component lists.
- **instant results**: cached indices for fast repeated searches.

## tools

### search_registries
search for registries by name or description.

```json
{
  "name": "search_registries",
  "arguments": {
    "query": "animation"
  }
}
```

### get_registry_index
fetch the raw component list from a specific registry (if available).

```json
{
  "name": "get_registry_index",
  "arguments": {
    "registry_url": "https://ui.shadcn.com/"
  }
}
```

### search_components
search for components across all known registries.

```json
{
  "name": "search_components",
  "arguments": {
    "query": "button"
  }
}
```

## resources

### registries://list
returns the full list of known registries as json.

## installation

```bash
git clone https://github.com/microck/registry-directory-mcp.git
cd registry-directory-mcp
npm install
npm run build
```

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

## limitations

- not all registries expose a public component index. `search_components` only works on registries that do.
- component urls are best-guess based on shadcn conventions (`/r/{name}.json`).

## license

mit
