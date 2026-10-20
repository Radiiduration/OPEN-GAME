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
  await writeFile(path.join(destination, 'open-game.json'), `${JSON.stringify(normalized, null, 2)}\n`, { flag: 'wx' });
  const agentInstructions = ['# Open Game project instructions', '', 'Read GAME_BRIEF.md first when present, then docs/GAME_DESIGN.md, docs/MILESTONES.md, and OPEN_GAME_STATUS.md. Follow `.agents/skills/open-game-creator/SKILL.md` for the complete production workflow.', 'The creator brief is the destination: implement this original game in the engine and target that best fit it. Use the creator’s specified characters and world.', 'Do not substitute a canned demo or stop after planning or a vertical slice; build, run, package, and continue through the requested systems where the environment permits.', 'Record exact verification and blockers in OPEN_GAME_STATUS.md and open-game-progress.json. Use original or properly licensed assets and update assets/ASSET_LEDGER.csv.'].join('\n');
  await writeFile(path.join(destination, 'AGENTS.md'), `${agentInstructions}\n`, { flag: 'wx' });
  await writeFile(path.join(destination, 'README.md'), `# ${normalized.game.title}\n\nOriginal game project created with Open Game.\n\n## Current state\n\nThis folder contains the full game vision, agent workflow, dependency-aware production roadmap, resumable progress, and asset ledger. The coding agent should use the original brief to implement the engine project, playable systems, and packaged build; the blueprint itself is not a playable game.\n\n## Design files\n\n- [Game design](docs/GAME_DESIGN.md)\n- [Production skill](.agents/skills/open-game-creator/SKILL.md)\n- [Full production plan](docs/MILESTONES.md)\n- [Implementation status](OPEN_GAME_STATUS.md)\n- [Structured progress record](open-game-progress.json)\n- [Asset provenance](assets/ASSET_LEDGER.csv)\n`, { flag: 'wx' });
  await writeFile(path.join(destination, 'docs', 'GAME_DESIGN.md'), makeDesignDoc(normalized), { flag: 'wx' });
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
  return { projectPath: destination, blueprint: normalized, createdFiles: ['open-game.json', 'AGENTS.md', 'README.md', ...(creatorBrief ? ['GAME_BRIEF.md'] : []), '.agents/skills/open-game-creator/SKILL.md', 'docs/GAME_DESIGN.md', 'docs/MILESTONES.md', 'OPEN_GAME_STATUS.md', 'open-game-progress.json', 'assets/ASSET_LEDGER.csv'] };
}

export async function readGameProject({ workspacePath = process.cwd(), projectPath }) {
  if (!projectPath) throw new Error('projectPath is required.');
  const destination = await resolveProjectPath(workspacePath, projectPath);
  const text = await readFile(path.join(destination, 'open-game.json'), 'utf8');
  return normalizeBlueprint(JSON.parse(text));
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
