---
name: open-game-creator
description: Guide a coding agent to turn the creator’s original game brief and characters into a substantial game project in the appropriate engine, then build, package, verify, and continue implementation.
---

# Open Game Creator

Open Game is an agent toolkit, not a game template or a model. The connected coding LLM does the design and implementation. The creator’s brief is the source of truth: use their characters, setting, mechanics, platform, and multiplayer requirements. Build the game they described, with original expression and properly licensed materials.

## Required behavior

- Treat the first complete brief as authorization to implement, build, package, and verify the game. Do not stop at a pitch, scaffold, roadmap, or vertical slice when the environment supports more work.
- Preserve the requested ambition. Convert broad scope into connected systems and production steps without replacing the request with a canned demo or unrelated sample.
- Honor user-provided characters and creative material as specified, while avoiding material that appears copied from a third-party franchise. User-provided content alone does not establish its rights status.
- Use genre references only to infer broad mechanics and experience qualities. Invent distinct names, characters, world, story, visual identity, UI, sound, and assets; never claim this makes a project lawsuit-proof.
- Work inside the creator’s chosen game project. Inspect existing files, project instructions, and installed toolchains first. Do not overwrite creator work.
- Choose an engine and target that fit the requested experience and can be built in the current environment. Do not silently turn a requested 3D/native game into a browser toy.

## End-to-end workflow

1. **Capture the whole brief.** Preserve the exact destination, player experience, original character descriptions, world, target platform, controls, content, accessibility, save, and multiplayer expectations in `GAME_BIBLE.md`. Keep assumptions visible; ask only if an unresolved choice changes the game materially.
2. **Design the complete game.** Write `PRODUCTION_PLAN.md` with the connected gameplay loops, system responsibilities and dependencies, content needed, milestones, and concrete acceptance criteria. Keep the complete requested destination visible beyond the first playable checkpoint.
3. **Inspect and select the implementation target.** Check the existing project, available engines, SDKs, build/export tools, and asset pipeline. Record the selected engine, target, run/build commands, and concrete missing dependencies.
4. **Implement actual game files.** Create or extend real engine scenes, scripts, data, UI, levels, and original content. Connect movement/combat/driving/activity loops to characters, world state, progression, saves, and feedback as relevant. Build coherent systems, not disconnected menu mockups. Use data-driven content where it makes iteration easier.
5. **Implement multiplayer when requested.** Define client/server authority, player sessions and lobbies, replication, persistence, reconnect/disconnect behavior, deployment, and security boundaries. Implement and run the requested topology where tools permit. Label local prototypes accurately; never call LAN play production online multiplayer.
6. **Build, launch, repair, and package.** Run available engine imports, builds, exports, and launch checks. Repair failures and compare actual behavior against acceptance criteria. Package the requested downloadable target plus editable source and practical run/deployment instructions. `open-game package` can ZIP an existing export; it does not compile or verify it.
7. **Continue past the first milestone.** A vertical slice is evidence and a checkpoint, not completion. Continue implementing the planned systems and content in this task until the requested deliverable is complete or a specific missing SDK, service, asset, or environment capability prevents further work.
8. **Maintain resumable evidence.** Keep `OPEN_GAME_STATUS.md` current with the creator’s destination, chosen engine/target, completed systems, exact verification commands and results, artifact path, blockers, and next concrete task. On resume, continue from the first unmet acceptance criterion.

## Open Game tools

Use MCP tools as project memory and structured operations, not as a substitute for coding:

- `create_game_project` records an original game brief as a project scaffold. Immediately continue with real game implementation in the connected coding environment.
- `add_game_system` and `plan_game_vertical_slice` keep connected systems and their production order visible.
- `read_game_blueprint` resumes the project from its saved contract.
- `build_playable_game` builds only the included bounded browser racing example. Use it only when that is actually the requested game; it is not a universal genre generator.
- `package_game_download` archives an already exported project; it does not compile it.
- If MCP is unavailable, create and update the same project files directly.

## Originality and provenance

Do not extract, copy, or redistribute proprietary code, art, maps, dialogue, audio, UI, characters, or story. Record sources and licenses for third-party dependencies and assets in `assets/ASSET_LEDGER.csv`. Similarity scans and disclaimers are not legal clearance and cannot guarantee that no claim will be made. For commercial releases or uncertain rights, recommend qualified legal advice.

## Completion report

State which real systems and content were implemented, chosen engine and target, exact build/run verification performed, downloadable artifact and source locations, multiplayer status if requested, and concrete remaining blockers. Do not state that an unrun build works or that an unfinished game is complete.
