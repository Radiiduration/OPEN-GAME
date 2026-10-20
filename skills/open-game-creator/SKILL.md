---
name: open-game-creator
description: Turn an original game idea into a substantial, systems-rich playable project using the user's chosen engine. Use for game creation, expansion, worldbuilding, gameplay systems, missions, progression, and vertical slices. Do not use to reproduce a specific commercial game's protected creative content.
---

# Open Game Creator

Use this workflow when the user wants you to make or expand a game. They may describe a huge destination in a sentence. The intended outcome is a complete original game project that can be built into a downloadable, playable game—not only a pitch, blueprint, or prototype. Preserve that ambition, make sensible implementation choices, and create real, editable project files when the environment allows it.

## Core behavior

- Build an original game with depth, connected systems, and a clear player experience. Do not downgrade a large request to an unrelated toy example.
- Convert large scope into a sequence of cohesive, playable milestones. A vertical slice is the first checkpoint, never the default final deliverable when the user requested a complete game. Keep building the connected systems and content toward the full brief.
- Prefer complete system loops over disconnected content. Connect the world, player actions, missions, characters, and progression through explicit shared state.
- Work in the user's project and follow its existing engine, conventions, and instructions. If the project has no engine, choose one based on the desired platform and available tools, explain the choice briefly, and create an editable project scaffold.
- Make the original creative identity visible in names, world rules, characters, story, visual direction, and assets. Genre conventions and broad gameplay ideas can inspire the design.
- Be clear about what is implemented, what is planned, and what the current build can actually do. Never imply that an unbuilt system is playable. If the environment cannot support the requested complete build, explain the concrete blocker and leave the largest playable build the available tools can produce.

## One-prompt execution contract

Treat the creator's first brief as authorization to carry the project through implementation, packaging, and verification. Do not answer a build request with only a pitch, plan, starter template, or vertical slice. A single prompt is the input to the workflow; it does not remove the engineering work needed to deliver the game.

For work spanning multiple phases or context windows, maintain `OPEN_GAME_STATUS.md` in the game project. Record the full destination, chosen engine and target, implemented systems, build/run command, latest verified build, known blockers, and next concrete task. On resume, read it and continue at the next incomplete acceptance criterion instead of restarting or asking the creator to repeat the brief.

Use this completion loop until the requested deliverable is built or a concrete environment blocker prevents progress:

1. **Capture the destination.** Preserve the requested experience, target platforms, multiplayer expectations, and original identity in `GAME_BIBLE.md`. Convert named commercial references into broad genre qualities and original design choices.
2. **Choose a real target.** Inspect installed engines and export tools. Prefer an engine with a runnable local build path. Record the choice and unavailable SDKs. Do not silently substitute a browser mockup for a requested native or 3D game.
3. **Plan the whole game and next build.** Create `PRODUCTION_PLAN.md` with requested system families, dependencies, playable milestones, and acceptance criteria. The first milestone proves the core experience; later milestones stay tracked and are implemented in this run when tools and time permit.
4. **Implement integrated systems.** Build connected code and authored content in the actual engine project. A system is complete only when it participates in the playable loop and has a way to inspect or validate its state. Keep data editable and generated files distinct from creator-authored work.
5. **Build and repair.** Run available engine import/build/export commands. Fix errors, launch the game when possible, and verify essential controls and gameplay. Never report an unrun build as successful. If an engine is unavailable, still create the source project and state the precise missing dependency and next command.
6. **Package the deliverable.** Produce the requested downloadable build where the toolchain permits, plus source, controls, run instructions, save/config notes, and multiplayer deployment instructions when requested.
7. **Continue from evidence.** Compare the build with the plan, fix the highest-impact missing or broken criteria, and repeat. Do not stop merely because a vertical slice works. Stop when requested criteria are implemented and verified, or identify the concrete external blocker preventing the next step.

For multiplayer, document the topology, session/lobby flow, authority, replication, reconnect behavior, persistence, and deployment. Do not call a local shared-screen or LAN prototype production online multiplayer. For large worlds, use streaming or bounded simulation rather than one giant unoptimized scene. Use original or explicitly licensed generated art/audio and preserve provenance.

## Workflow

If the Open Game MCP server is connected, use its tools to create/read the blueprint, add systems, and order the first playable slice. Treat these outputs as the shared project contract, then implement the actual engine project in the user's workspace. If MCP is unavailable, do the same work directly in project files. Do not stop after creating the design scaffold.

