import path from 'node:path';
import { copyFile, lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const FORMAT = 'open-game-blueprint';
const openGameRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const REFERENCE_TERMS = [
  ['F1', /\bf1\b/i],
  ['Formula 1', /formula\s+one/i],
  ['Grand Theft Auto', /grand\s+theft\s+auto/i],
  ['GTA', /\bgta\b/i],
  ['Red Dead Redemption', /red\s+dead\s+redemption/i],
  ['RDR2', /\brdr\s*2\b/i],
  ['Forza Horizon', /forza\s+horizon/i],
  ['Need for Speed', /need\s+for\s+speed/i],
  ['Gran Turismo', /gran\s+turismo/i]
];

function slugify(value) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'game-project';
}

function assertString(value, label, maxLength = 4000) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} must be a non-empty string.`);
  if (value.length > maxLength) throw new Error(`${label} must be ${maxLength} characters or fewer.`);
  return value.trim();
}

export function validateBlueprint(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Blueprint must be a JSON object.');
  if (input.format !== FORMAT) throw new Error(`Blueprint format must be "${FORMAT}".`);
  if (input.version !== 1) throw new Error('Unsupported blueprint version. Expected version 1.');
  const game = input.game;
  if (!game || typeof game !== 'object') throw new Error('Blueprint is missing the game section.');
  assertString(game.title, 'Game title', 100);
  assertString(game.pitch, 'Game pitch', 4000);
  assertString(game.coreExperience, 'Core experience', 100);
  assertString(game.tone, 'Game tone', 100);
  if (game.playerName !== undefined) assertString(game.playerName, 'Player name', 40);
  if (game.targetPlatform !== undefined) assertString(game.targetPlatform, 'Target platform', 200);
  if (game.multiplayer !== undefined) assertString(game.multiplayer, 'Multiplayer requirements', 2000);
  if (game.world !== undefined) assertString(game.world, 'World and story details', 6000);
  if (game.characters !== undefined && (!Array.isArray(game.characters) || game.characters.length > 100)) throw new Error('Characters must be an array with at most 100 entries.');
  for (const [index, character] of (game.characters || []).entries()) { assertString(character?.name, `Character ${index + 1} name`, 100); if (character.description !== undefined && character.description.trim()) assertString(character.description, `Character ${index + 1} description`, 2000); }
  if (game.teamName !== undefined) assertString(game.teamName, 'Team name', 50);
  if (game.trackName !== undefined) assertString(game.trackName, 'Track name', 60);
  if (game.rivalNames !== undefined && (!Array.isArray(game.rivalNames) || game.rivalNames.length > 7)) throw new Error('Rival names must be an array with at most 7 names.');
  for (const [index, name] of (game.rivalNames || []).entries()) assertString(name, `Rival ${index + 1}`, 40);
  if (game.trackLengthKm !== undefined && (!Number.isFinite(Number(game.trackLengthKm)) || Number(game.trackLengthKm) < 1 || Number(game.trackLengthKm) > 20)) throw new Error('Track length must be between 1 and 20 km.');
  if (game.raceLaps !== undefined && (!Number.isInteger(Number(game.raceLaps)) || Number(game.raceLaps) < 1 || Number(game.raceLaps) > 12)) throw new Error('Race laps must be a whole number from 1 to 12.');
  if (game.accentColor !== undefined && !/^#[0-9a-f]{6}$/i.test(game.accentColor)) throw new Error('Accent color must be a six-digit hex color.');
  if (!Array.isArray(input.systems)) throw new Error('Blueprint systems must be an array.');
  const seen = new Set();
  for (const [index, system] of input.systems.entries()) {
    assertString(system?.name, `System ${index + 1} name`, 100);
    const id = system.id || slugify(system.name);
    if (seen.has(id)) throw new Error(`Duplicate system id: ${id}`);
    seen.add(id);
  }
  return input;
}

export function normalizeBlueprint(input) {
  validateBlueprint(input);
  const systems = input.systems.map(system => ({
    id: system.id || slugify(system.name),
    name: system.name.trim(),
    purpose: system.purpose?.trim() || `Define how ${system.name.trim().toLowerCase()} supports the core player experience.`,
    inputs: Array.isArray(system.inputs) ? system.inputs : [],
    outputs: Array.isArray(system.outputs) ? system.outputs : [],
    dependsOn: Array.isArray(system.dependsOn) ? system.dependsOn : [],
    status: system.status || 'planned'
  }));
  return {
    format: FORMAT,
    version: 1,
    createdAt: input.createdAt || new Date().toISOString(),
    game: {
      title: input.game.title.trim(),
      slug: slugify(input.game.title),
      pitch: input.game.pitch.trim(),
      coreExperience: input.game.coreExperience.trim(),
      tone: input.game.tone.trim(),
      ambition: input.game.ambition || 'Expansive',
      originality: input.game.originality || 'Original expression, world, characters, story, visual identity, audio, and implementation.',
      targetPlatform: input.game.targetPlatform || 'Choose with the creator based on their brief and available toolchains.',
      multiplayer: input.game.multiplayer || 'Follow the creator brief; do not assume multiplayer.',
      world: input.game.world || '',
      characters: Array.isArray(input.game.characters) ? input.game.characters.map(character => ({ name: character.name.trim(), description: character.description?.trim() || '', role: character.role?.trim() || '' })) : [],
      playerName: input.game.playerName || 'Player',
      teamName: input.game.teamName || '',
      rivalNames: Array.isArray(input.game.rivalNames) ? input.game.rivalNames.slice(0, 7).map(value => String(value).slice(0, 40)) : [],
      trackName: input.game.trackName || '',
      trackLengthKm: Number(input.game.trackLengthKm) || 4.2,
      raceLaps: Math.max(1, Math.min(12, Number(input.game.raceLaps) || 3)),
      accentColor: /^#[0-9a-f]{6}$/i.test(input.game.accentColor || '') ? input.game.accentColor : '#df4b36'
    },
    systems,
    production: input.production || {},
    originalityReview: Array.isArray(input.originalityReview) ? input.originalityReview : []
  };
}

export function assessOriginality(input) {
  const blueprint = normalizeBlueprint(input);
  const fields = [
    ['game title', blueprint.game.title], ['game pitch', blueprint.game.pitch],
    ['core experience', blueprint.game.coreExperience], ['team name', blueprint.game.teamName],
    ['creator character names', blueprint.game.characters.map(character => character.name).join(' ')],
    ['track name', blueprint.game.trackName], ['rival names', blueprint.game.rivalNames.join(' ')],
    ['system names', blueprint.systems.map(system => system.name).join(' ')]
  ];
  const matches = [];
  for (const [label, value] of fields) for (const [reference, pattern] of REFERENCE_TERMS) {
    if (pattern.test(value)) matches.push({ field: label, reference });
  }
  return {
    status: matches.length ? 'review-needed' : 'no-known-reference-pattern-detected',
    matches,
    notes: [
      'This lightweight scan checks selected blueprint text only. It does not analyze source code, art, audio, maps, other assets, or the finished game.',
      'A match is a prompt for creator review, not a legal conclusion. No match does not establish originality, non-infringement, or protection from a legal claim.',
      'Use distinct names, characters, stories, locations, visual identities, UI, audio, and assets; get qualified legal advice for commercial or uncertain uses.'
    ]
  };
}

async function resolveProjectPath(workspacePath, projectPath) {
  const root = await realpath(workspacePath);
  const absolute = path.resolve(root, projectPath);
  const relative = path.relative(root, absolute);
  if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error('Project path must point to a new folder inside the configured workspace.');
  }
  let current = root;
  for (const part of relative.split(path.sep)) {
    current = path.join(current, part);
    try {
      const stat = await lstat(current);
      if (stat.isSymbolicLink()) throw new Error('Project paths cannot pass through symbolic links.');
      if (current !== absolute && !stat.isDirectory()) throw new Error('A project path component is not a directory.');
    } catch (error) {
      if (error.code === 'ENOENT') break;
      throw error;
    }
  }
  return absolute;
}

function makeDesignDoc(blueprint) {
  const { game } = blueprint;
  const systemLines = blueprint.systems.length
    ? blueprint.systems.map(system => `- **${system.name}** — ${system.purpose}`).join('\n')
    : '- Add the first system that supports the core player experience.';
  return `# ${game.title}\n\n## Game vision\n\n${game.pitch}\n\n- **Core experience:** ${game.coreExperience}\n- **Tone:** ${game.tone}\n- **Ambition:** ${game.ambition}\n- **Target platform:** ${game.targetPlatform}\n- **Multiplayer:** ${game.multiplayer}\n\n${game.world ? `## World, story & special rules\n\n${game.world}\n\n` : ''}${game.characters?.length ? `## Creator-provided characters\n\n${game.characters.map(character => `- **${character.name}** — ${character.description}${character.role ? ` Role: ${character.role}.` : ''}`).join('\n')}\n\n` : ''}## Original identity\n\n${game.originality}\n\nCreate original names, characters, locations, story, visual direction, interface, and assets. Record the source and license for third-party material. This document is a creative brief, not legal clearance.\n\n## Planned game systems\n\n${systemLines}\n\n## First playable slice\n\nBuild one small but polished part that proves the defining experience. Include one representative play space, the core activity, one meaningful progression result, and a world or character reaction. Keep the larger destination intact in this document and expand in milestones.\n\n## Current status\n\n- Project created from an Open Game blueprint.\n- Engine implementation: not generated yet.\n- Next: choose or inspect the target engine, then implement the core playable slice.\n`;
}

