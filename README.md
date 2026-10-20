# Open Game

**Dream big. Build original games with depth.**

Open Game is an **agent-ready game creation repo**. Load it into a coding LLM, describe the game you want, and use its creator workflow to plan and build an original game in real project files. The ambition is substantial games with connected systems—a large world, deep driving or movement, missions, characters, progression, simulation, and a distinctive story—not just tiny arcade demos.

Open Game does not make or market unofficial copies of specific commercial games. Its tools are designed to help creators make their own worlds, characters, stories, visual identity, audio, and implementation.

> Open Game can help creators identify common copying risks, but it cannot guarantee that a project is non-infringing or prevent a rights holder from making a legal claim. Laws differ by country, and each project depends on its facts. Get qualified legal advice for commercial releases or uncertain cases.

## The ambition

The target is a creator workflow for games with the depth people expect from major racing and open-world experiences, while giving every project its own identity. A creator might want career motorsport with vehicle setup, rivalries, weather, and a living paddock, or an open-world action game with an original city, driving, characters, missions, and emergent encounters. Those are genre-level ambitions; Open Game helps invent new expression, worlds, and identities.

Games at this scale take teams, time, iteration, and a capable engine. Open Game will not pretend a prompt can instantly produce a finished AAA game. It will make ambitious projects more achievable by decomposing them into coherent designs, reusable systems, playable vertical slices, production milestones, and progressively richer builds.

**The intended end product is a downloadable game.** A creator supplies an original brief to a coding LLM with this repo available. The agent uses Open Game's workflow and tools to turn that brief into editable project files, implement connected systems, build and package for a target platform, and iterate from play feedback. The repo now includes a working first end-to-end adapter: a generated browser racing game, downloadable ZIP, and optional authoritative WebSocket room server. This proves the pipeline for an original racing-game slice; it does not mean the repo can instantly generate arbitrary AAA games or studio-scale open worlds.

## Product direction

Open Game is a **game creation platform**, not only a library of small templates. Its eventual workflow should move through:

1. **Vision:** define player fantasy, genre blend, tone, audience, platform, and original identity.
2. **Game bible:** develop world rules, characters, narrative arcs, gameplay loops, and content boundaries.
3. **System design:** connect simulation, controls, AI, missions, progression, economy, and world state.
4. **Production plan:** split the ambition into milestones, risks, content needs, and testable vertical slices.
5. **Build:** generate and edit real engine project files, with human review and source and asset provenance.
6. **Iterate:** play, capture feedback, tune systems, expand content, and keep the project coherent.

The repo combines an agent-facing **Open Game Creator** skill, a visual **Game Blueprint Studio**, a CLI, an MCP server, and a shared project core. The Studio captures an ambitious vision and exports a structured blueprint. The CLI and MCP expose matching project operations. The skill guides an agent to implement actual game files in the user's chosen engine through progressive milestones.

### Current working build

Install dependencies with `npm install`, then run `npm run studio` and open the local URL printed in the terminal. Describe the experience, set your driver/team/rivals/track, select systems and ambition, save a draft, or export a JSON blueprint.

The first game adapter generates a standalone browser racer with a multi-lap circuit race, AI grid, keyboard driving, overtake boost, garage setup tradeoffs saved by career profile, local career reputation, classification and finish states. It produces the editable game folder and a ZIP download. An optional WebSocket server simulates online player inputs and race state in shared rooms. This is a browser prototype, not a native binary or AAA game. A small phrase scan flags selected known franchise references for human review; it does not inspect game assets or code and cannot establish legal safety.

### CLI

From a terminal in the repository:

```sh
node src/cli/main.js create --blueprint ./blueprint.json --output ./my-game
node src/cli/main.js inspect --project ./my-game
node src/cli/main.js plan --project ./my-game
node src/cli/main.js review --project ./my-game
node src/cli/main.js build --project ./my-game --output ./dist/my-game
```

Project paths are confined to the current working directory. The generated project includes a versioned `open-game.json`, game design document, milestone plan, and asset provenance ledger. `build` creates `./dist/my-game/` and `./dist/my-game.zip`. Open the output folder's `index.html` to play.

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

Run `npm run mcp` as a local stdio MCP server. Set `OPEN_GAME_WORKSPACE` to the directory where generated game project folders may be created. The MCP tools create a design scaffold and persistent build handoff, add a system, return the complete dependency-ordered production roadmap plus first-slice acceptance criteria, read the blueprint, run a narrow originality signal scan, and build the playable browser racing package. The `build_playable_game` operation generates a ZIP from an existing Open Game project. The coding agent then implements and verifies the remaining requested systems in the chosen engine.

See [MCP setup](docs/mcp-setup.md) for the connection configuration and tool list. The overall design is described in [platform architecture](docs/architecture.md). The [working-model drawing](docs/open-game-working-model.svg) shows the prompt-to-build loop.

### Use it with a coding LLM

Load this repository in a coding agent, open the folder where you want the game source created, and give one complete brief describing the experience, target platform, and multiplayer needs. `AGENTS.md` routes the agent to the Open Game Creator skill. It treats that brief as the full job: preserve the destination, build and package the real game project, verify the build, and continue beyond the first playable milestone. For work that spans sessions, it records progress in `OPEN_GAME_STATUS.md` so the same brief does not need to be repeated.

Example prompt: “Create an original open-world driving adventure for desktop. Give it a distinct coastal setting, responsive vehicle handling, exploration, rival crews, story missions, progression, save/load, and online co-op. Build the project in this folder, make it playable, package it, and keep implementing the requested systems until they are working. Use original names, world, art direction, and content.”

The LLM performs the creative coding; Open Game provides its workflow, project tools, and one browser-racing adapter. This repo does not contain an autonomous model, universal engine compiler, native exporters, or production multiplayer hosting. A one-prompt workflow means one brief starts an end-to-end agent task; it does not make studio-scale AAA scope instantly feasible. The agent must report what it actually built and verified, and preserve the remaining work and concrete blockers. Other genres and native targets require the coding agent to implement the matching engine project.

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
