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

For Unreal builds, add `UNREAL_ENGINE_ROOT` to that server's `env` map and point it at the installed engine root (the folder containing `Engine/Build/BatchFiles/RunUAT.sh`).

Restart or reconnect the agent after changing its MCP configuration. The model should see these tools:

- `inspect_game_toolchains`: list detectable engine and build executables before selecting a target.
- `inspect_game_engine_project`: inspect a project folder for Godot, Unity, or Unreal markers and report current adapter operations.
- `build_game_engine_project`: run a Godot export preset, a Unity project-owned batch build method, or Unreal BuildCookRun when `UNREAL_ENGINE_ROOT` is configured on macOS/Linux.
- `launch_game_artifact`: start one built executable from the workspace or open a macOS `.app`; this does not observe or verify gameplay.
- `run_game_engine_scenario`: run a project-owned Godot runner or Unity scenario method and return its exit result/log. Unreal scenarios still use Unreal Automation Framework through the coding agent.
- `create_game_project`: save the creator’s original brief as a project scaffold. The connected coding agent then implements the game in the appropriate engine.
- `add_game_system`: add a system with dependencies and shared inputs/outputs.
- `plan_game_vertical_slice`: return the full production roadmap, dependency order, and first-slice acceptance criteria.
- `read_game_blueprint`: load the current project contract for continued work.
- `read_game_progress`: resume from recorded engine/build evidence, blockers, and next task.
- `update_game_progress`: persist actual completed systems, checks run, artifacts, and blockers to the project handoff.
- `read_game_obligations`: load system requirements and cross-cutting quality gates from `docs/IMPLEMENTATION_OBLIGATIONS.json`.
- `review_game_obligations`: check ledger consistency, dependencies, completion status, and evidence fields. This does not run the game or verify a reported result.
- `build_playable_game`: create the included bounded browser racing example and adjacent ZIP from a matching blueprint. It is not a universal game generator.
- `package_game_download`: package an exported source/build folder from any engine as a ZIP; this does not compile the project.
- `review_game_originality`: flag a narrow set of commercial game name patterns in selected blueprint text for human review. This is not legal advice or a safety certificate.

The server confines project paths to `OPEN_GAME_WORKSPACE`. Project creation and packaging do not overwrite existing files; engine builds require a new artifact path outside the editable source project. The example adapter targets browser play and includes a LAN/friends WebSocket room demo. Current native adapter coverage is partial: Godot exports need a configured preset and templates; Unity builds need a project-owned static method that honors Open Game's output environment variables; Unreal BuildCookRun needs `UNREAL_ENGINE_ROOT` and currently supports macOS/Linux hosts. No build tool provisions missing SDKs, licenses, export templates, or online services. REA is an independent optional MCP dependency that each user's coding agent must configure; Open Game's local REA connection is not inherited by other users. See [the reliability contract](reliability-contract.md) for the evidence required before calling a target dependable.