function makeMilestoneDoc(blueprint) {
  const systems = blueprint.systems.length
    ? blueprint.systems.map((system, index) => `${index + 1}. **${system.name}** (${system.status}) — ${system.purpose} Dependencies: ${system.dependsOn.join(', ') || 'none'}.`).join('\n')
    : 'Add the systems required by the core experience and record their dependencies here.';
  return `# ${blueprint.game.title}: production plan\n\n## Destination\n\n${blueprint.game.pitch}\n\n- **Core experience:** ${blueprint.game.coreExperience}\n- **Ambition:** ${blueprint.game.ambition}\n- **Original identity:** ${blueprint.game.originality}\n\n## Full requested system set\n\n${systems}\n\n## Milestone 1 — playable proof\n\n- Implement the signature player activity in a representative environment.\n- Deliver responsive controls, camera, clear feedback, and start/success/failure/recovery states.\n- Connect at least one supporting system to shared world or player state.\n- Persist one meaningful reward or world-state change.\n- Record and run a reproducible build command.\n\n## Milestone 2 — complete connected systems\n\n- Implement every planned system above in dependency order; do not treat this milestone as optional after the slice.\n- Connect systems through explicit shared state and data, not disconnected demos.\n- Add debug/inspection affordances and acceptance checks for each system.\n\n## Milestone 3 — requested content and multiplayer\n\n- Add the locations, missions, characters, activities, and progression needed to fulfill the brief.\n- Implement the requested multiplayer topology, sessions, replication, reconnect, persistence, and deployment instructions. Mark unavailable production services as blockers instead of implying they exist.\n\n## Milestone 4 — quality, packaging, release\n\n- Validate controls, saves, references, performance, accessibility options, and asset provenance.\n- Fix build errors, package the requested target, and verify the actual artifact launches where the local environment allows.\n- Compare the packaged build against the creator's full brief; document only concrete remaining blockers.\n\n## Progress rule\n\nA playable slice is a checkpoint, not completion. Keep the destination and unimplemented acceptance criteria visible; continue implementation through the requested systems and content. Update \`OPEN_GAME_STATUS.md\` after each milestone and when resuming work.\n`;
}