## Available build adapter

The repository includes one working **browser racing adapter**. When a brief asks for original circuit racing/motorsport, create or update an Open Game blueprint, review originality signals, then use MCP `build_playable_game` or CLI `open-game build --project <project> --output <new-folder>` to generate an editable browser game and adjacent ZIP. The generated game includes AI rivals, setup tradeoffs, a local career profile, and an optional friend-hosted WebSocket room server. Continue from the generated files for requested systems the adapter does not include; do not treat its baseline as the full destination.

For any engine, once its export/build folder exists, use MCP `package_game_download` or CLI `open-game package --project <export-folder> --output <new-zip>` to create a portable ZIP. This only archives the existing output; it does not compile the engine project or certify that the game launches.

The adapter explicitly rejects briefs whose core experience is outside racing. For action adventure, role-playing, survival, or another genre, use the blueprint and skill as design scaffolding, then implement a matching engine/project in real editable files. Never package an unrelated race template and claim it represents the requested genre.

### 1. Inspect the build environment

Inspect the repository, project instructions, installed engine/toolchain, and existing game files. Reuse an existing project when possible. Identify the target platform and constraints that affect implementation. Do not overwrite an existing project or discard creator work.

### 2. Translate the vision into a game bible

Write down:

- The player fantasy and actions players repeat.
- Genre blend, tone, audience, target platform, and original identity.
- Core loop and important supporting loops.
- World rules, locations, characters, factions, and story direction as needed.
- The requested systems and how they affect each other.
- Scope risks, assumptions, and production stages.

Avoid questions whose answers can be inferred safely. Ask only when a missing choice would materially change the project or implementation. Otherwise state a reasonable assumption and proceed.

### 3. Preserve ambition and stage production

Keep the user's big-game destination in the project plan. Choose a vertical slice that proves its defining experience and exercises the most important connected systems. A slice might include one dense region, a polished traversal or vehicle loop, one authored activity, one world event, one character with reactive state, and one meaningful progression reward. After the slice is established, continue implementing the requested systems, playable content, and packaging steps; do not stop at planning the expansion.

Do not label the first slice as the full game. Document its expansions and dependencies so work can continue coherently. When the user requested a complete game, make progress through the full deliverable until the available environment, time, or external dependencies impose a real limit.

### 4. Implement a coherent playable slice

Create or modify actual engine project files. Prioritize the core loop, controls, camera, feedback, and game state before large volumes of content. Build systems as understandable modules with tunable data. Include placeholder art only when needed, and make it distinct and replaceable. Ensure the project has clear start and run instructions. When the engine and target platform support it, produce a packaged build users can download and play, and include the source project.

Add systems in an order suited to the game. A common order is player controls and camera, a representative world space, the signature activity, world and character reactions, progression and persistence, then expansion tools and additional content. If multiplayer is requested, treat it as a full system family: define authority and replication, player sessions/lobbies, server behavior, persistence, disconnect/rejoin, and a runnable multiplayer package or a precise implementation blocker. A local single-player prototype does not satisfy a multiplayer request.

For large requests, implement the highest-value coherent increment and keep going through the requested deliverable. Never claim the entire ambitious game has been completed when only a slice exists.

### 5. Keep design and implementation in sync

Keep a concise game bible or project blueprint in the game project. Record system responsibilities, shared state, current milestone, next milestone, and important design decisions. Prefer structured, editable data for missions, items, vehicles, dialogue, and world events when that fits the engine.

When modifying an existing game, preserve its established design and content unless the user asks for a change. Explain material tradeoffs and unfinished pieces in the final report.

## Originality and rights

Do not extract, copy, or redistribute proprietary game code, assets, maps, dialogue, audio, UI, characters, or story. Do not present an unofficial game as affiliated with a commercial franchise. If the user names a specific game as a reference, translate it into broad experience descriptors (for example, “technical circuit racing with a career progression loop”) and create distinct expression around those descriptors.

Track third-party asset and dependency provenance when adding them. Use original or properly licensed content. Similarity checks and disclaimers are not legal clearance and cannot guarantee that a game will avoid legal claims. For commercial or uncertain uses, recommend qualified legal advice without presenting that as a substitute for completing the creative work.

## Completion report

Report the project files and playable systems created, the downloadable build location if one was produced, how to open and run the game, which parts of the larger vision are implemented and which are next, and any constraints caused by unavailable engines, assets, or platform tools. Do not state that a build or test passed unless it was actually run.
