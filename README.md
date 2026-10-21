# Open Game

**Dream big. Build original games with depth.**

Open Game is an **agent-ready game creation repo**. Load it into a coding LLM, describe the game you want, and use its creator workflow to plan and build an original game in real project files. The ambition is substantial games with connected systems—a large world, deep driving or movement, missions, characters, progression, simulation, and a distinctive story—not just tiny arcade demos.

Open Game does not make or market unofficial copies of specific commercial games. Its tools are designed to help creators make their own worlds, characters, stories, visual identity, audio, and implementation.

> Open Game can help creators identify common copying risks, but it cannot guarantee that a project is non-infringing or prevent a rights holder from making a legal claim. Laws differ by country, and each project depends on its facts. Get qualified legal advice for commercial releases or uncertain cases.

## The ambition

The target is a creator workflow for games with the depth people expect from major racing and open-world experiences, while giving every project its own identity. A creator might want career motorsport with vehicle setup, rivalries, weather, and a living paddock, or an original role-playing world with combat, characters, missions, and emergent encounters. Those are genre-level ambitions; Open Game helps invent new expression, worlds, and identities.

Games at this scale take teams, time, iteration, and a capable engine. Open Game will not pretend a prompt can instantly produce a finished AAA game. It will make ambitious projects more achievable by decomposing them into coherent designs, reusable systems, playable vertical slices, production milestones, and progressively richer builds.

**The intended end product is a downloadable game.** A creator supplies an original brief to a coding LLM with this repo available. The agent uses Open Game's workflow and tools to turn that brief into editable project files, implement connected systems, build and package for a target platform, and iterate from play feedback. The repo is an agent layer: the connected LLM interprets each creator’s brief and writes the actual game in the appropriate engine. Open Game stores the brief and production state, teaches the agent how to implement and verify the whole requested project, and provides structured project tools. It does not route arbitrary prompts into canned game templates.

## Product direction

Open Game is a **game creation platform**, not only a library of small templates. Its eventual workflow should move through:

1. **Vision:** define player fantasy, genre blend, tone, audience, platform, and original identity.
2. **Game bible:** develop world rules, characters, narrative arcs, gameplay loops, and content boundaries.
3. **System design:** connect simulation, controls, AI, missions, progression, economy, and world state.
4. **Production plan:** split the ambition into milestones, risks, content needs, and testable vertical slices.
5. **Build:** generate and edit real engine project files, with human review and source and asset provenance.
6. **Iterate:** play, capture feedback, tune systems, expand content, and keep the project coherent.

The repo combines an agent-facing **Open Game Creator** skill, a visual **Game Blueprint Studio**, a CLI, an MCP server, and a shared project core. The Studio captures an ambitious vision and exports a structured blueprint. The CLI and MCP expose matching project operations. The skill guides an agent to implement actual game files in the user's chosen engine through progressive milestones. Generated projects now include a reference evidence ledger and typed implementation obligations; the CLI/MCP can review ledger completeness, but the coding LLM and engine still perform and verify the actual game work.

### Current working build

Install dependencies with `npm install`, then run `npm run studio` and open the local URL printed in the terminal. Describe the game, add your characters and world details, choose a target platform and multiplayer scope, select systems, and export either the JSON blueprint or an **LLM build brief**. Open this repository in a coding agent and give it the build brief; the brief tells the agent to inspect the project, implement actual engine files, build and run them, fix failures, and continue through the requested systems. The connected coding agent performs that work.

The Studio currently captures a game brief and exports a blueprint. One bounded browser racing example demonstrates how a genre adapter can work; it is not the product’s game generator and must only be used for a matching racing request. For other genres and richer targets, the connected coding agent implements the actual game in its chosen engine. The phrase scan flags selected names in blueprint text for human review; it does not inspect assets or code and cannot establish legal safety.

### CLI

From a terminal in the repository:

