# Open Game: game generation architecture

## Product goal

Open Game should help creators produce substantial, original, playable games. The system must preserve the creator's vision from concept through implementation, while turning ambitious scope into connected, testable milestones.

The Studio exports a structured blueprint with original team/driver/track settings. The first generation adapter uses that input to emit a playable browser racing project and ZIP, plus an optional WebSocket room server. Keep the adapter scope explicit: it is a racing prototype, not an arbitrary game compiler.

## Core pipeline

```text
Creator brief
    ↓
Originality and scope pass
    ↓
Game bible + system graph
    ↓
Production plan + slice definition
    ↓
Engine project generator
    ↓
Playable build + checks + creator review
    ↓
Iterate and expand
```

Each stage should produce inspectable project files. The creator should be able to edit, export, and version them without needing a proprietary Open Game runtime.

## Data model

The JSON blueprint should grow into a versioned project schema with stable IDs and explicit links:

- **Project:** title, creator intent, target platforms, audience, tone, scope, and original identity.
- **World:** regions, traversal rules, time, weather, factions, economy, and simulation boundaries.
- **Player experience:** core loop, controls, camera, difficulty, accessibility, and feedback goals.
- **Systems:** responsibilities, owned state, inputs, outputs, dependencies, performance budget, and test plan.
- **Content:** missions, events, characters, dialogue, items, vehicles, locations, and authored assets.
- **Production:** milestones, vertical slices, risks, team assumptions, acceptance criteria, and deferred scope.
- **Provenance:** source and license for dependencies and third-party assets, plus creator attestations for original work.

Do not store important game rules only in generated prose. Typed data and editable source code must become the source of truth for project generation.

## Systems-first construction

Large games should come from deep reusable systems combined with authored content, not from a huge collection of disconnected generated scenes. Candidate system families include:

### World and simulation

- Region streaming, world state, time, weather, traffic, ambient activity, and encounter scheduling.
- A clear update budget and simulation fidelity tiers so a large world can run on target hardware.
- Stable world events that persist across sessions when the design requires it.

### Player and controls

- Responsive movement and camera foundations, input remapping, accessibility options, and assist settings.
- Vehicle or traversal handling that exposes tunable parameters and supports distinct vehicle identities.
- Clear feedback for impact, traction, speed, damage, stamina, and other relevant states.

### Missions and activities

- Data-authored objectives, prerequisites, fail and recovery states, rewards, and replay rules.
- A mission/event graph that can use shared world, character, and progression state.
- Tools to assemble authored narrative beats with systemic variation.

### Characters and AI

- Utility or behavior-tree decision systems with explicit goals, perceptions, and constraints.
- Relationship, rivalry, faction, and memory state where the game design uses it.
- Debug views that show why an actor made a decision; never require opaque prose as runtime behavior.

### Progression and economy

- Tunable upgrades, skills, unlocks, rewards, and difficulty curves.
- Simulation of pacing and reward frequency before large volumes of content are authored.
- Save migration and persistent-state rules from the first engine integration.

### Narrative and creator tools

- Versioned dialogue, branching choices, character bibles, world lore, and localization-ready text.
- Validation for missing references, unreachable nodes, conflicting facts, and incomplete mission states.
- Creator control over tone, boundaries, and content inclusion.

## Engine adapter boundary

Keep the project schema engine-neutral. An adapter owns engine-specific generation and validation:

- Maps schema concepts to editable scenes, scripts, resources, and project settings.
- Preserves stable IDs across regeneration so creator edits are not silently lost.
- Separates generated files from creator-authored files and explains ownership clearly.
- Runs engine import, build, and project checks where the engine is available.
- Reports unsupported features instead of silently substituting behavior.

Choose the first engine based on creator needs, contributor capacity, export targets, licensing, and availability of local validation. Do not promise engine portability where features differ.

## Build quality gates

Every generated milestone should have acceptance criteria that are visible in the project:

1. The game opens and the main loop can be completed.
2. Core controls, camera, feedback, and accessibility settings work.
3. Missions and world events reach valid success, failure, and recovery states.
4. Saves preserve and migrate persistent state safely.
5. Performance budgets are checked on stated target hardware.
6. Placeholder and third-party assets have clear provenance and replacement paths.
7. Automated checks are paired with human play review; passing checks do not certify quality or legal safety.

## Scope strategy

The Epic setting in the Blueprint Studio is a production ambition, not a promise that one developer or one prompt can instantly create a studio-scale release. For every project:

- Preserve the end-state vision in the project bible.
- Choose a vertical slice that exercises the most important connected systems.
- Define what “done” means for that slice before generating its implementation.
- Put world size and content volume behind explicit milestones.
- Keep an expansion backlog so later content can reuse validated systems.
- Ask creators to narrow milestones when cost, schedule, performance, or technical dependencies exceed their capacity.

This lets a project remain ambitious while making each build achievable and reviewable.

## Originality and provenance

The pipeline should guide creators to define the high-level experience they want and then author distinct expression. It should not retrieve, extract, or reproduce a commercial game's assets, maps, dialogue, code, characters, logo, or story. Franchise references should be converted into neutral design qualities and followed by questions that elicit original choices.

Automated similarity or metadata checks may flag content for a creator to review. They must never certify that a game is lawful, promise immunity from litigation, or replace human judgment and qualified legal advice.

## Current implementation and next build steps

The browser Studio in `index.html`, `app.css`, and `app.js` currently supports:

- A creator brief, genre, tone, and three ambition levels.
- Selecting built-in systems and adding creator-defined systems.
- A structured JSON blueprint export.
- Local draft saving in the browser.
- A first playable-slice suggestion and originality reminders.
- Custom driver, team, rival, track, track-length, and lap settings for the racing adapter.

The current technical milestones are:

1. Expand the documented, validated blueprint schema and add migration rules.
2. Add editing for system dependencies and acceptance criteria.
3. Improve the racing adapter with deeper career play, richer tracks, weather, damage, pits, and authored events.
4. Add repeatable iteration with generated/source ownership so rebuilding cannot overwrite creator edits.
5. Harden multiplayer reconnect and deployment; then add an adapter for a second game genre or engine.
