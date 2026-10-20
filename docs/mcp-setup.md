# Connect the Open Game MCP server

The MCP server runs locally over stdio. It exposes the same project operations as the Open Game core and CLI, including one bounded browser racing example adapter. It does not call a language model; the connected coding agent chooses tools and continues the editable game implementation.

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

- `create_game_project`: save the creator’s original brief as a project scaffold. The connected coding agent then implements the game in the appropriate engine.
- `add_game_system`: add a system with dependencies and shared inputs/outputs.
- `plan_game_vertical_slice`: return the full production roadmap, dependency order, and first-slice acceptance criteria.
- `read_game_blueprint`: load the current project contract for continued work.
- `read_game_progress`: resume from recorded engine/build evidence, blockers, and next task.
- `update_game_progress`: persist actual completed systems, checks run, artifacts, and blockers to the project handoff.
- `build_playable_game`: create the included bounded browser racing example and adjacent ZIP from a matching blueprint. It is not a universal game generator.
- `package_game_download`: package an exported source/build folder from any engine as a ZIP; this does not compile the project.
- `review_game_originality`: flag a narrow set of commercial game name patterns in selected blueprint text for human review. This is not legal advice or a safety certificate.

The server confines project paths to `OPEN_GAME_WORKSPACE`. Project creation, builds, and ZIP packaging make new output paths and do not overwrite existing files. The example adapter targets browser play and includes a LAN/friends WebSocket room demo. Other engines and production online infrastructure require additional adapters and implementation.
