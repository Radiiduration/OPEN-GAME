# Use Open Game with a coding LLM

Open Game is meant to travel with a coding agent. Use Studio to export an LLM build brief, then give it to a coding agent with the repository open. The brief includes the blueprint plus an implementation directive. The repo provides agent instructions, a project brief/character handoff, planning tools, and a bounded browser racing example; the coding agent supplies the model and writes the requested game. The example is not the generator. Other genres are implemented directly by the connected LLM in the fitting engine.

Generated projects now carry the creator skill and compact production playbooks with them. The playbooks give an agent concrete original system recipes for large systemic worlds and racing, a reference-led evidence-to-implementation workflow, and shared quality gates. They help an agent implement deeper connected systems; they do not insert an AAA game engine, production art pipeline, hosted multiplayer service, or trained game-specific model into the repo.

REA can add target-specific evidence when a creator provides an authorized artifact or runtime and the builder's LLM agent has REA MCP connected. Each creator must configure REA in their own agent; Open Game does not bundle REA or propagate this machine's connection. If REA or the target is unavailable, the agent should continue from public developer sources and creator observations, marking inferences and unknowns. See [REA's installation guide](https://github.com/morluto/rea/blob/main/docs/installation.md).

## Load the project

Open or attach this repository as the project in a coding agent. The root `AGENTS.md` explains when to use the creator workflow and points to `skills/open-game-creator/SKILL.md`.

If the agent supports project instructions but not skill discovery, give it both `AGENTS.md` and the skill file as project context. For personal reuse across projects, install or copy the `open-game-creator` skill using the workflow supported by that agent. Keep the skill file with the game project so future sessions can follow the same process.

## Give it a game vision

Give one complete brief describing what you want in your own words. Strong briefs include the player fantasy, genre blend, your characters and their roles, world/story details, important systems, tone, target platform, multiplayer needs, and what makes the game original. The initial prompt authorizes the full implementation and packaging workflow; you do not need to specify every technical detail or re-prompt between milestones.

Example:

> Create an original open-world motorsport game set across a chain of stormy coastal regions. I want responsive driving, deep vehicle tuning, a career with rival teams, changing weather, exploration, and events that can emerge while roaming. Start with a polished vertical slice and keep the whole career game as the destination. Use the engine already in this repository.

## What the agent should do

1. Inspect the existing repository and instructions, then call `inspect_game_toolchains` or run `open-game doctor` to discover available engines and build tools. Call `inspect_game_engine_project` to identify the actual project type. Confirm required SDKs, export modules, and engine setup separately; a detected executable is not proof of a working target.
2. Record the full vision, original identity, system connections, assumptions, and staged plan.
3. Choose an engine with a real build path and write the entire requested system set plus dependency order into the production plan.
4. Create or modify real, editable engine project files; implement a connected playable slice, then continue implementing the remaining requested systems and authored content.
5. Use the included browser adapter only when the requested game is actually a browser racing game. For every other request, do not pass the brief through that template: implement the appropriate source project directly in the selected engine.
6. Include the requested multiplayer package, authority/session model, reconnect behavior, and deployment setup.
7. Build, repair, package, and launch where tools allow. Keep `OPEN_GAME_STATUS.md` current so interrupted work resumes at the next unchecked criterion. State exactly what was verified and any concrete blocker.
8. Use MCP `update_game_progress` after real build/implementation milestones and `read_game_progress` before resuming. These tools save verified systems, commands, artifacts, blockers, and the next task into the project handoff.
9. Read `.agents/skills/open-game-creator/references/quality-and-build-gates.md` and the relevant genre playbook before implementation. When a commercial game is named as a reference, also follow `reference-led-game-reconstruction.md` and keep observations, inferences, and unknowns separate. Turn recipes into actual engine-native code and acceptance evidence; do not present guidance or pseudocode as a working system.
10. If an engine adapter exposes the shared operations in `agent-ready-engine-adapter-contract.md`, use them to inspect, build, launch, run deterministic scenarios, capture logs/screenshots/telemetry, profile the target, and package artifacts. If no adapter is implemented for that engine, use its supported tools directly and record the gap; do not claim the adapter operations exist. Record each result against its implementation obligation and use human play review for quality dimensions automated checks cannot judge.

## The coding agent's build loop

The connected LLM must do the implementation in the target game project; Open Game's planning tools do not compile arbitrary game ideas into source code. The creator's initial brief is authorization to carry out the whole requested build, not just to return a proposal. The agent should repeatedly:

1. Read the full brief, current project, engine conventions, and previous verified progress.
2. Turn the complete experience into connected systems with dependencies and player-visible acceptance checks.
3. Implement the next coherent playable increment in real engine files, preserving the full brief as the destination.
4. Build and launch it, exercise the relevant interactions, inspect failures, and repair them.
5. Continue with the remaining systems/content, including the requested multiplayer topology, rather than stopping at the first slice.
6. Package the requested source and playable target when the engine supports it, verify the artifact, and record exact evidence and blockers.

Routine design decisions should be made by the agent and documented; ask the creator only when a missing choice materially changes the result or a required external service, credential, or asset cannot be supplied. If the run must end before completion, record the exact next implementation task so another run can continue without losing the destination. A successful build is evidence of compilation, not proof that every requested system works or that the result is AAA quality.

This protocol can make a coding LLM's work more systematic and resumable. It cannot make a weak model, missing engine/toolchain, absent assets/services, or studio-scale scope disappear. Open Game should report the playable result and verified requirements, never infer a finished AAA game from a prompt or blueprint.

## What this workflow does not provide

The included racing adapter generates a browser playable multi-lap race with AI rivals, setup tradeoffs, career reputation saved locally, a packaged ZIP, and an optional server-authoritative room server. Initial native build operations support Godot exports, Unity project-owned build methods, and Unreal BuildCookRun on macOS/Linux. These are build adapters, not complete engine integrations: runtime scenarios, large open worlds, deep career content, production matchmaking, and secure public hosting require substantial further work. The repo does not bundle a language model or proprietary assets. One brief can start the whole agent workflow, but a major studio-scale game still needs extensive iteration, implementation, content creation, and refinement; report actual build evidence rather than implying the prompt alone produced production quality.

The workflow also cannot certify legal safety or guarantee protection from legal claims. Creators remain responsible for using original or properly licensed content.
