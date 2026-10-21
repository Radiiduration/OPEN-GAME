# Open Game releases

## v0.2.0 — Creator toolkit preview

The first tagged package release of Open Game. Install the CLI tarball from the [GitHub release](https://github.com/Radiiduration/OPEN-GAME/releases/tag/v0.2.0), or install the latest source from the repository.

### Included

- **Blueprint Studio** for recording an original game vision and exporting a structured build brief.
- **Open Game Creator skill** for directing a connected coding agent through project inspection, implementation, build/run iterations, and continuation records.
- **CLI and MCP server** backed by shared project operations for creating and inspecting projects, planning systems, recording obligations, checking originality signals, and packaging supported outputs.
- **Initial engine build adapters** for configured Godot, Unity, and Unreal projects, subject to the documented toolchain and project requirements.
- **Bounded browser racing example** with a small multiplayer server intended for local/LAN experimentation.
- **Install guide, website, privacy notice, architecture docs, and package workflow.**

### Install

Download `open-game-0.2.0.tgz` from the GitHub release assets, then run:

```sh
npm install --global ./open-game-0.2.0.tgz
open-game doctor
open-game studio
```

Or install directly from the source branch:

```sh
npm install --global git+https://github.com/Radiiduration/OPEN-GAME.git#master
```

### Scope and limitations

This is an early toolkit release, not an autonomous AAA game generator. A connected coding agent performs game-specific design and implementation; build support depends on the installed engine, project configuration, and agent. The included racing adapter is a limited example, not a universal game generator. Online hosting, production matchmaking, and model access are not included. Review the [reliability contract](reliability-contract.md) before relying on an engine lane.

The repository does not currently include a `LICENSE` file or publish the package to the npm registry. A public GitHub release does not itself grant a reuse license. Review provenance and obtain rights for all game content and assets.
