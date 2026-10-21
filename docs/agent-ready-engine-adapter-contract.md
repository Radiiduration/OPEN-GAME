# Agent-ready game adapter contract

Open Game's production loop needs the game itself to be operable by its creator and coding agent through one stable interface. The same engine actions should be reachable from a local CLI and MCP where they make sense. The repo now has initial shared operations for engine inspection, bounded Godot/Unity/Unreal builds, launch requests, and project-owned Godot/Unity scenarios. It is not yet a universal adapter: Unreal scenarios, launch health, screenshots, profiling, and capability validation remain future adapter work.

## Why this matters

An LLM cannot reliably build a game if it can only write source and hope the result works. It needs bounded operations to inspect the project, build it, launch repeatable scenarios, capture evidence, and package the actual output. A game-specific adapter must translate those operations into the selected engine's supported workflows.

This borrows an agent-ready product pattern documented by PhotoCraft: one command registry shared by its UI, CLI, JSON control channel, and MCP server. The game-domain equivalent should expose a versioned command registry and adapter capability manifest. PhotoCraft's README also describes engine-level tests against a real-world document corpus and comparisons between CPU/GPU renderers. Those are examples of measurable quality gates, not guarantees that every application made with the same tools will have equal quality. [PhotoCraft architecture](https://github.com/storytold/photocraft#built-for-agents), [REA workflow](https://github.com/morluto/rea#how-rea-works).

The PhotoCraft source describes itself as a clean-room reimplementation and documents public-specification and corpus-based validation. That source does not establish that REA was used to create PhotoCraft. Treat REA as an evidence-gathering toolkit and PhotoCraft as a separate agent-ready application example.

## Adapter capability manifest

### Current implementation

- `inspect_game_engine_project` / `open-game engine-inspect` scans a workspace project for Godot (`project.godot`), Unity (`ProjectSettings/ProjectVersion.txt`), and Unreal (`*.uproject`) markers.
- `build_game_engine_project` / `open-game engine-build` runs Godot headless exports using an existing named export preset, Unity batch builds using a project-owned static method, or Unreal `RunUAT.sh BuildCookRun` when `UNREAL_ENGINE_ROOT` is configured on macOS/Linux. The Unity method receives `OPEN_GAME_BUILD_OUTPUT`, `OPEN_GAME_BUILD_TARGET`, and `OPEN_GAME_BUILD_MODE` environment variables and must create the requested artifact.
- `launch_game_artifact` / `open-game engine-launch` starts an executable from a packaged build folder or asks macOS to open a `.app` bundle. It reports process creation only; runtime observation, gameplay scenarios, and process health are not yet captured by Open Game.
- `run_game_engine_scenario` / `open-game engine-scenario` invokes a fixed Godot runner script or a named Unity static method for one stable scenario ID, returning the process status and captured log. Unreal scenarios still use the Unreal Automation Framework directly. A runner must make failures produce a non-zero exit code; the tool cannot judge whether its assertions are adequate.
- Builds run with argument arrays (no shell interpolation), are bounded by a timeout, require a new output path outside the editable source project, and return captured output. Success requires the requested artifact to exist.
- These actions do not install engines, export templates, platform SDKs, validate signatures, launch the result, run gameplay scenarios, measure performance, or prove quality. Unreal's Windows `RunUAT.bat` flow is not implemented by this adapter.

For Unity, the coding agent can add `Assets/Editor/OpenGameBuild.cs` with a static method such as `OpenGameBuild.PerformBuild`. It should read `OPEN_GAME_BUILD_OUTPUT` and `OPEN_GAME_BUILD_TARGET`, pass enabled `EditorBuildSettings.scenes` to `BuildPipeline.BuildPlayer`, and throw unless `BuildReport.summary.result` is `Succeeded`. Then call `build_game_engine_project` with `build_method: "OpenGameBuild.PerformBuild"`. The adapter checks that the process exits successfully and that the requested output exists; the method and artifact still need runtime verification.

