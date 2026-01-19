# installing registry-directory-mcp for codex/cursor/windsurf

## prerequisites

- node.js 18+ installed
- git installed

## installation steps

### 1. clone and build

```bash
git clone https://github.com/Microck/registry-directory-mcp.git ~/registry-directory-mcp
cd ~/registry-directory-mcp
npm install
npm run build
```

### 2. configure your agent

add the following to your `~/.config/opencode/opencode.json` file under the `"mcp"` key:

```json
"registry-directory-mcp": {
  "type": "local",
  "command": [
    "node",
    "ABSOLUTE_PATH_TO_REGISTRY_DIRECTORY_MCP/dist/index.js"
  ],
  "enabled": true
}
```

*note: replace `ABSOLUTE_PATH_TO_REGISTRY_DIRECTORY_MCP` with your actual absolute path to the cloned repository.*


### 3. restart

restart your ide or agent service.

## usage

ask your agent:
> find me an animated button for my landing page using registry-directory-mcp
