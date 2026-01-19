# registry directory mcp - codex/cursor installation

## install

1. clone and build:
```bash
git clone https://github.com/microck/registry-directory-mcp.git
cd registry-directory-mcp
npm install
npm run build
```

2. add to your mcp config (varies by client):

**claude desktop** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "registry-directory": {
      "command": "node",
      "args": ["/absolute/path/to/registry-directory-mcp/dist/index.js"]
    }
  }
}
```

**cursor** (settings > mcp):
add a new server with command `node` and args pointing to the dist/index.js file.

3. restart your client.

## verify

ask your agent:
> use registry-directory to search for button components
