---
name: open-game-creator
description: Guide a coding agent to turn the creator’s original game brief and characters into a substantial game project in the appropriate engine, then build, package, verify, and continue implementation.
---

# Open Game Creator

Open Game is an agent toolkit, not a game template or a model. The connected coding LLM does the design and implementation. The creator’s brief is the source of truth: use their characters, setting, mechanics, platform, and multiplayer requirements. Build the game they described, with original expression and properly licensed materials.

## Production playbooks

Before designing, always read `quality-and-build-gates.md` and `agent-ready-engine-adapter-contract.md` from this skill's references (in the Open Game repo, these are under `docs/production-playbooks/` and `docs/`). Then read only the genre playbook(s) that match the brief: `open-world-action.md`, `racing-simulation.md`, and `multiplayer-networking.md`. Read `reference-led-game-reconstruction.md` and `docs/reverse-engineering/what-public-evidence-can-tell-us.md` only when a named reference needs analysis. Generated projects carry copies under `.agents/skills/open-game-creator/references/`; use those copies when working in a generated project. These are original engineering recipes grounded in public engine documentation and disclosed high-level features, not extracted commercial game source. Use the selected engine's supported systems when available, and mark unverified hand-built alternatives accurately.

If a creator names a commercial game as a reference, use it only to identify broad experience qualities. Follow `reference-led-game-reconstruction.md` and read `docs/reverse-engineering/what-public-evidence-can-tell-us.md` (or the generated project's corresponding references) for the evidence boundary. REA can analyze an authorized target binary/package/runtime when one is actually supplied and REA is connected; it cannot reveal absent proprietary binaries. Never claim that an inferred pattern is the target game's exact algorithm. Do not copy source code, data, assets, maps, characters, story, branding, or distinctive UI.

## Required behavior

- Treat the first complete brief as authorization to implement, build, package, and verify the game. Do not stop at a pitch, scaffold, roadmap, or vertical slice when the environment supports more work.
- Preserve the requested ambition. Convert broad scope into connected systems and production steps without replacing the request with a canned demo or unrelated sample.
- Honor user-provided characters and creative material as specified, while avoiding material that appears copied from a third-party franchise. User-provided content alone does not establish its rights status.
- Use genre references only to infer broad mechanics and experience qualities. Invent distinct names, characters, world, story, visual identity, UI, sound, and assets; never claim this makes a project lawsuit-proof.
- Work inside the creator’s chosen game project. Inspect existing files, project instructions, and installed toolchains first. Do not overwrite creator work.
- Choose an engine and target that fit the requested experience and can be built in the current environment. Do not silently turn a requested 3D/native game into a browser toy.

## End-to-end workflow

1. **Capture the whole brief.** Preserve the original prompt verbatim in `GAME_BRIEF.md` when available. Keep its player experience, characters, world, target platform, controls, content, accessibility, save, and multiplayer expectations reflected in `docs/GAME_DESIGN.md`. Keep assumptions visible; ask only if an unresolved choice changes the game materially.
2. **Build the evidence-to-obligation chain.** If the creator names a reference, keep observations, inferences, and unknowns in `docs/REFERENCE_STUDY.md`; use REA only when its tools are connected and the target is authorized. Convert the brief and any supported findings into original, testable entries in `docs/IMPLEMENTATION_OBLIGATIONS.json`. Every required system and quality gate needs an owner, acceptance criteria, dependencies, and verification method before implementation. If no target is available, continue with public primary sources and label the evidence limits.
3. **Design the complete game.** Write `docs/MILESTONES.md` with the connected gameplay loops, system responsibilities and dependencies, content needed, milestones, and concrete acceptance criteria. Keep the complete requested destination visible beyond the first playable checkpoint.
4. **Inspect, provision, and select the implementation target.** Check the existing project and call MCP `inspect_game_toolchains` (or run `open-game doctor`) to identify available engines and build tools. Then check SDKs, export modules, and asset tools; detection alone does not prove they are usable. If a suitable free/open-source engine or tool can be installed non-interactively with the current host's supported package manager and network, provision it and verify its version before declaring the environment blocked. Respect existing setup, platform limits, licensing, and disk availability; do not silently switch engine or install paid/interactive software. Record the selected engine, target, run/build commands, and concrete missing dependencies or required user action.
5. **Implement actual game files.** Create or extend real engine scenes, scripts, data, UI, levels, and original content. Connect movement/combat/driving/activity loops to characters, world state, progression, saves, and feedback as relevant. Build coherent systems, not disconnected menu mockups. Use data-driven content where it makes iteration easier.
6. **Create the game's art and sound pipeline.** Check which image, audio, modeling, and engine tools are actually available. Use creator-supplied assets only when authorized, generate distinct assets with available tools, and create procedural engine-native materials/geometry/audio when that fits. Build a coherent art direction and asset import pipeline; do not leave primitive placeholders as the final answer when the brief calls for finished presentation. Record sources, licenses, and generated provenance.
7. **Implement multiplayer when requested.** Define client/server authority, player sessions and lobbies, replication, persistence, reconnect/disconnect behavior, deployment, and security boundaries. Implement and run the requested topology where tools permit. Label local prototypes accurately; never call LAN play production online multiplayer. Do not claim hosted services are provisioned when credentials, infrastructure, or user configuration are unavailable.
8. **Build, launch, repair, profile, and package.** Run available engine imports, builds, exports, and launch checks. Repair failures and compare actual behavior against acceptance criteria. Profile performance at the scale requested and address high-impact bottlenecks. Package the requested downloadable target plus editable source and practical run/deployment instructions. `open-game package` can ZIP an existing export; it does not compile or verify it.
9. **Continue past the first milestone.** A vertical slice is evidence and a checkpoint, not completion. Continue implementing the planned systems and content in this task until the requested deliverable is complete or a specific missing SDK, service, asset, or environment capability prevents further work.
10. **Maintain resumable evidence.** Call `update_game_progress` after implementation/build milestones with the chosen engine/target, completed systems, exact verification commands and results, artifact paths, blockers, and next concrete task. Call `read_game_progress` before resuming and continue from the first unmet acceptance criterion. These tools update `open-game-progress.json` and `OPEN_GAME_STATUS.md` together. Never record a planned or unrun check as successful.

## Agent execution protocol

The connected coding LLM is the implementer. Do not treat Open Game's blueprint, planning tools, or this skill as if they generated the game. For a game-creation request, perform the following loop in the actual game project:

1. **Start work, not just a plan.** Read the full brief and project instructions; inspect the existing source, engine, assets, and status. Make a short list of the next concrete files/systems to implement, then edit them in the same task. A roadmap is never the deliverable when implementation is possible.
2. **Turn ambition into a system graph.** Identify the player verbs, moment-to-moment loop, world/game-state model, progression, content, UI, saving, and online services requested. For each system specify its owned state, inputs/outputs, dependencies, and a player-visible acceptance check. Connect systems through real shared data and events rather than creating isolated menu screens or mock features.
3. **Choose from the repository and environment.** Prefer an existing engine project and its conventions. If none exists, choose a fitting engine after checking the host and target requirements. Provision suitable free/open-source tools when they can be safely installed without interactive setup; do not silently switch engine or install paid/licensed software. Keep a native/3D request native/3D; do not substitute a browser demo. When a required SDK, export template, license, credential, or service cannot be provisioned, build everything independent of it and record the exact blocked step and the action needed to unblock it.
4. **Implement in dependency order, in vertical playable increments.** First make the defining action playable with real controls, camera, feedback, restart/recovery, and a test space. Then continue into the planned systems and content. Every increment should be runnable and connected to prior work. A first slice is a quality gate, not an excuse to stop. Never leave a system represented only by a TODO, placeholder button, static mockup, or plan while reporting it as implemented.
5. **Use the tools available to make real assets.** Inspect available generators and engine import/model/audio tools. Create or source assets with clear provenance; use procedural assets only when they meet the brief's quality needs. Do not invent unavailable assets or claim art/audio is finished when it is placeholder material.
6. **Build and observe after meaningful changes.** Run the project's actual formatter/import/build/launch commands when available. Exercise the core loop and each completed system; inspect logs/screenshots or automated results, fix failures, and repeat. Add or update focused checks when they are needed to verify behavior. Never infer success from source files existing or a ZIP being created.
7. **Treat online play as a complete system.** If requested, implement the stated topology: server authority where appropriate, session/lobby flow, replication, validation, disconnect/reconnect behavior, persistence, and deployment configuration. Verify with multiple local clients when possible. Label prototypes and unprovisioned hosting honestly; a local WebSocket demo is not production matchmaking.
8. **Keep the full destination alive.** Compare the playable project against the complete brief and acceptance list after each increment. Work through the highest-dependency unmet items; do not optimize only the first five minutes of play. Make reasonable implementation decisions without asking the creator about routine details. Ask only when a missing choice materially changes the game or an external credential/service/asset is required.
9. **Resume cleanly when a run ends.** Before stopping, update `OPEN_GAME_STATUS.md` and the progress record with exact files/systems changed, commands and observed outcomes, artifact paths, unresolved blockers, and one immediately actionable next task. On a later run, read these records and inspect the working tree before continuing; do not regenerate or overwrite completed work.
10. **Report evidence and scope accurately.** State what is actually playable, what targets were built, how to launch the game, which multiplayer behavior was exercised, and which requirements remain incomplete. Do not call a game AAA or production-ready based on ambition, visual mockups, or a successful compile alone.

### Implementation quality bar

- Prefer complete, data-driven gameplay systems over large volumes of disconnected generated code.
- A quality claim must point to the target device, measured profile, playable scenarios, asset provenance, and human review that support it. A detailed plan or green compile alone does not establish the player's experience.
- Keep game rules separate from presentation where the engine permits; centralize tunable values and authored content so the creator can change them.
- Handle failure states, invalid input, save compatibility, loading, accessibility settings, and performance costs that matter to the requested target.
- Preserve creator-authored source and assets. Make focused edits, use version control diffs, and avoid destructive rewrites.
- When context or time is limited, finish and verify the current coherent increment, then leave a precise continuation record. Do not claim that this limitation makes the remaining game complete.

## Open Game tools

Use MCP tools as project memory and structured operations, not as a substitute for coding:

- `inspect_game_toolchains` reports installed engine/build executables before target selection.
- `inspect_game_engine_project` finds engine project markers; `build_game_engine_project` runs a Godot export, Unity batch build, or Unreal BuildCookRun on supported hosts; `launch_game_artifact` starts a packaged executable or opens a macOS app bundle; `run_game_engine_scenario` runs a project-owned Godot/Unity scenario. The agent must author meaningful assertions, observe the runtime, and record the result against the matching implementation obligation.
- `create_game_project` records an original game brief as a project scaffold. Immediately continue with real game implementation in the connected coding environment.
- `add_game_system` and `plan_game_vertical_slice` keep connected systems and their production order visible.
- `read_game_blueprint` resumes the project from its saved contract.
- `read_game_progress` retrieves the last verified build state and concrete next task.
- `update_game_progress` persists real implementation and verification evidence across long runs.
- `read_game_obligations` retrieves the project-specific system and quality gates; `review_game_obligations` checks ledger consistency and evidence fields only, not the game itself.
- `build_playable_game` builds only the included bounded browser racing example. Use it only when that is actually the requested game; it is not a universal genre generator.
- `package_game_download` archives an already exported project; it does not compile it.
- If MCP is unavailable, create and update the same project files directly.

## Originality and provenance

Do not extract, copy, or redistribute proprietary code, art, maps, dialogue, audio, UI, characters, or story. Record sources and licenses for third-party dependencies and assets in `assets/ASSET_LEDGER.csv`. Similarity scans and disclaimers are not legal clearance and cannot guarantee that no claim will be made. For commercial releases or uncertain rights, recommend qualified legal advice.

## Completion report

State which real systems and content were implemented, chosen engine and target, exact build/run verification performed, downloadable artifact and source locations, multiplayer status if requested, and concrete remaining blockers. Do not state that an unrun build works or that an unfinished game is complete.
