# installing registry-directory-mcp for opencode

## prerequisites

- [opencode.ai](https://opencode.ai) installed
- node.js 18+ installed
- git installed

## installation steps

### 1. clone and build

download the server code to your local machine:

```bash
git clone https://github.com/Microck/registry-directory-mcp.git ~/registry-directory-mcp
cd ~/registry-directory-mcp
npm install
npm run build
```

### 2. register the mcp server

configure opencode to use this server by adding it to your `~/.config/opencode/opencode.json` file under the `"mcp"` key:

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

replace `ABSOLUTE_PATH_TO_REGISTRY_DIRECTORY_MCP` with the actual path where you cloned the repository.


### 3. restart opencode

restart opencode to load the new configuration.

## usage

### check status

ask opencode:
> check registry-directory-mcp status

### use tools

you can now use commands like:
> search_components with query: "animated marquee"

## troubleshooting

### server not found

1. check if the file exists: `ls ~/registry-directory-mcp/dist/index.js`
2. verify config: check `"registry-directory-mcp"` entry in `~/.config/opencode/opencode.json`
3. ensure node is in your path.