function makeStatusDoc(blueprint) {
  return `# ${blueprint.game.title}: implementation status\n\n## Destination\n\n${blueprint.game.pitch}\n\n## Target\n\n- Requested platform: ${blueprint.game.targetPlatform}\n- Engine: not selected; inspect this environment and choose a buildable target.\n- Full requested systems: see [production plan](docs/MILESTONES.md).\n\n## Progress\n\n- Blueprint and production plan: created.\n- Engine implementation: not started.\n- Latest verified build: none.\n- Known external blockers: none identified yet.\n\n## Next concrete task\n\nInspect the repository and installed engine toolchains, select the actual game target, then implement and build the first playable milestone. After it works, continue through the remaining planned systems instead of stopping at the slice.\n\nUpdate this file with real evidence after each build; never mark an unrun build as verified.\n`;
}

function makeReferenceStudyDoc(blueprint) {
  return `# ${blueprint.game.title}: reference study\n\nThis is an optional, evidence-led design input. The creator's original brief remains authoritative. Do not copy a reference game's code, assets, maps, characters, story, branding, distinctive UI, or proprietary data.\n\n## Study scope\n\n- Reference title/version/platform: not selected\n- Creator-authorized target or observation source: not selected\n- Experience qualities to study: not specified\n- REA MCP available to the implementing agent: confirm at build time\n- Status: not started\n\n## Evidence ledger\n\nKeep each claim separate and cite exact REA Evidence IDs or public source links. Preserve coverage limits.\n\n| ID | Type (observed / inferred / unknown) | Claim or behavior | Evidence ID / source and version | Limitation / confidence |\n| --- | --- | --- | --- | --- |\n\n## Translation into this game's original design\n\nFor each desired quality, record a distinct requirement, original mechanic/content choice, owner system ID, and acceptance scenario. Do not turn unknown proprietary internals into implementation requirements.\n\n| Quality | Original requirement | System ID | Acceptance scenario |\n| --- | --- | --- | --- |\n\n## Unknowns and boundaries\n\n- Unknown internal details:\n- Out-of-scope material:\n- Creator-provided original characters/world that must be preserved:\n\nREA is an optional analysis toolkit, not a game generator. Each creator must connect it in the coding agent that builds this project. If no authorized target or REA tools are available, use public developer sources and creator observations and label inferences clearly.\n`;
}

