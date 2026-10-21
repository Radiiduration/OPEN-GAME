# Install and connect Open Game

Open Game is a CLI, browser-based Blueprint Studio, agent skill, and local MCP server. The coding LLM comes from the coding agent you choose; Open Game does not include or call a model by itself.

## Requirements

- Git
- Node.js 20 or newer
- A coding agent that can use local files; MCP support is optional
- A game engine and its export tools only when your game requires them

## Install the CLI from GitHub

The repository exposes the `open-game` executable through its npm package metadata. Install the current repository version globally:

```sh
npm install --global git+https://github.com/Radiiduration/OPEN-GAME.git#master
```

Check the available toolchain, then start the local Blueprint Studio:

```sh
open-game doctor
open-game studio
```

The Studio prints its local URL, normally `http://127.0.0.1:4173`.

The hosted Open Game site links to a browser version of the Studio at `/studio` on Vercel. The CLI Studio remains local and does not send the brief to an Open Game server. See the [privacy notice](privacy.html) for browser storage and provider details.

To work from a local checkout instead:

```sh
git clone https://github.com/Radiiduration/OPEN-GAME.git
cd OPEN-GAME
npm install
npm link
open-game doctor
```

## Give the agent the workflow

Open the repository in your coding agent, describe the original game you want, and export the Studio's **LLM build brief**. Give that brief to the agent. It directs the agent to read `AGENTS.md` and `skills/open-game-creator/SKILL.md`, inspect the actual project and installed toolchain, implement the brief in engine files, build and run it, fix observed failures, and record verified progress and remaining work.

You can also copy this into an agent that supports the Open Game Creator skill:

```text
Use the Open Game Creator workflow in this repository. Preserve my full original game brief. Inspect the current project and available toolchain, implement the game in real editable engine files, build and launch it, exercise the implemented behavior, fix failures you observe, and continue through the requested systems while implementation is possible. Package a playable build if the configured engine supports it. Record exact evidence, remaining acceptance criteria, and the next task. Do not report planned work as verified.
```

## Connect the local MCP server

The CLI and MCP expose the same project capabilities. Add this server entry to the MCP configuration used by your agent:

```json
{
  "mcpServers": {
    "open-game": {
      "command": "open-game",
      "args": ["mcp"],
      "env": {
        "OPEN_GAME_WORKSPACE": "/absolute/path/to/game-projects"
      }
    }
  }
}
```

Create the workspace directory first, replace the example path with its absolute path, save the agent configuration, and restart or reconnect the agent. For Unreal BuildCookRun, configure `UNREAL_ENGINE_ROOT` in the same `env` map. See the [full MCP setup guide](mcp-setup.md) for tool details and limits.

The MCP server confines project creation and packaging to `OPEN_GAME_WORKSPACE`. It does not provision engines, cloud services, model accounts, multiplayer hosting, or export licenses.

**Security:** Engine build, scenario, and launch actions execute project code. Review a project before allowing execution; the tools require an explicit `--allow-project-code-execution` CLI flag or `allow_project_code_execution: true` MCP field. That flag is an acknowledgement, not a sandbox. For untrusted projects, use an isolated VM/container with no secrets and restricted network access. See [SECURITY.md](../SECURITY.md).

## Preview this website locally

From the repository root:

```sh
npm install
npm run website
```

Open `http://127.0.0.1:4174`. This static website is in `docs/` so it can also be published with GitHub Pages.

## Build a distributable CLI tarball

From the repository root:

```sh
npm install
npm run package:release
```

This creates `dist/open-game-0.2.0.tgz` using npm's package manifest. Review that archive before attaching it to a tagged GitHub release. A versioned npm registry package is not published by this command.

## Engine support and honest limits

Open Game has initial project inspection/build operations for Godot, Unity, and Unreal, plus project-owned scenario execution for Godot and Unity. These lanes have different requirements; inspect the current [reliability contract](reliability-contract.md) before selecting a release target. A successful build only proves that the requested build command produced an artifact. The connected agent must still run and review the game.

No prompt, package, similarity scan, or workflow guarantees studio-scale AAA output or legal immunity. Create original content or use material with appropriate licenses.
