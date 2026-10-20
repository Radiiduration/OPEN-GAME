# Connect the Open Game MCP server

The MCP server runs locally over stdio. It exposes the same project operations as the Open Game core and CLI, including the browser racing game build adapter. It does not call a language model; the connected coding agent chooses tools and continues the editable game implementation.

## Prerequisites

- Node.js 20 or newer.
- Run `npm install` from the Open Game repository to install the MCP SDK and schema dependency.
- Choose a workspace directory where the server may create game project folders. It must already exist.

## Generic stdio configuration

Add a server entry to the MCP configuration supported by your coding agent. Use absolute paths for Node.js, the server file, and the workspace:

```json
{
  "mcpServers": {
    "open-game": {
      "command": "/absolute/path/to/node",
      "args": ["/absolute/path/to/open-game/src/mcp/server.js"],
      "env": {
        "OPEN_GAME_WORKSPACE": "/absolute/path/to/game-projects"
      }
    }
  }
}
```

Restart or reconnect the agent after changing its MCP configuration. The model should see these tools:

- `create_game_project`: create a design scaffold from an original game brief.
- `add_game_system`: add a system with dependencies and shared inputs/outputs.
- `plan_game_vertical_slice`: return the full production roadmap, dependency order, and first-slice acceptance criteria.
- `read_game_blueprint`: load the current project contract for continued work.
- `build_playable_game`: create an editable browser racing game folder and adjacent ZIP download from a project blueprint.
- `package_game_download`: package an exported source/build folder from any engine as a ZIP; this does not compile the project.
- `review_game_originality`: flag a narrow set of commercial game name patterns in selected blueprint text for human review. This is not legal advice or a safety certificate.

The server confines project paths to `OPEN_GAME_WORKSPACE`. Game project creation makes new folders; game builds also make new output folders and do not overwrite existing paths. The first build adapter targets browser play and local/friends WebSocket rooms. Other engines and production online infrastructure are separate future adapters.