function makeImplementationObligations(blueprint) {
  const systemEntries = blueprint.systems.map(system => ({
    id: `system:${system.id}`,
    kind: 'game-system',
    title: system.name,
    systemId: system.id,
    required: true,
    applicability: 'required',
    status: 'needs-agent-refinement',
    requirement: system.purpose,
    sourceRefs: [{ kind: 'blueprint-system', id: system.id }],
    dependencies: system.dependsOn.map(id => `system:${id}`),
    acceptanceCriteria: [],
    verificationEvidence: [],
    notApplicableReason: ''
  }));
  const gate = (id, title, applicability, requirement) => ({
    id: `quality:${id}`,
    kind: 'quality-gate',
    title,
    systemId: null,
    required: applicability === 'required',
    applicability,
    status: applicability === 'required' ? 'needs-agent-refinement' : 'needs-applicability-review',
    requirement,
    sourceRefs: [{ kind: 'game-brief', id: 'open-game.json' }],
    dependencies: [],
    acceptanceCriteria: [],
    verificationEvidence: [],
    notApplicableReason: ''
  });
  const qualityEntries = [
    gate('core-loop', 'Complete core gameplay loop', 'required', 'The defining player activity has start, success/failure, feedback, and recovery behavior.'),
    gate('build-launch', 'Target build and launch', 'required', 'Build and launch the selected target; retain exact command, result, logs, and artifact path.'),
    gate('performance', 'Target performance', 'required', 'Define frame-time, memory, loading, streaming, and network budgets appropriate to the selected hardware, then measure them.'),
    gate('asset-provenance', 'Asset provenance', 'required', 'Record creator/source, license, modifications, and usage for third-party assets; record generated provenance.'),
    gate('human-play-review', 'Human play review', 'required', 'Review play feel, readability, pacing, visual coherence, and fun on the stated target; record reviewer and findings.'),
    gate('save-load', 'Save/load and migration', 'if-persistent-state-is-requested', 'Verify persistence, recovery, and compatibility for the requested player/world state.'),
    gate('multiplayer', 'Requested multiplayer topology', 'if-multiplayer-is-requested', 'Verify sessions, authority, replication, disconnect/reconnect, persistence, and deployment for the requested player scale.')
  ];
  return `${JSON.stringify({
    format: 'open-game-implementation-obligations',
    version: 1,
    projectSlug: blueprint.game.slug,
    status: 'requires-agent-refinement',
    instructions: 'Expand every requirement into observable acceptance criteria before implementation. Add reference Evidence IDs to sourceRefs only when the creator supplied an authorized target and REA produced that Evidence. In verificationEvidence, record a passed method and evidenceRefs to the new game build, runtime, profile, or human review. Mark verified only after those checks actually pass. This ledger is a project handoff, not independent proof or an AAA certificate.',
    obligations: [...systemEntries, ...qualityEntries]
  }, null, 2)}\n`;
}

function makeAssetLedger() {
  return 'asset_id,asset_name,creator_or_source,source_url,license,changes,project_usage,review_status\n';
}

