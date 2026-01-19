# registry directory mcp - opencode installation

## auto install

run in opencode:

```
/mcp add registry-directory node /path/to/registry-directory-mcp/dist/index.js
```

## manual install

1. clone and build:
```bash
git clone https://github.com/microck/registry-directory-mcp.git
cd registry-directory-mcp
npm install
npm run build
```

2. add to `.opencode/mcp.json`:
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

3. restart opencode.

## verify

ask opencode:
> search for animation registries using registry-directory mcp
