import { spawnSync } from 'node:child_process';

const CANDIDATES = [
  { engine: 'Godot', commands: ['godot', 'godot4'], args: ['--version'] },
  { engine: 'Unreal Engine', commands: ['UnrealEditor-Cmd', 'UnrealEditor'], args: ['-version'] },
  { engine: 'Unity', commands: ['Unity', 'Unity.exe'], args: ['-version'] },
  { engine: 'Blender', commands: ['blender'], args: ['--version'] },
  { engine: '.NET SDK', commands: ['dotnet'], args: ['--version'] },
  { engine: 'Python', commands: ['python3', 'python'], args: ['--version'] },
  { engine: 'Node.js', commands: ['node'], args: ['--version'] },
  { engine: 'npm', commands: ['npm'], args: ['--version'] }
];

function probe(binary, args) {
  const result = spawnSync(binary, args, { encoding: 'utf8', timeout: 4000, maxBuffer: 64 * 1024, windowsHide: true });
  if (result.error?.code === 'ENOENT') return null;
  const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim().split(/\r?\n/).slice(0, 3).join(' ');
  return {
    command: binary,
    available: !result.error,
    versionOutput: output || null,
    exitCode: result.status,
    diagnostic: result.error?.message || null
  };
}

export function inspectGameToolchains() {
  const tools = CANDIDATES.map(candidate => {
    const probes = candidate.commands.map(command => probe(command, candidate.args));
    const found = probes.find(Boolean) || { command: null, available: false, versionOutput: null, exitCode: null, diagnostic: 'No matching executable found on PATH.' };
    return { engine: candidate.engine, ...found };
  });
  return {
    inspectedAt: new Date().toISOString(),
    host: { platform: process.platform, architecture: process.arch, nodeVersion: process.version },
    searchScope: 'Executable lookup on PATH only.',
    tools,
    notes: [
      'Detection means only that a command responded; it does not prove that project templates, export modules, platform SDKs, licenses, or assets are available.',
      'Select an engine that fits the requested game and target, then run a real project import/build/export and record the result.',
      'If no suitable engine is installed, report the exact missing dependency and create source only when it can be meaningfully verified in this environment.'
    ]
  };
}