export async function createGameProject({ workspacePath = process.cwd(), projectPath, blueprint, creatorBrief = '' }) {
  if (!projectPath) throw new Error('projectPath is required.');
  const normalized = normalizeBlueprint(blueprint);
  const destination = await resolveProjectPath(workspacePath, projectPath);
  await mkdir(destination, { recursive: false });
  await mkdir(path.join(destination, 'docs'));
  await mkdir(path.join(destination, 'assets'));
  const skillDirectory = path.join(destination, '.agents', 'skills', 'open-game-creator');
  await mkdir(skillDirectory, { recursive: true });
  await copyFile(path.join(openGameRoot, 'skills', 'open-game-creator', 'SKILL.md'), path.join(skillDirectory, 'SKILL.md'));
  const referenceDirectory = path.join(skillDirectory, 'references');
  await mkdir(referenceDirectory);
  const skillReferences = [
    ['docs/production-playbooks/quality-and-build-gates.md', 'quality-and-build-gates.md'],
    ['docs/production-playbooks/open-world-action.md', 'open-world-action.md'],
    ['docs/production-playbooks/racing-simulation.md', 'racing-simulation.md'],
    ['docs/production-playbooks/multiplayer-networking.md', 'multiplayer-networking.md'],
    ['docs/production-playbooks/reference-led-game-reconstruction.md', 'reference-led-game-reconstruction.md'],
    ['docs/agent-ready-engine-adapter-contract.md', 'agent-ready-engine-adapter-contract.md'],
    ['docs/reverse-engineering/what-public-evidence-can-tell-us.md', 'public-evidence.md']
  ];
  await Promise.all(skillReferences.map(([source, name]) => copyFile(path.join(openGameRoot, source), path.join(referenceDirectory, name))));
  await writeFile(path.join(destination, 'open-game.json'), `${JSON.stringify(normalized, null, 2)}\n`, { flag: 'wx' });
  const agentInstructions = ['# Open Game project instructions', '', 'Read GAME_BRIEF.md first when present, then docs/GAME_DESIGN.md, docs/REFERENCE_STUDY.md, docs/IMPLEMENTATION_OBLIGATIONS.json, docs/MILESTONES.md, and OPEN_GAME_STATUS.md. Follow `.agents/skills/open-game-creator/SKILL.md` as the implementation contract.', 'Before implementation, read `.agents/skills/open-game-creator/references/quality-and-build-gates.md`, `agent-ready-engine-adapter-contract.md`, and only the relevant genre playbooks in the same references folder.', 'Before building, refine every applicable entry in docs/IMPLEMENTATION_OBLIGATIONS.json into observable acceptance criteria, dependencies, and a verification method. Keep reference evidence separate from implementation evidence. Mark an item verified only after the described check actually passes; record build/play/profile evidence under verificationEvidence and REA Evidence IDs under sourceRefs only.', 'When a commercial game is named as a reference, follow `.agents/skills/open-game-creator/references/reference-led-game-reconstruction.md`. Use REA only if its MCP tools are available in this agent and the creator supplies or identifies an authorized target. REA must be connected separately in each creator’s LLM agent; this project does not install or configure REA. If REA or a target is unavailable, use public primary sources and creator-provided observations, and label inferences and unknowns.', 'The creator brief is the destination: implement this original game in the engine and target that best fit it. Use the creator’s specified characters and world.', 'Start implementation in this task. Inspect the real project and toolchain, map the requested connected systems and acceptance checks, then write actual engine source files. If the selected free/open-source engine can be provisioned non-interactively with the current host package manager and network, install and verify it; do not change engine silently or install paid/interactive software. Build, launch, observe, and repair each coherent playable increment before continuing through the full requested systems and content.', 'Do not substitute a canned demo or stop after a pitch, blueprint, roadmap, or first playable slice while more implementation is possible. Do not describe planned, mocked, or unverified systems as implemented.', 'If a specific engine dependency, credential, external service, or creator decision blocks work, implement independent parts and record that exact blocker and the action needed to unblock it. Before ending, write the exact verification evidence, artifact paths, remaining acceptance criteria, and next concrete implementation task to OPEN_GAME_STATUS.md and open-game-progress.json.', 'Use original or properly licensed assets and update assets/ASSET_LEDGER.csv. A build or originality scan does not establish AAA quality or legal clearance.'].join('\n');
  await writeFile(path.join(destination, 'AGENTS.md'), `${agentInstructions}\n`, { flag: 'wx' });
  await writeFile(path.join(destination, 'README.md'), `# ${normalized.game.title}\n\nOriginal game project created with Open Game.\n\n## Current state\n\nThis folder contains the full game vision, agent workflow, dependency-aware production roadmap, resumable progress, and asset ledger. The coding agent should use the original brief to implement the engine project, playable systems, and packaged build; the blueprint itself is not a playable game.\n\n## Design files\n\n- [Game design](docs/GAME_DESIGN.md)\n- [Reference study and evidence ledger](docs/REFERENCE_STUDY.md)\n- [Implementation obligations and quality gates](docs/IMPLEMENTATION_OBLIGATIONS.json)\n- [Agent-ready engine adapter expectations](.agents/skills/open-game-creator/references/agent-ready-engine-adapter-contract.md)\n- [Production skill](.agents/skills/open-game-creator/SKILL.md)\n- [Open-world action playbook](.agents/skills/open-game-creator/references/open-world-action.md)\n- [Racing simulation playbook](.agents/skills/open-game-creator/references/racing-simulation.md)\n- [Multiplayer networking playbook](.agents/skills/open-game-creator/references/multiplayer-networking.md)\n- [Reference-led game reconstruction](.agents/skills/open-game-creator/references/reference-led-game-reconstruction.md)\n- [Evidence limits for commercial references](.agents/skills/open-game-creator/references/public-evidence.md)\n- [Quality and build gates](.agents/skills/open-game-creator/references/quality-and-build-gates.md)\n- [Full production plan](docs/MILESTONES.md)\n- [Implementation status](OPEN_GAME_STATUS.md)\n- [Structured progress record](open-game-progress.json)\n- [Asset provenance](assets/ASSET_LEDGER.csv)\n`, { flag: 'wx' });
  await writeFile(path.join(destination, 'docs', 'GAME_DESIGN.md'), makeDesignDoc(normalized), { flag: 'wx' });
  await writeFile(path.join(destination, 'docs', 'REFERENCE_STUDY.md'), makeReferenceStudyDoc(normalized), { flag: 'wx' });
  await writeFile(path.join(destination, 'docs', 'IMPLEMENTATION_OBLIGATIONS.json'), makeImplementationObligations(normalized), { flag: 'wx' });
  if (creatorBrief) await writeFile(path.join(destination, 'GAME_BRIEF.md'), `${creatorBrief.trim()}\n`, { flag: 'wx' });
  await writeFile(path.join(destination, 'docs', 'MILESTONES.md'), makeMilestoneDoc(normalized), { flag: 'wx' });
  await writeFile(path.join(destination, 'assets', 'ASSET_LEDGER.csv'), makeAssetLedger(), { flag: 'wx' });
  const initialProgress = {
    engine: '', target: normalized.game.targetPlatform, phase: 'brief-captured', completedSystems: [],
    verification: [], artifacts: [], blockers: [],
    nextTask: 'Inspect the existing project and installed engine toolchains; select the best real build target.'
  };
  await writeFile(path.join(destination, 'open-game-progress.json'), `${JSON.stringify(initialProgress, null, 2)}\n`, { flag: 'wx' });
  await writeFile(path.join(destination, 'OPEN_GAME_STATUS.md'), makeStatusDoc(normalized), { flag: 'wx' });
  return { projectPath: destination, blueprint: normalized, createdFiles: ['open-game.json', 'AGENTS.md', 'README.md', ...(creatorBrief ? ['GAME_BRIEF.md'] : []), '.agents/skills/open-game-creator/SKILL.md', ...skillReferences.map(([, name]) => `.agents/skills/open-game-creator/references/${name}`), 'docs/GAME_DESIGN.md', 'docs/REFERENCE_STUDY.md', 'docs/IMPLEMENTATION_OBLIGATIONS.json', 'docs/MILESTONES.md', 'OPEN_GAME_STATUS.md', 'open-game-progress.json', 'assets/ASSET_LEDGER.csv'] };
}

