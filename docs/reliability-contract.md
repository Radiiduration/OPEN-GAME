# Open Game reliability contract

Open Game should offer breadth through the connected coding agent and reliability through explicit, verified engine/target lanes. A natural-language brief is not proof that a game was generated.

## What counts as a dependable build

For every engine and platform Open Game claims to support, the repository must be able to:

1. Preserve the creator's complete brief and original character/world details in the project.
2. Create or update a real engine project without replacing creator-owned work.
3. Run the engine's import, validation, and build/export steps in a documented toolchain.
4. Launch the result or run a representative automated smoke check.
5. Confirm the requested core loop and each claimed system against explicit acceptance criteria.
6. Package source and the target artifact, with reproducible run and multiplayer instructions.
7. Record exact command output, artifacts, blockers, and the next task so the agent can resume.

If any gate is unavailable, report the exact missing dependency and label the output accurately. A ZIP existing on disk does not mean the game compiled or runs.

## Support levels

- **Verified lane:** A named engine/version and platform has a reproducible build/export and launch check in CI or an equivalent repeatable environment.
- **Agent-assisted lane:** The connected LLM can implement a project for a detected engine, but Open Game has not verified that engine/platform combination. Do not market this as a tested adapter.
- **Example adapter:** A bounded sample demonstrates one genre. It is never a substitute for a different requested genre.

## Current state

- The repository has one bounded browser racing example adapter, a generic ZIP packager, and initial non-verified native build operations for configured Godot, Unity, and Unreal projects.
- The Open Game Creator skill guides the user's coding agent through arbitrary briefs, but the LLM and its coding tools perform the actual game implementation.
- `open-game doctor` and MCP `inspect_game_toolchains` report engine/build executables found on `PATH`. Detection does not prove that export templates, platform SDKs, licenses, assets, or deployment services are ready.
- No universal arbitrary-game engine generator or verified native AAA lane is currently provided. The native operations do not yet launch builds, run gameplay scenarios, profile targets, or validate a release on clean CI.

## AAA ambition

“AAA” is a production scale and quality goal, not a build mode. For a particular game, define measurable scope: target platforms, player count, world/content volume, visual bar, frame-rate target, accessibility, online services, and release requirements. The agent should implement and verify those criteria as far as the available engines, assets, tools, services, and time allow. Do not call the result AAA unless the requested quality and release criteria have actually been met.

## Next engineering requirement

Before calling any native lane reliable, choose a supported engine/version/platform combination, provide its toolchain in development and CI, then make the import/build/launch/scenario gates pass repeatedly on clean checkouts. The current engine commands are first adapter operations, not verified support lanes. Add release and multiplayer gates before describing a lane as production-ready.
