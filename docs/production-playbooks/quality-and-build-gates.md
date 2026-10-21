# Game quality and build gates

Use these gates for every game brief. They turn “make it great” into evidence an agent can produce and a creator can judge. They are a production workflow, not an automatic AAA certification.

## Before implementation

- Preserve the original prompt and character/world information in project files.
- Select engine, version, platform, input devices, target frame rate, resolution, player count, and asset provenance after inspecting the real environment.
- Turn visual and experiential adjectives into observable goals. Example: “responsive driving” becomes input-to-motion behavior, camera response, braking/cornering tests, and a human play-review item.
- Build a dependency graph. Every system lists owned state, interfaces, persistence/network authority, performance budget, player feedback, acceptance scenarios, and current evidence.
- Keep all requested systems and content in the full production plan. Milestone work may be staged; requested scope may not be silently erased.

## Every playable milestone

1. Implement real source, data, assets, and engine scenes. Menus or a blueprint alone do not count as the game loop.
2. Use final-intent art direction early: establish one coherent character/environment/material/lighting/audio style, then expand it. Replace primitive placeholders for the features being called complete. Log assets, licenses, generation provenance, and replacement status.
3. Build/import and launch on the chosen target. Exercise the feature with its normal controls, failure/recovery state, save/network path, and an adjacent system it depends on.
4. Inspect runtime logs and observable play behavior. Fix concrete failures before adding more breadth.
5. Profile on stated hardware. Set frame, memory, loading, streaming, network, and content budgets from the actual target; show measurements and conditions, not guesses.
6. Save one repeatable scenario or smoke procedure per acceptance criterion. Automated checks can validate invariants; they cannot replace feel, readability, art, pacing, or fun review.
7. Update `OPEN_GAME_STATUS.md` and the progress record with exact commands, measured results, screenshots/logs/build locations, unmet checks, and the next implementation task.

## Completion report

Report the exact playable loop, target/platform, content volume, systems implemented, build/run/package evidence, human review status, multiplayer topology tested, and blockers. Separate implemented, tested, and planned work. Do not label a game AAA, production-ready, or fully multiplayer unless its predefined release criteria have been demonstrated on the stated target. If some creator requirement cannot be met in the available environment, keep it in the backlog and name the concrete blocker rather than substituting an unrelated demo.
