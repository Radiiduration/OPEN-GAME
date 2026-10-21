# How Open Game works

Open Game is designed to work inside a coding agent such as Codex, Claude Code, Cursor, or another tool-enabled LLM. The creator describes an original game; the coding agent uses Open Game's instructions and project tools, writes the game in editable source files, then builds, checks, and packages it with the available engine.

## The whole mechanism

```text
Creator describes a game
        │
        ├── Open Game Studio → JSON blueprint or LLM build brief
        │
        └── Direct prompt in a coding agent
                         │
                         ▼
              Coding agent reads AGENTS.md + Creator skill
                         │
            ┌────────────┴─────────────┐
            ▼                          ▼
    MCP tools / CLI              Agent's coding tools
    project state, plan,          inspect and edit source,
    toolchain, progress           run engine/build commands
            └────────────┬─────────────┘
                         ▼
       Editable game project in selected engine
                         │
       build → launch → play checks → repair
                         │
                         ▼
         source + playable platform artifact
         + optional multiplayer server package
```

The coding LLM is the builder. Open Game gives it a durable project contract, a workflow, and tools for recording and resuming work. The user's coding agent provides the model and filesystem/terminal access. The game engine and its SDKs provide compilation/export. There is no Open Game model API call that independently turns an arbitrary prompt into a finished game.

For named references, the agent keeps target observations and their limitations in `docs/REFERENCE_STUDY.md`, then maps player-facing qualities into original, owned, testable obligations in `docs/IMPLEMENTATION_OBLIGATIONS.json`. REA can supply target-specific evidence when it is connected in that user's agent and an authorized target is available. It does not author the game or certify the result. See the [reference-led workflow](production-playbooks/reference-led-game-reconstruction.md) and [engine adapter contract](agent-ready-engine-adapter-contract.md).

## What happens at each stage

### 1. The creator supplies the brief

The creator describes the player experience, genre, original characters and world, target platform, requested systems, and multiplayer needs. A named commercial game can be used to communicate broad genre qualities, but the project should develop distinct characters, setting, story, art direction, names, audio, interface, and assets.

The Studio currently exports either a structured JSON blueprint or an LLM build brief containing that blueprint and implementation instructions. Alternatively, the creator can give the brief directly to a coding agent with this repository open.

### 2. The coding agent loads the workflow

The root `AGENTS.md` directs a coding agent to `skills/open-game-creator/SKILL.md`. That skill tells the agent to inspect the game project and available toolchains, preserve creator work, map the requested experience into connected systems, implement real engine files, build and exercise increments, repair failures, and continue through the full request. Generated game projects receive their own copy of the skill and an `AGENTS.md` handoff so another agent can resume later.

Instructions guide the agent; they do not force a model to follow them or add capabilities that its host environment lacks.

### 3. MCP and CLI manage project state

Open Game exposes shared core operations through an MCP server and CLI. MCP lets the connected agent call the operations as tools. CLI lets a developer use the same operations in a terminal. Both operate on the same blueprint/project functions rather than implementing separate game logic.

The current MCP operations are:

- `inspect_game_toolchains` — detect engine and build executables on PATH.
- `inspect_game_engine_project` — locate Godot, Unity, and Unreal project markers.
- `build_game_engine_project` — export Godot through a configured preset, run a Unity project-owned batch build method, or call Unreal BuildCookRun when the engine root is configured on macOS/Linux.
- `launch_game_artifact` — start the packaged executable or open a macOS app bundle; the coding agent still needs to observe and exercise it.
- `run_game_engine_scenario` — execute a project-owned Godot runner or Unity static method for a named scenario and return its result/log; Unreal uses its native automation framework directly.
- `create_game_project` — write the original brief, blueprint, design and production documents, skill copy, asset ledger, and initial progress handoff.
- `add_game_system` — add a system and its dependencies to a project contract.
- `plan_game_vertical_slice` — order systems by declared dependencies and produce slice criteria plus a larger roadmap.
- `read_game_blueprint` — reload the normalized game contract.
- `read_game_progress` and `update_game_progress` — resume or record actual implementation, build evidence, artifacts, blockers, and next task.
- `read_game_obligations` and `review_game_obligations` — load the game-specific obligations and check their ledger consistency; these do not execute scenarios or independently verify results.
- `review_game_originality` — flag a small set of known franchise words in selected blueprint text for human review; it is not a legal review.
- `build_playable_game` — build the included browser racing example only.
- `package_game_download` — ZIP an existing project/export folder; it does not compile that folder.

The CLI offers project, plan, inspect, originality review, obligation review, engine inspection/build/launch, build-example, package, toolchain-check, and multiplayer-server commands. Paths used for project writes are restricted to the configured workspace.

### 4. The coding agent implements the actual game

