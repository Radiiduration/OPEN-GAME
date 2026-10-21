# Open-world action playbook

Use this for an original open-world action/adventure brief with roaming, vehicles or traversal, ambient life, missions, and persistent progression. This is an implementation recipe inspired by general game-engine capabilities and public player-facing descriptions, not a copy of GTA or Red Dead internals. For the evidence boundary, read [what public evidence can tell us](../reverse-engineering/what-public-evidence-can-tell-us.md).

## Preserve the fantasy, then make a system graph

Translate the creator's specific fantasy into player verbs, a minute-to-minute loop, a session loop, and a long-term progression loop. Name the game's own world, protagonist, factions, activities, visual language, and narrative voice. A genre comparison is not a content brief.

For every system define: owned state, input events, output events, dependencies, update frequency, save/network ownership, player-visible feedback, and one acceptance scenario. Connect mission, traversal, world, economy, character, and save systems through typed state/events instead of unrelated scripts or prose-only behavior.

## World representation and streaming

1. Split the authored world into named regions and cells. Store POIs, routes, encounter anchors, streaming metadata, and creator-authored lore as data, not hard-coded coordinates scattered across scripts.
2. Let the engine's supported world-partition/streaming system own asset loading when available. For an original custom streamer, predict candidate cells from position, velocity, heading, and a bounded look-ahead horizon; load ahead of likely travel, unload behind only after a hysteresis window, and keep explicit memory budgets. Never imply this hand-rolled fallback equals a mature engine streamer.
3. Give every region a full-detail radius and farther simulation tiers. Nearby actors run their full gameplay/animation; mid-distance actors use cheaper decisions and simplified motion; far populations use aggregate schedules/event summaries or no live actor. Define how each tier preserves player-relevant state when promoted or demoted.
4. Keep distant scenery visible with engine HLOD or an equivalent verified proxy path. Separate visual representation LOD from simulation LOD. Track cell load times, memory, visible actor counts, and streaming misses in a debug overlay.
5. Treat weather, time, faction control, mission consequences, and other persistent changes as world state. Record event IDs and deltas in a save journal; do not serialize transient renderer/physics state indiscriminately.

## Ambient population and AI

Represent civilians, traffic, animals, and enemies with reusable archetypes and data-driven schedules. Use a bounded decision model: perception/senses → candidate goals → utility or explicit priority selection → action/state machine → event/result. Goals must have interruption, timeout, failure, and recovery behavior. Navigation must use the selected engine's tested nav/path system rather than straight-line movement through obstacles.

Each actor should expose a debug reason for its current goal and last transition. Use distance/visibility/activity LOD to bound decision and animation cost. Add crowd density, spawn/despawn, collision, and off-screen persistence rules. Never claim “living city” from decorative entities that do not respond to the player's actions.

## Missions and systemic activities

Model objectives as a validated graph with stable IDs, prerequisites, completion/failure transitions, timers, rewards, and recovery paths. Mission conditions read shared world/player/faction state; mission actions emit events that change that state. Validate missing IDs, unreachable nodes, cycles that cannot exit, contradictory objectives, and reward duplication.

Build a small set of complete, replayable activity archetypes before generating many missions. Example acceptance path: accept activity → travel to a distinct location → encounter an interruption → complete or fail → observe world/progression update → save/reload and confirm the outcome persists. Add a mission-debug view that displays active node, unmet conditions, event history, and failure reason.

## Traversal and vehicle integration

Keep the movement controller, camera, vehicle model, traffic rules, damage, and interaction prompts as separate but connected systems. Vehicles should have distinct tunable handling profiles and readable state feedback. For a car model, use the equations and telemetry loop in [the racing simulation playbook](racing-simulation.md), scaled to the requested driving fantasy. Test entering/exiting, collisions, traffic interactions, recovery after overturning or falling, and control remapping.

## Multiplayer if requested

Write down authoritative state and ownership before adding replication. The server validates movement, mission rewards, inventories, and persistent progression; clients predict only the inputs the chosen design permits. Specify sessions/lobbies, party join, disconnect/rejoin, interest management, rate limits, persistence, deployment, and abuse boundaries. Exercise at least two real local clients. A local room server is a prototype, not hosted production multiplayer.

## Vertical slice and scale-up

The first playable checkpoint must prove the selected game's defining loop, not replace the complete destination. Use one contiguous region with final-intent traversal, one responsive character, one ambient behavior, one complete mission/activity, one persistent consequence, one save/reload, and representative original art/audio. Then scale each validated system through authored content and additional regions. Keep the full-system backlog and acceptance checks visible after every milestone.