export async function readGameProject({ workspacePath = process.cwd(), projectPath }) {
  if (!projectPath) throw new Error('projectPath is required.');
  const destination = await resolveProjectPath(workspacePath, projectPath);
  const text = await readFile(path.join(destination, 'open-game.json'), 'utf8');
  return normalizeBlueprint(JSON.parse(text));
}

export async function readGameObligations({ workspacePath = process.cwd(), projectPath }) {
  const destination = await resolveProjectPath(workspacePath, projectPath);
  return JSON.parse(await readFile(path.join(destination, 'docs', 'IMPLEMENTATION_OBLIGATIONS.json'), 'utf8'));
}

export async function reviewGameObligations({ workspacePath = process.cwd(), projectPath }) {
  const [blueprint, ledger] = await Promise.all([
    readGameProject({ workspacePath, projectPath }),
    readGameObligations({ workspacePath, projectPath })
  ]);
  if (ledger?.format !== 'open-game-implementation-obligations' || ledger.version !== 1 || !Array.isArray(ledger.obligations)) {
    throw new Error('Implementation obligations file has an unsupported format or is missing its obligations list.');
  }
  const allowedStatuses = new Set(['needs-agent-refinement', 'needs-applicability-review', 'planned', 'in-progress', 'blocked', 'implemented', 'verified', 'not-applicable']);
  const knownSystems = new Set(blueprint.systems.map(system => system.id));
  const ids = new Set();
  const diagnostics = [];
  const entries = ledger.obligations;
  for (const entry of entries) {
    if (!entry || typeof entry.id !== 'string' || !entry.id.trim()) {
      diagnostics.push({ code: 'missing-id', message: 'Every obligation requires a non-empty id.' });
      continue;
    }
    if (ids.has(entry.id)) diagnostics.push({ id: entry.id, code: 'duplicate-id', message: 'Obligation IDs must be unique.' });
    ids.add(entry.id);
    if (!allowedStatuses.has(entry.status)) diagnostics.push({ id: entry.id, code: 'invalid-status', message: `Unsupported status: ${entry.status}.` });
    if (typeof entry.required !== 'boolean') diagnostics.push({ id: entry.id, code: 'invalid-required-flag', message: 'Every obligation must explicitly set required to true or false.' });
    if (entry.systemId && !knownSystems.has(entry.systemId)) diagnostics.push({ id: entry.id, code: 'unknown-system', message: `Owning system ${entry.systemId} is not in the project blueprint.` });
    if (!Array.isArray(entry.dependencies)) diagnostics.push({ id: entry.id, code: 'invalid-dependencies', message: 'Dependencies must be an array of obligation IDs.' });
    if (entry.status === 'verified') {
      if (!Array.isArray(entry.acceptanceCriteria) || entry.acceptanceCriteria.length === 0) diagnostics.push({ id: entry.id, code: 'verified-without-criteria', message: 'A verified obligation must have acceptance criteria.' });
      const hasEvidence = Array.isArray(entry.verificationEvidence) && entry.verificationEvidence.some(item => item && typeof item.method === 'string' && item.method.trim() && item.result === 'passed' && Array.isArray(item.evidenceRefs) && item.evidenceRefs.some(ref => typeof ref === 'string' && ref.trim()));
      if (!hasEvidence) diagnostics.push({ id: entry.id, code: 'verified-without-evidence', message: 'A verified obligation needs a passed result, verification method, and at least one evidence reference.' });
    }
    if (entry.status === 'not-applicable' && (entry.required !== false || typeof entry.notApplicableReason !== 'string' || !entry.notApplicableReason.trim())) {
      diagnostics.push({ id: entry.id, code: 'invalid-not-applicable', message: 'Mark not-applicable only after setting required=false and recording a reason.' });
    }
    for (const dependency of Array.isArray(entry.dependencies) ? entry.dependencies : []) {
      if (typeof dependency !== 'string') diagnostics.push({ id: entry.id, code: 'invalid-dependency', message: 'Dependency IDs must be strings.' });
      else if (!entries.some(candidate => candidate?.id === dependency)) diagnostics.push({ id: entry.id, code: 'missing-dependency', message: `Dependency ${dependency} does not exist in the ledger.` });
    }
  }
  const incomplete = entries.filter(entry => entry?.status !== 'verified' && entry?.status !== 'not-applicable').map(entry => ({ id: entry?.id || null, title: entry?.title || 'Untitled obligation', status: entry?.status || 'invalid' }));
  return {
    project: blueprint.game.title,
    status: diagnostics.length ? 'ledger-needs-repair' : incomplete.length ? 'incomplete' : 'all-required-obligations-marked-complete',
    counts: { total: entries.length, markedVerified: entries.filter(entry => entry?.status === 'verified').length, markedNotApplicable: entries.filter(entry => entry?.status === 'not-applicable').length, incomplete: incomplete.length, diagnostics: diagnostics.length },
    incomplete,
    diagnostics,
    limitation: 'This checks ledger consistency only. It does not inspect game source, run builds/scenarios, validate evidence references, judge game quality, or establish AAA readiness.'
  };
}