```sh
node src/cli/main.js doctor
node src/cli/main.js create --blueprint ./blueprint.json --output ./my-game
node src/cli/main.js inspect --project ./my-game
node src/cli/main.js plan --project ./my-game
node src/cli/main.js review --project ./my-game
node src/cli/main.js obligations --project ./my-game
node src/cli/main.js build --project ./my-game --output ./dist/my-game
node src/cli/main.js package --project ./engine-project/build --output ./dist/download.zip
```

`create` makes a design and production handoff from a prepared blueprint. The connected coding agent then implements the requested game in real project files. `build` runs only the bounded browser racing example; `package` zips an existing engine export but does not compile it. Project paths are confined to the current working directory.

To build the included original racing example from end to end, use `examples/coastal-grand-prix.json`:

```sh
node src/cli/main.js create --blueprint examples/coastal-grand-prix.json --output windline-project
node src/cli/main.js build --project windline-project --output dist/windline
```

To enable the bundled multiplayer server, install its dependency and launch it:

```sh
cd ./dist/my-game/multiplayer
npm install
npm start
```

Players open the generated `index.html`, choose Online Lobby, and connect to `ws://localhost:8787` (or the host's LAN address). The server uses shared server-simulated movement, a room-wide countdown, and a maximum of eight players. Rooms are ephemeral; it has no persistence, reconnect, matchmaking, authentication, or TLS and is intended for LAN/friends testing, not public production hosting.

### MCP server

Run `npm run mcp` as a local stdio MCP server. Set `OPEN_GAME_WORKSPACE` to the directory where generated game project folders may be created. MCP exposes toolchain and engine-project inspection, project creation, system planning, blueprint and obligation tracking, resumable progress, bounded engine builds, the browser racing example, originality signals, and ZIP packaging. New projects carry an `AGENTS.md`, the Open Game Creator skill, the full brief, and structured progress files, so another coding agent can resume from the generated source folder. The connected LLM performs game design and engine implementation; no MCP call creates a complete arbitrary game on its own.

Use `open-game doctor` or MCP `inspect_game_toolchains` before selecting an engine. Then use `inspect_game_engine_project` to find actual Unity, Godot, or Unreal project markers. `build_game_engine_project` supports Godot exports with an existing preset, Unity batch builds with a project-owned build method, and Unreal `BuildCookRun` when `UNREAL_ENGINE_ROOT` is configured on macOS/Linux. `launch_game_artifact` starts a packaged build; `run_game_engine_scenario` invokes project-owned Godot/Unity scenario code and returns its log. These operations do not create export presets, install engines, judge test coverage, or verify all runtime behavior.

See [MCP setup](docs/mcp-setup.md) for the connection configuration and tool list. Read the [reliability contract](docs/reliability-contract.md) for the support levels and evidence required before calling an engine/platform lane dependable. The [agent-ready engine adapter contract](docs/agent-ready-engine-adapter-contract.md) documents current build operations and the remaining scenario, evidence-capture, and profiling interface. The overall design is described in [platform architecture](docs/architecture.md). The [working-model drawing](docs/open-game-working-model.svg) shows the prompt-to-build loop.

For the complete creator-to-download mechanism, including each component's current role and limits, see [How Open Game works](docs/how-open-game-works.md).

### Use it with a coding LLM

Load this repository in a coding agent and run Studio. Describe the experience, characters, world, target platform, and multiplayer needs, then export the LLM build brief. Give that file to the coding agent with this repository open. The brief and `AGENTS.md` route the agent to the Open Game Creator skill and its implementation workflow. It treats the creator brief as the full job: preserve the destination, build and package the real game project, verify the build, and continue beyond the first playable milestone. For work that spans sessions, it records progress in `OPEN_GAME_STATUS.md` so the same brief does not need to be repeated.

Example prompt: “Create a third-person action RPG for Windows. Use my original characters and the setting notes I provide. Build exploration, combat, dialogue, quests, companion behavior, progression, saves, and online co-op as connected systems. Pick the engine that fits, build and package a playable project, and continue implementing the full brief beyond the first slice. Keep my characters and use original world details, art direction, and content.”

The LLM performs the creative coding; Open Game provides the agent workflow, project handoff, planning tools, a browser-racing example, and initial Godot/Unity/Unreal build adapters. This repo does not contain an autonomous model, universal engine compiler, or production multiplayer hosting. A one-prompt workflow means one brief starts an end-to-end agent task; it does not make studio-scale AAA scope instantly feasible. The agent must report what it actually built and verified, and preserve the remaining work and concrete blockers. Runtime scenarios, profiling, and release validation still require the coding agent to use the matching engine tools.

## The problem

People often know the experience they want to create—fast wheel-to-wheel racing, a vast frontier to explore, a tense survival loop—but lack the design tools, starter systems, and practical IP guidance to turn that inspiration into an original game. “Clone” tutorials can push creators toward copying recognizable names, characters, maps, stories, art, music, interfaces, or other distinctive material.

Open Game gives creators a better path: identify the broad player experience they want, then make the creative choices that make the game their own.

## Who it is for

- Beginners learning game design and prototyping.
- Indie developers who want reusable, genre-neutral starter systems.
- Educators teaching game development and responsible creative practice.
- Contributors who want to publish reusable, clearly licensed tools and assets.

## Product principles

1. **Originality is the default.** Start from player goals, feelings, constraints, and genre conventions—not a named franchise.
2. **Teach through alternatives.** When a prompt points too closely at a known game, help the creator restate the underlying experience and invent new expression.
3. **Make provenance visible.** Record where code, art, audio, fonts, models, and other materials came from and what license applies.
4. **Be honest about uncertainty.** Automated checks are signals for human review, not legal opinions or certificates of safety.
5. **Respect creators and rights holders.** Do not provide or encourage extraction, redistribution, or recreation of proprietary assets, source code, or protected story material.
6. **Keep projects portable.** Prefer open formats and documented export paths so creators can use their work with common engines and tools.

## What the toolkit could include

### 1. Original concept workshop

Guide a creator from a genre or player fantasy to a distinct design using questions such as:

- What should the player feel, learn, risk, and master?
- What is the central verb or decision that makes this game satisfying?
- What setting, time period, tone, and visual language will make it distinct?
- What constraints or unusual rules change the familiar genre loop?
- What is deliberately different from the creator's inspirations?

The workshop should not output a game pitch that merely swaps names or surface details from a named commercial title.

### 2. Prototype kits

Provide small, replaceable examples for common systems: movement, camera, racing laps, checkpoints, inventory, dialogue, quests, save data, and basic AI. Kits should teach patterns and ship with original placeholder content. They should not include proprietary game assets or claim to reproduce a particular title's implementation.

Initial engine targets should be chosen based on contributor capacity. Keep the underlying tutorials engine-neutral where possible, then add one engine integration for the first MVP.

### 3. Asset and license ledger

Every included asset or dependency should have a record containing:

- Asset or package name and version.
- Author or source URL.
- License and any attribution text.
- Changes made and the person who made them.
- Whether the asset is original, commissioned, public domain, or third-party licensed.

The ledger should make missing or incompatible license information easy to spot. It cannot determine whether an asset is legally safe in every context.

### 4. Similarity and risk review

Offer a pre-release checklist and optional project scan for obvious warning signs: franchise names in project metadata, imported files with unclear sources, copied logos, or content marked as belonging to another game. A scan can flag things for review; it must not say “copyright safe,” “approved,” or “lawsuit-proof.” Human review and legal advice remain important for high-stakes releases.

### 5. Creator publishing guide

Explain how to prepare an original store page, credit third-party materials, publish source and asset licenses, respond to rights-holder concerns, and request review or removal of disputed content. Include a clear contact and takedown process before hosting user projects publicly.

## Guardrails

The project should make risky behavior harder and original work easier:

- No bundled assets, audio, dialogue, maps, character designs, or code taken from commercial games without permission.
- No feature whose purpose is to extract, rip, or redistribute another game's protected content.
- Don't use a commercial game's title, logo, character names, or branding to imply affiliation or endorsement.
- If a creator names a specific game as a reference, redirect the workflow toward abstract qualities (for example, “high-speed circuit racing with technical corners”) and ask for distinct creative decisions.
- Require provenance and license details for assets submitted to any future community library.
- Publish a plain-language policy, reporting route, and repeat-infringer response process before enabling public uploads.
- Keep a human appeal path for automated flags; false positives should not silently become legal judgments.

These safeguards reduce avoidable risk; none can prevent a lawsuit or guarantee a legal outcome.

## MVP

Start with a real creator workflow, then grow toward complete games in testable layers:

1. A Game Blueprint Studio for high-scope game concepts and connected systems.
2. Blueprint export that preserves the complete vision in a structured file.
3. A production breakdown that turns scope into a playable vertical slice and expansion milestones.
4. Asset provenance and license records from the start.
5. A first engine adapter that turns approved blueprint sections into editable project files.
6. Originality guidance that redirects franchise-specific prompts toward distinct creative choices.

Do not claim to generate a finished AAA game in one click. Do not begin with user-generated asset hosting, automated “legal clearance,” or a marketplace. Those require stronger moderation, licensing, security, and support processes.

## Suggested repository layout

```text
open-game/
├── README.md                 # Project overview and getting started
├── index.html                # Current Blueprint Studio prototype
├── app.css
├── app.js
├── package.json
├── AGENTS.md
├── skills/
│   └── open-game-creator/
│       └── SKILL.md
├── docs/
│   ├── architecture.md
│   ├── game-generation-architecture.md
│   ├── llm-workflow.md
│   └── mcp-setup.md
├── src/
│   ├── core/project.js
│   ├── cli/main.js
│   └── mcp/server.js
└── skills/open-game-creator/SKILL.md
```

Choose licenses deliberately: code, documentation, and creative assets may need different licenses. Do not add a permissive license to material whose ownership or licensing is unclear.

## Roadmap

### Phase 1: Foundations

- Agree on project principles and community rules.
- Write the concept worksheet, asset ledger, and release checklist.
- Build the Blueprint Studio and create a complete, ambitious game plan.
- Select an initial engine and build a polished vertical slice with several connected systems.
- Review licenses for every dependency and asset.

### Phase 2: Creator workflow

- Add engine project generation and guided prompts that turn broad inspiration into distinctive design choices.
- Add production planning, system dependency mapping, project templates, and provenance checks.
- Test the workflow with creators; improve confusing warnings and iteration loops.

### Phase 3: Deep game systems and community, if the project is ready

- Expand into world simulation, content authoring, missions, progression, and richer AI systems through modular engine integrations.
- Add submissions only after moderation, reporting, attribution, and license review processes are staffed and documented.
- Publish clear criteria for removal, appeals, and repeat violations.
- Consider optional similarity checks only as review aids, with documented limits and privacy practices.

## Success measures

- New creators can produce a distinctive concept brief and working prototype.
- Projects include complete, readable provenance for third-party materials.
- Contributors understand that genre inspiration is different from copying a game's expressive content, while recognizing that boundaries can be fact-specific.
- Reports are handled consistently, promptly, and transparently.
- The project never presents a scan, checklist, or disclaimer as a guarantee of legal safety.
- Generated projects can grow from a polished vertical slice into substantial worlds without replacing their core systems at each milestone.

## Contributing

Contributions should help creators make original games and understand the materials they use. Before opening a pull request, include the source and license for new assets and dependencies, describe any changes to the project guardrails, and avoid examples that reproduce recognizable protected content.

## Name

**Open Game** is the working name. Before public launch, check repository, domain, and trademark availability in the places where the project will operate. The name itself is not a legal clearance.
