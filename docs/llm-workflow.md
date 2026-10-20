# Use Open Game with a coding LLM

Open Game is meant to travel with a coding agent. Its end-to-end target is prompt → editable source project → engine build → downloadable playable game. The repo provides the workflow, game project tools, and a first working browser racing adapter; the coding agent supplies the model and repository access. Other genres and engines need their own adapters or direct LLM implementation.

## Load the project

Open or attach this repository as the project in a coding agent. The root `AGENTS.md` explains when to use the creator workflow and points to `skills/open-game-creator/SKILL.md`.

If the agent supports project instructions but not skill discovery, give it both `AGENTS.md` and the skill file as project context. For personal reuse across projects, install or copy the `open-game-creator` skill using the workflow supported by that agent. Keep the skill file with the game project so future sessions can follow the same process.

## Give it a game vision

Give one complete brief describing what you want in your own words. Strong briefs include the player fantasy, genre blend, important systems, tone, target platform, multiplayer needs, and what makes the world original. The initial prompt authorizes the full implementation and packaging workflow; you do not need to specify every technical detail or re-prompt between milestones.

Example:

> Create an original open-world motorsport game set across a chain of stormy coastal regions. I want responsive driving, deep vehicle tuning, a career with rival teams, changing weather, exploration, and events that can emerge while roaming. Start with a polished vertical slice and keep the whole career game as the destination. Use the engine already in this repository.

## What the agent should do

1. Inspect the existing repository, instructions, and available game tools.
2. Record the full vision, original identity, system connections, assumptions, and staged plan.
3. Choose an engine with a real build path and write the entire requested system set plus dependency order into the production plan.
4. Create or modify real, editable engine project files; implement a connected playable slice, then continue implementing the remaining requested systems and authored content.
5. For racing, use the included browser adapter as a playable base and expand its editable output. For other genres, do not pass the brief through the racing template; build the appropriate source project directly or add a matching adapter.
6. Include the requested multiplayer package, authority/session model, reconnect behavior, and deployment setup.
7. Build, repair, package, and launch where tools allow. Keep `OPEN_GAME_STATUS.md` current so interrupted work resumes at the next unchecked criterion. State exactly what was verified and any concrete blocker.

## What this workflow does not provide

The included racing adapter generates a browser playable multi-lap race with AI rivals, setup tradeoffs, career reputation saved locally, a packaged ZIP, and an optional server-authoritative room server. It is not a universal engine adapter: native exports, large open worlds, deep career content, production matchmaking, and secure public hosting require substantial further work. The repo does not bundle a language model or proprietary assets. One brief can drive the whole agent workflow, but a major studio-scale game still needs extensive iteration, implementation, content creation, and refinement; report actual build evidence rather than implying the prompt alone produced production quality.

The workflow also cannot certify legal safety or guarantee protection from legal claims. Creators remain responsible for using original or properly licensed content.
