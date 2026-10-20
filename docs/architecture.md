# Open Game platform architecture

## Assessment of the current repo

The original increment was a static Blueprint Studio plus a short agent skill. That was a useful interface mock, but it was not a complete product architecture: there was no shared domain layer, machine-readable project contract, CLI, MCP server, engine adapter, or stable generated-project format.

Open Game is moving toward an **end-to-end game build system** with a shared core and multiple surfaces. The target is: a creator describes an original experience to a coding LLM, the LLM uses Open Game's workflow and tools to design and build the game in an engine, and the project produces a downloadable, playable package. A blueprint is an intermediate artifact, never the product's promised endpoint.

## REA as an architectural reference

REA illustrates a useful shape for agent products: an MCP server exposes actionable tools, CLI workflows offer the same core capability outside an agent, and the matching skill teaches the model when and how to use them. REA's providers/adapters connect that shared workflow to different analysis engines. [REA explains the MCP + CLI workflow](https://github.com/morluto/rea#how-rea-works) and documents a separate skill-only install path in its [installation guide](https://github.com/morluto/rea/blob/main/docs/installation.md).

REA's valuable pattern is its distribution of one domain workflow through an agent skill, MCP, and CLI, with adapters for specialized tools. Open Game uses that pattern for a different job: moving from intent to source files and a downloadable game. The browser racing example demonstrates how an adapter can fit into the workflow. It is deliberately separate from the arbitrary-game path: the connected LLM implements each creator’s requested game in the fitting engine.

## Target architecture

```text
Creator prompt
    ↓
Coding LLM + Open Game skill
    ↓ calls
Open Game MCP / CLI ───── Studio app
    ↓                        ↓
Shared game project core + versioned project manifest
    ├── original concept + game bible
    ├── system graph + production plan
    ├── content/asset provenance
    └── persistent jobs, milestones, and build records
    ↓
Generation orchestrator
    ├── engine adapter (scenes, gameplay, input, UI)
    ├── content/asset adapter (original or licensed media)
    ├── multiplayer adapter (authority, sessions, persistence)
    └── build adapter (compile, package, platform output)
    ↓
Editable source project + playable builds + server package
    ↑                         │
    └──── build/play feedback ┘
```

The coding LLM remains the creative and coding agent. Open Game provides the stable game contract, project orchestration, engine/content/network/build adapters, and feedback loop. The final experience can be genre-level familiar while its specific world, rules, characters, teams, tracks, visuals, audio, and code are original. No single MCP call can produce a studio-scale game instantly; the repo's job is to keep producing and packaging the game through explicit iterations rather than stopping at a pitch.

## Layer responsibilities

### Studio

The browser UI captures a creator's vision, systems, tone, and ambition. It saves drafts locally and exports the same versioned blueprint accepted by the core. It should become the human-facing project editor: project list, system graph, milestones, asset ledger, and play/build feedback.

### Skill and repository instructions

The skill teaches coding agents the creator workflow, originality expectations, and completion reporting. Root `AGENTS.md` points project-scoped agents to the skill. The skill stays concise enough to load reliably; detailed engine recipes and design guidance belong in separate references.

### CLI and MCP

CLI and MCP are thin transports around shared core operations. They must not implement separate game logic. CLI is useful for scripted workflows and manual project work; MCP makes the same operations available as model-callable tools. MCP operations should be composable and stateful: create/update a project, add or change a system, generate an implementation milestone, run an engine build, package a target, inspect errors, and continue. MCP results should report exact changes and build artifacts. MCP tools should preserve and update the project handoff; the coding LLM must do the actual game implementation. A one-shot template selector would misrepresent arbitrary creation.

### Shared core

Own the versioned blueprint, validation, stable system IDs, dependency checks, project creation, slice planning, and design-file updates. The core should be engine-neutral. Generated project files should remain readable and editable without requiring the Open Game server at runtime.

### Engine adapters

An engine adapter translates the project contract into editable scenes, gameplay systems, input setup, UI, data assets, and a runnable project. A build adapter imports or compiles that project and packages platform artifacts. Adapters declare supported capabilities, toolchain requirements, generated-file ownership, multiplayer support, and known gaps. Begin with one adapter after selecting it based on target fidelity, licensing, community, and development environment. High-fidelity open-world, racing, and multiplayer experiences may need different capabilities; do not claim that all engines are interchangeable.

### Providers and generation

LLM inference should be supplied by the creator's coding agent or configured model provider. Open Game should not lock a user's projects to a single model API. Engine generators should produce deterministic scaffolding where possible, while LLM-authored code stays visible for creator review.

### Multiplayer and release pipeline

Multiplayer is a design and deployment capability, not a checkbox. When requested, the project contract must represent network authority, replication, sessions/lobbies, server builds, persistence, disconnect/rejoin behavior, and target player count. The multiplayer adapter supplies runnable local or hosted server configuration and client/server packages. Any hosted service must be explicitly selected and configured by the creator; Open Game should not silently provision paid services.

The release pipeline produces the engine source plus platform-specific downloadable builds, records build logs and requirements, and distinguishes successful builds from planned outputs. Large assets, code signing, store publishing, server hosting, and paid provider services may require creator setup.

## Current implemented boundaries

The repo currently contains:

- A static Blueprint Studio for capturing and exporting a game brief.
- A shared Node core for versioned blueprints, safe project scaffolds, asset provenance, resumable status, connected systems, and dependency-ordered production planning.
- A CLI and MCP interface over those project operations, plus a generic ZIP packager for an already exported game.
- One bounded browser racing example adapter. It demonstrates a possible genre-specific adapter; it is not an arbitrary game generator.
- An Open Game Creator skill and generated `AGENTS.md` handoff that tell the connected coding LLM to implement the creator’s actual brief, characters, engine project, requested systems, build, and download.

The connected LLM authors the game code. The repo does not contain a model, arbitrary engine generator, universal compiler, native exporters, asset-generation pipeline, or production multiplayer hosting. The generic package operation archives existing files but does not compile them. Open Game is designed as the reusable agent workflow and project handoff that lets a user’s coding agent build different original games; it does not make a short prompt instantly equal a finished AAA studio release.

## Safety and project boundaries

- MCP writes are anchored to `OPEN_GAME_WORKSPACE` (or the server's current directory when unset) and reject traversal and symbolic-link escapes.
- Project creation writes into a new directory and must not overwrite creator-owned work.
- Blueprint and system updates preserve stable IDs and validate system dependencies.
- Third-party assets need source and license records.
- A small blueprint-text pattern scan can flag selected franchise names for review; it does not inspect assets or code and does not certify legal safety.
- A generated slice should preserve the larger vision in project files and label unimplemented features clearly.

## Build sequence

1. Expand schema validation and add blueprint migrations as the data model grows.
2. Keep Studio, CLI, and MCP on the same core operations.
3. Improve the agent handoff so the coding LLM can preserve complete user briefs, character rosters, system dependencies, and engine/build evidence across longer projects.
4. Add repeatable game iteration with change tracking so regeneration does not erase creator edits.
5. Harden multiplayer deployment, reconnection, private rooms, and operational documentation before public hosting.
6. Add engine and build adapters as optional capabilities, without describing any one example as a universal game compiler.
