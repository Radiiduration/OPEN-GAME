# Reference-led game reconstruction

Use this workflow when a creator names an existing game as a reference and wants a new game with a related broad experience. The goal is to learn from observable behaviors and public engineering evidence, then implement an original game in the creator's project. A reference is input to design, not a source of content to reproduce.

## 1. Scope the reference

- Record the exact title, version/platform, and the specific experience qualities the creator wants to study (for example: responsive vehicle handling, dense systemic exploration, or co-op mission flow).
- Confirm the target is authorized for inspection. Use REA only when its analysis tools are connected and the user has supplied or identified an authorized target artifact/runtime. Never bypass access controls or anti-cheat, DRM, or other protections.
- If the artifact or tool is unavailable, say so. Use only public developer material and creator-provided observations, and label conclusions accordingly.
- REA is a separate agent-side dependency: the creator must connect REA MCP in the LLM agent that will build the game. Installing Open Game does not install or configure REA for other users. See [REA's installation guide](https://github.com/morluto/rea/blob/main/docs/installation.md).

## 2. Ask focused questions and collect evidence

Inspect one feature at a time. Capture a reproducible scenario: initial state, player input, visible/audio feedback, resulting state, timing, and relevant edge cases. Use user-provided recordings, authorized runtime observations, official developer materials, and engine documentation. Store source links, version, timestamps or artifact hashes when available, and limitations.

Keep an evidence ledger with three separate labels:

- **Observed:** directly seen in an authorized run or directly stated in a cited primary source.
- **Inferred:** a plausible explanation of the observation; include alternatives and confidence.
- **Unknown:** internal implementation details the evidence cannot establish.

REA findings are scoped to the target and question it actually analyzed. An analysis result is not proof of the complete internal design of a commercial game.

REA also exposes reconstruction-obligation and coverage tools for evaluating finite, evidence-bound software claims. Open Game should borrow the discipline—enumerated claims, named owners, explicit dependencies, verifier authority, and residual unknowns—while using its own game-specific ledger. A successful REA reconstruction check is not a fun, performance, art-quality, content-volume, or AAA verdict for a game.

## 3. Translate evidence into an original specification

Describe the desired player-facing quality, measurable behavior, and constraints without turning protected expression into a requirement. Example: specify “vehicles have distinct grip and weight, with setup changes visible in telemetry” rather than reproducing a named game's exact car roster, tuning values, UI, or handling code.

Create original rules, tuning values, names, characters, story, world/map layout, art direction, audio, UI, and implementation. Use the creator's own characters and setting. Track third-party assets and licenses in `assets/ASSET_LEDGER.csv`. Do not copy decompiled source, proprietary data, distinctive content, or assets.

## 4. Implement and compare behavior

Implement the new system in the selected engine and keep its code/data editable. Define acceptance scenarios from the original specification, then build and run them in the new game. Compare the behavior against those criteria—not against pixel-perfect or content-level equality with the reference. Record measured results, failures, and the next implementation task. Continue through the requested connected systems, content, multiplayer, performance, and packaging gates; a first slice is not completion.

## 5. Report limits honestly

State which observations are direct, which conclusions are inferred, what remains unknown, and what was actually implemented and verified. Public descriptions of a feature do not reveal its proprietary algorithm. Similarity checks, clean-room intent, and disclaimers cannot guarantee that no legal claim will be made.