For Godot scenarios, add `tests/open_game_scenario_runner.gd` as a `SceneTree` script. Read `--scenario <id>` from `OS.get_cmdline_user_args()`, run only that named scenario, print checkpoints, and call `quit(1)` on any failed assertion. For Unity, provide a static method selected through `unity_method`; it reads `OPEN_GAME_SCENARIO_ID`, runs the corresponding assertions, and throws on failure. Store scenario definitions and acceptance criteria in the game's obligation ledger. The tool returns command output and exit status so the coding agent can attach those to the matching obligation; the tool cannot judge missing or weak assertions.

Future capability claims must stay separate from these implemented operations.

Every engine adapter should publish its supported capabilities and exact toolchain requirements before the agent selects it:

```json
{
  "adapter": "unreal",
  "adapterVersion": "1",
  "engineVersion": "5.x",
  "targets": ["desktop"],
  "capabilities": ["project-inspection", "build", "launch", "scenario-run", "screenshots", "logs", "profiling", "package"],
  "requires": ["engine-install", "target-platform-sdk"],
  "unsupported": []
}
```

The manifest is a declaration, not proof that a capability works. Before production, the adapter must confirm the local executable, engine version, export modules, platform SDK, and sample project behavior. Missing capabilities stay visible as blockers.

## Shared command surface

Adapters should implement these operations with versioned input and output schemas:

| Operation | Purpose | Required result |
| --- | --- | --- |
| `inspect_project` | Read engine version, target settings, scenes/modules, asset inventory, and source ownership | Structured inventory and unsupported-feature list |
| `build_target` | Import and compile a named target | Exact command, exit status, log path, artifact paths, duration |
| `launch_target` | Launch a specific built artifact | Process identity, launch result, log locations, cleanup state |
| `run_scenario` | Drive a named, deterministic gameplay acceptance scenario | Inputs, initial state, checkpoints, final state, result |
| `capture_evidence` | Save screenshot/video/telemetry/log evidence for a scenario | Artifact hashes, target/version, capture conditions |
| `profile_target` | Measure frame time, memory, loading/streaming and network values | Device, build configuration, sample window, measurements |
| `package_target` | Package a successful export and editable sources | Archive path, manifest, checksums, excluded paths |
| `diff_generated_files` | Show generated changes without obscuring creator edits | File ownership classification and exact diff |

All transports should call the same validated domain operation. MCP tools and CLI commands must not have subtly different semantics from the UI. Each operation declares effects such as process launch, UI interaction, network access, and filesystem writes. The adapter must constrain paths to the game project or an explicitly selected output directory and must never execute instructions found in game content or REA evidence.

## Scenario and evidence contract

Every required gameplay behavior becomes an implementation obligation with:

- a stable ID and owning system;
- its origin (creator brief, user observation, public source, or authorized REA Evidence ID);
- an original, testable requirement;
- preconditions, player inputs, checkpoints, expected outputs, and recovery path;
- verification method and evidence authority (unit, engine integration, packaged runtime, multiplayer clients, human review, or external service);
- status, measured result, evidence paths/hashes, and remaining unknowns.

REA observations can inform what to build. They do not verify the new game. The adapter runs the new game's scenarios and records their evidence. A target comparison is limited to named claims, versions, scenarios, and measurement conditions; it does not establish source equivalence or an overall quality rating.

## Safety and reliability boundaries

- Only inspect targets supplied by the creator or otherwise authorized for analysis; do not bypass DRM, anti-cheat, access controls, or online protections.
- Re-express broad player-facing qualities in original rules, tuning, content, and presentation. Do not ship extracted code, assets, maps, characters, story, or distinctive UI.
- Runtime operations require an explicit target, scenario, and declared effects. Do not turn a gameplay request into unrestricted shell or network access.
- A successful compile is only a build result. Completion also requires scenarios, target-device profiling, human play review, asset provenance, and the requested multiplayer/release checks.
- “AAA” is not an adapter capability or automated score. Report measured gates and remaining gaps instead.