function validateProgressList(value, label) {
  if (!Array.isArray(value) || value.length > 300 || value.some(item => typeof item !== 'string' || item.length > 2000)) {
    throw new Error(`${label} must be a list of at most 300 strings, each no longer than 2,000 characters.`);
  }
  return value.map(item => item.trim()).filter(Boolean);
}

export async function readGameProgress({ workspacePath = process.cwd(), projectPath }) {
  const destination = await resolveProjectPath(workspacePath, projectPath);
  const progressPath = path.join(destination, 'open-game-progress.json');
  try { return JSON.parse(await readFile(progressPath, 'utf8')); }
  catch (error) {
    if (error.code === 'ENOENT') throw new Error('This project has no Open Game progress record yet. Create it from a blueprint first.');
    throw error;
  }
}

export async function updateGameProgress({ workspacePath = process.cwd(), projectPath, engine, target, phase, completedSystems, verification, artifacts, blockers, nextTask }) {
  const destination = await resolveProjectPath(workspacePath, projectPath);
  const previous = await readGameProgress({ workspacePath, projectPath });
  const next = {
    ...previous,
    ...(engine !== undefined ? { engine: assertString(engine, 'Engine', 200) } : {}),
    ...(target !== undefined ? { target: assertString(target, 'Target', 200) } : {}),
    ...(phase !== undefined ? { phase: assertString(phase, 'Phase', 100) } : {}),
    ...(completedSystems !== undefined ? { completedSystems: validateProgressList(completedSystems, 'Completed systems') } : {}),
    ...(verification !== undefined ? { verification: validateProgressList(verification, 'Verification evidence') } : {}),
    ...(artifacts !== undefined ? { artifacts: validateProgressList(artifacts, 'Artifacts') } : {}),
    ...(blockers !== undefined ? { blockers: validateProgressList(blockers, 'Blockers') } : {}),
    ...(nextTask !== undefined ? { nextTask: assertString(nextTask, 'Next task', 2000) } : {}),
    updatedAt: new Date().toISOString()
  };
  await writeFile(path.join(destination, 'open-game-progress.json'), `${JSON.stringify(next, null, 2)}\n`);
  const section = (title, rows) => `## ${title}\n\n${rows.length ? rows.map(value => `- ${value}`).join('\n') : '- None recorded.'}\n`;
  const markdown = [
    '# Open Game progress', '',
    `- Updated: ${next.updatedAt}`,
    `- Engine: ${next.engine || 'Not selected'}`,
    `- Target: ${next.target || 'Not selected'}`,
    `- Phase: ${next.phase || 'Not started'}`, '',
    section('Completed systems', next.completedSystems),
    section('Build and play verification', next.verification),
    section('Artifacts', next.artifacts),
    section('Blockers', next.blockers),
    '## Next concrete task', '', next.nextTask, ''
  ].join('\n');
  await writeFile(path.join(destination, 'OPEN_GAME_STATUS.md'), markdown);
  return next;
}