After reading the brief and the project state, the coding agent selects a suitable engine based on the current project, target requirements, and installed tools. It creates or edits real scenes, scripts, gameplay data, UI, levels, and other source assets in the game project. The systems should share explicit game state—for example, an activity can change a relationship or career state, which affects later content and progression.

The agent should work in playable increments: establish the defining action, camera, controls, and feedback; connect the other requested systems; add content; then exercise and refine them. The first playable slice is a checkpoint, not completion. The creator's full destination remains in `GAME_BRIEF.md` and the design/production documents.

If multiplayer is requested, the coding agent must implement the actual topology needed by the brief: client/server roles, sessions, replication, validation, reconnect behavior, persistence, and deployment setup as applicable. Open Game's built-in racing server is a limited friends/LAN example, not a general multiplayer backend.

### 5. The engine builds the game

The coding agent runs the chosen engine's import, validation, build, and export commands. It launches the result and checks important player-facing behavior against acceptance criteria. It fixes observed errors and repeats the checks. `open-game doctor` can report executable availability, but it cannot prove export templates, SDKs, licenses, assets, or credentials are ready.

When a dependency or external service is unavailable, the agent should implement independent work and record the exact blocked requirement. It must not report a planned build or untested feature as successful.

### 6. The project is packaged and resumed

The coding agent packages the engine's exported folder for the requested platform. The Open Game ZIP packager can archive existing files, but does not create the engine export. The agent records source and artifact paths, exact verification performed, remaining acceptance criteria, and the next concrete task in `OPEN_GAME_STATUS.md` and `open-game-progress.json`. On a future run, it reads those files and continues from the first unmet criterion.

## One-prompt user flow

1. Open the Open Game repository in a coding agent that can read and write files and run terminal commands.
2. Use Studio to describe the game and export the LLM build brief, or provide the brief directly in the agent.
3. Ask the agent to implement the brief in this repository, and let it inspect available engines and tools.
4. Review playable builds as the agent implements the connected systems; it should keep working beyond the first slice while the environment and task session permit.
5. Download the produced build and source when the chosen engine has successfully exported them.

Example:

> Build an original motorsport career game from the attached Open Game brief. Keep its original cast and setting. Implement the driving loop, vehicle setup, AI rivals, championship progression, saves, weather, and online co-op described there. Inspect this project and the installed engines first. Work in real engine files, run and repair the game, package the target that this environment supports, and record exact verification and remaining work. Continue after the first playable slice.

“One prompt” means one brief starts the coding agent's end-to-end task. It does not mean that a single prompt or build can replace all the content, art, engineering, servers, testing, and iteration of a studio-scale release.

## What exists today versus the destination

| Capability | Current state |
| --- | --- |
| Brief capture and JSON/LLM handoff | Implemented in the browser Studio |
| Project blueprint, design docs, system plan, reference-study ledger, implementation obligations, and resumable progress | Implemented in shared Node core; obligation ledger can be read/reviewed via CLI and MCP |
| LLM writing arbitrary game code | Performed by the connected coding agent following the skill |
| Included generated playable game | One bounded browser racing example |
| Build verification for arbitrary game engines | Not implemented as a verified Open Game adapter; the agent must run the engine's own tools |
| Generic ZIP packaging | Implemented for an existing export; it does not compile the game |
| Production multiplayer hosting | Not included |
| Finished AAA output from one prompt | Not guaranteed or present today |

The architecture's intended future layers are dedicated engine adapters, asset/content workflows, multiplayer adapters, and repeatable build/play gates for supported engine/platform lanes. Each lane should be called reliable only after clean-build, launch, core-play verification, and packaging have been repeated in a documented environment.

## Originality and legal boundaries

Open Game can teach creators to start from broad player experience and make original expression. Its current text scan is narrow and can miss risky content or flag harmless references. No tool or workflow can guarantee that a project will not receive a legal claim. Creators need rights to their characters and assets, should record licenses, and should seek qualified legal advice for commercial or uncertain use.

## REA's workflow as a reference

REA documents a pattern where the agent calls REA through MCP, receives findings with evidence, then uses those results to ask follow-up questions or implement and test a feature. Its CLI shares those workflows. Open Game follows the same high-level agent + MCP + CLI + skill shape for game production, but the current Open Game tools mostly manage game project state; the coding agent and its selected engine create the arbitrary game. See the [REA repository workflow](https://github.com/morluto/rea#how-rea-works) and [README](https://github.com/morluto/rea/blob/main/README.md).

PhotoCraft documents a separate but relevant pattern: a shared command registry used by its UI, CLI, JSON control channel, and MCP, plus corpus-based format/render comparisons. Open Game's game-specific equivalent is the [agent-ready engine adapter contract](agent-ready-engine-adapter-contract.md). PhotoCraft's source describes its clean-room implementation and test approach; that README alone does not establish that REA was used to build it. See [PhotoCraft's README](https://github.com/storytold/photocraft).
