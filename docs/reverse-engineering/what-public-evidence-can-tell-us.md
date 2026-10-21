# Reference research: what public evidence can tell Open Game

For the repeatable workflow that a generated game project carries with it, see [reference-led game reconstruction](../production-playbooks/reference-led-game-reconstruction.md).

## Scope and method

This is a bounded desk study, not a REA analysis of GTA, Red Dead Redemption, or EA SPORTS F1 binaries. No game executable or authorized target build was supplied, and this session has no REA analysis tools or installed `rea` CLI. REA cannot recover source algorithms from a title that is not present as a target. Do not acquire proprietary game files or attempt to bypass their protections to fill this gap.

The sources below are public developer/platform material. They support broad design and engineering patterns only. They do not disclose the target games' full implementation, exact parameters, source code, or production pipeline. Every Open Game recipe derived from them is an original design choice, not a reconstruction of proprietary internals.

The linked [REA repository](https://github.com/morluto/rea) describes an agent workflow that inspects a supplied target, returns findings with evidence and limitations, then lets the agent investigate further and implement/test a feature. Open Game adopts that evidence → implementation → verification discipline for new game projects. REA is a reverse-engineering tool, not a source of GTA/F1 algorithms or a game-generation engine.

## Observations from primary sources

- EA's public F1 24 release material describes an updated handling model involving suspension kinematics, a tire model, aerodynamic simulation, and engine/car-setup options. This establishes that handling is treated as a set of coupled systems; it does not disclose their equations or parameter values. [EA's F1 24 feature announcement](https://news.ea.com/press-releases/press-releases-details/2024/Be-One-of-the-20---F1-24-Delivers-All-New-Dynamic-Handling-Overhauled-Career-and-More/default.aspx)
- Rockstar's public GTA Online description frames the experience around free exploration, ambient activity, missions, co-op, and competitive activities. It describes player-facing structure, not the internal AI, streaming, or networking algorithms. [Rockstar's GTA Online overview](https://www.rockstargames.com/newswire/article/1748koo9o5734o/watch-the-gta-online-official-gameplay-video.html)
- Epic documents World Partition as distance-based grid-cell streaming, Data Layers for runtime organization/state, and HLOD proxies for distant unloaded cells. These are available Unreal Engine mechanisms Open Game agents can use when an Unreal project and suitable version are actually available. [World Partition](https://dev.epicgames.com/documentation/en-us/unreal-engine/world-partition-in-unreal-engine), [Data Layers](https://dev.epicgames.com/documentation/unreal-engine/world-partition---data-layers-in-unreal-engine), [HLOD](https://dev.epicgames.com/documentation/en-us/unreal-engine/world-partition---hierarchical-level-of-detail-in-unreal-engine)
- Epic's MassGameplay overview documents entity representation LOD, simulation LOD, spawning, replication, and StateTree integration. Epic's Chaos Vehicles references describe composable wheel, suspension, engine, steering, tire, differential, transmission, and aerodynamic systems. Those are engine features, not proof that a generated project is tuned or production-ready. [Mass Gameplay](https://dev.epicgames.com/documentation/en-us/unreal-engine/overview-of-mass-gameplay-in-unreal-engine), [Chaos Vehicles](https://dev.epicgames.com/documentation/unreal-engine/chaos-vehicles), [Modular vehicle setup](https://dev.epicgames.com/documentation/unreal-engine/chaos-modular-vehicles-quickstart)

## Inferences Open Game may use

The combination above suggests a reliable recipe for a large-world experience: separate authored content from runtime state; stream by region; reduce far-away simulation and representation cost; couple missions to persistent world events; and verify each system through debug views and repeatable scenarios. For racing, handle the car as a set of interacting systems and tune against telemetry, rather than changing one top speed number. These are general engineering inferences, not claims about Rockstar's or Codemasters' private implementation.

## Unknowns

The proprietary games' exact source algorithms, code, parameter sets, authoring tools, content pipelines, server topology, and complete profiling budgets remain unknown from these materials. Public behavior and marketing summaries are insufficient to identify those internals. Keep these unknowns explicit in future REA reports unless an authorized target and evidence actually resolve them.

## Practical use in Open Game

Read [the open-world action playbook](../production-playbooks/open-world-action.md), [the racing simulation playbook](../production-playbooks/racing-simulation.md), and [the production quality gates](../production-playbooks/quality-and-build-gates.md) when relevant. They convert broad player-facing qualities into original subsystem designs, implementation order, measurable acceptance checks, and evidence to retain. They do not promise AAA output from one prompt or make a project legally risk-free.