export async function addGameSystem({ workspacePath = process.cwd(), projectPath, name, purpose, inputs = [], outputs = [], dependsOn = [] }) {
  const blueprint = await readGameProject({ workspacePath, projectPath });
  const id = slugify(assertString(name, 'System name', 100));
  if (blueprint.systems.some(system => system.id === id)) throw new Error(`A system named "${name}" already exists.`);
  const existing = new Set(blueprint.systems.map(system => system.id));
  for (const dependency of dependsOn) if (!existing.has(dependency)) throw new Error(`Unknown system dependency: ${dependency}`);
  blueprint.systems.push({ id, name: name.trim(), purpose: purpose?.trim() || `Define how ${name.trim().toLowerCase()} supports the core player experience.`, inputs, outputs, dependsOn, status: 'planned' });
  const destination = await resolveProjectPath(workspacePath, projectPath);
  const obligationsPath = path.join(destination, 'docs', 'IMPLEMENTATION_OBLIGATIONS.json');
  let ledger;
  try {
    ledger = JSON.parse(await readFile(obligationsPath, 'utf8'));
    if (ledger?.format !== 'open-game-implementation-obligations' || ledger.version !== 1 || !Array.isArray(ledger.obligations)) throw new Error('Existing implementation obligations ledger has an unsupported format; it was not overwritten.');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    ledger = JSON.parse(makeImplementationObligations({ ...blueprint, systems: blueprint.systems.slice(0, -1) }));
  }
  const newSystemLedger = JSON.parse(makeImplementationObligations({ ...blueprint, systems: [blueprint.systems.at(-1)] }));
  const newSystemObligation = newSystemLedger.obligations.find(entry => entry.kind === 'game-system');
  if (!ledger.obligations.some(entry => entry?.id === newSystemObligation.id)) ledger.obligations.push(newSystemObligation);
  // Validate and prepare the ledger before touching the blueprint or design docs.
  // A malformed existing ledger must not leave the project half-updated.
  await writeFile(obligationsPath, `${JSON.stringify(ledger, null, 2)}\n`);
  await writeFile(path.join(destination, 'open-game.json'), `${JSON.stringify(blueprint, null, 2)}\n`);
  await writeFile(path.join(destination, 'docs', 'GAME_DESIGN.md'), makeDesignDoc(blueprint));
  await writeFile(path.join(destination, 'docs', 'MILESTONES.md'), makeMilestoneDoc(blueprint));
  return blueprint;
}

export async function planVerticalSlice({ workspacePath = process.cwd(), projectPath }) {
  const blueprint = await readGameProject({ workspacePath, projectPath });
  const systems = blueprint.systems;
  const known = new Set(systems.map(system => system.id));
  const indegree = new Map(systems.map(system => [system.id, 0]));
  const downstream = new Map(systems.map(system => [system.id, []]));
  for (const system of systems) {
    for (const dependency of system.dependsOn) {
      if (!known.has(dependency)) throw new Error(`System "${system.name}" depends on missing system "${dependency}".`);
      indegree.set(system.id, indegree.get(system.id) + 1);
      downstream.get(dependency).push(system.id);
    }
  }
  const queue = [...indegree].filter(([, count]) => count === 0).map(([id]) => id);
  const order = [];
  while (queue.length) {
    const id = queue.shift();
    order.push(id);
    for (const next of downstream.get(id)) {
      indegree.set(next, indegree.get(next) - 1);
      if (indegree.get(next) === 0) queue.push(next);
    }
  }
  if (order.length !== systems.length) throw new Error('System dependencies contain a cycle. Resolve the cycle before planning a build.');
  const byId = new Map(systems.map(system => [system.id, system]));
  return {
    game: blueprint.game.title,
    coreExperience: blueprint.game.coreExperience,
    productionRoadmap: {
      destination: blueprint.game.pitch,
      systemsInDependencyOrder: order.map(id => {
        const system = byId.get(id);
        return { id, name: system.name, purpose: system.purpose, status: system.status, dependsOn: system.dependsOn };
      }),
      phases: [
        'Build and verify a playable proof of the core experience.',
        'Implement every planned system in dependency order and connect them through shared game state.',
        'Deliver the requested authored world, missions, characters, progression, and multiplayer scope.',
        'Run quality checks, package the target platform, launch the artifact, and record evidence and blockers.'
      ],
      completionRule: 'The first playable slice is a checkpoint, not completion; continue until the requested systems are built and verified or a concrete external blocker remains.'
    },
    firstPlayableSlice: {
      goal: `Prove the core experience: ${blueprint.game.coreExperience}.`,
      systemsInBuildOrder: order.map(id => ({ id, name: byId.get(id).name })),
      acceptanceCriteria: [
        'The player can start and complete one representative activity.',
        'Controls, camera, and feedback clearly communicate the core experience.',
        'At least one supporting system reacts to player actions through shared game state.',
        'Success, failure, and recovery have intentional outcomes.',
        'A progression or world-state change persists for the next session.'
      ],
      next: 'Implement and verify this slice in the selected game engine, then continue down the full production roadmap.'
    }
  };
}

export async function resolveWorkspaceDestination(workspacePath, projectPath) {
  return resolveProjectPath(workspacePath, projectPath);
}
