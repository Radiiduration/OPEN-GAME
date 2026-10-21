import path from 'node:path';
import { lstat, mkdir, readdir, stat } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import { resolveWorkspaceDestination } from './project.js';
import { inspectGameToolchains } from './toolchains.js';

const IGNORED_DIRECTORIES = new Set(['.git', 'Library', 'Temp', 'Logs', 'Obj', 'node_modules', 'build', 'dist', '.godot', 'Binaries', 'Intermediate', 'Saved']);
const LAUNCH_IGNORED_DIRECTORIES = new Set(['.git', 'Library', 'Temp', 'Logs', 'Obj', 'node_modules', 'build', 'dist', '.godot', 'Engine', 'Intermediate', 'Saved']);
const MAX_PROJECT_FILES = 30000;
const LAUNCH_SCAN_LIMIT = 5000;

async function findProjectMarkers(root) {
  const markers = [];
  const queue = [{ directory: root, relative: '' }];
  let visited = 0;
  while (queue.length && visited < MAX_PROJECT_FILES) {
    const current = queue.shift();
    let entries;
    try { entries = await readdir(current.directory, { withFileTypes: true }); }
    catch { continue; }
    for (const entry of entries) {
      if (++visited > MAX_PROJECT_FILES) break;
      const relative = path.join(current.relative, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name) && !entry.name.startsWith('.')) queue.push({ directory: path.join(current.directory, entry.name), relative });
      } else if (entry.isFile()) {
        if (entry.name === 'project.godot') markers.push({ engine: 'Godot', projectFile: relative });
        else if (entry.name === 'ProjectVersion.txt' && current.relative.split(path.sep).includes('ProjectSettings')) markers.push({ engine: 'Unity', projectFile: '.' });
        else if (entry.name.endsWith('.uproject')) markers.push({ engine: 'Unreal Engine', projectFile: relative });
      }
    }
  }
  return { markers, truncated: visited >= MAX_PROJECT_FILES };
}

export async function inspectGameEngineProject({ workspacePath = process.cwd(), projectPath }) {
  if (!projectPath) throw new Error('projectPath is required.');
  const root = await resolveWorkspaceDestination(workspacePath, projectPath);
  const { markers, truncated } = await findProjectMarkers(root);
  const unique = new Map();
  for (const marker of markers) {
    unique.set(`${marker.engine}:${marker.projectFile}`, marker);
  }
  const detectedTools = inspectGameToolchains().tools;
  const engineAvailability = Object.fromEntries(['Godot', 'Unity', 'Unreal Engine'].map(engine => {
    const executable = detectedTools.find(tool => tool.engine === engine);
    return [engine, {
      executableAvailable: executable?.available ?? false,
      command: engine === 'Godot' ? process.env.GODOT_BIN || executable?.command || null : engine === 'Unity' ? process.env.UNITY_BIN || executable?.command || null : executable?.command || null,
      version: executable?.versionOutput || null
    }];
  }));
  const unrealAutomationTool = process.env.UNREAL_ENGINE_ROOT
    ? path.join(process.env.UNREAL_ENGINE_ROOT, 'Engine', 'Build', 'BatchFiles', 'RunUAT.sh')
    : null;
  let unrealUatAvailable = false;
  if (unrealAutomationTool && process.platform !== 'win32') {
    try { unrealUatAvailable = (await lstat(unrealAutomationTool)).isFile(); } catch { unrealUatAvailable = false; }
  }
  return {
    root,
    projects: [...unique.values()],
    scan: { maxFiles: MAX_PROJECT_FILES, truncated },
    engineAvailability: { ...engineAvailability, 'Unreal Engine': { ...engineAvailability['Unreal Engine'], automationToolAvailable: unrealUatAvailable, automationTool: unrealAutomationTool } },
    availableOperations: {
      Godot: ['inspect', 'headless-editor-import', 'export-with-configured-preset', 'run-project-owned-scenario-runner'],
      Unity: ['inspect', 'batch-build-with-project-build-method', 'run-project-owned-scenario-method'],
      'Unreal Engine': ['inspect', 'BuildCookRun-through-RunUAT-when-UNREAL_ENGINE_ROOT-is-configured', 'run-scenarios-through-Unreal-Automation-Framework-directly']
    },
    limitation: 'Project marker detection is structural. It does not prove the engine version, licenses, SDKs, export templates, assets, successful build, playable quality, or AAA readiness.'
  };
}

function run(command, args, { cwd, env = process.env, timeoutMs = 900000 }) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    encoding: 'utf8',
    timeout: timeoutMs,
    maxBuffer: 16 * 1024 * 1024,
    windowsHide: true
  });
  const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
  if (result.error) {
    const error = new Error(`Engine command failed to start or timed out: ${result.error.message}${output ? `\n${output.slice(-12000)}` : ''}`);
    error.code = result.error.code;
    error.status = result.status;
    throw error;
  }
  return { command, args, exitCode: result.status, signal: result.signal, output: output.slice(-24000) };
}

async function prepareNewArtifact(outputPath) {
  try { await lstat(outputPath); throw new Error(`Build output already exists: ${outputPath}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  await mkdir(path.dirname(outputPath), { recursive: true });
}

async function requireArtifact(outputPath) {
  try {
    const stat = await lstat(outputPath);
    return stat.isFile() || stat.isDirectory();
  }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}

function installedEngineCommand(engine, override, fallback) {
  if (override) return override;
  const detected = inspectGameToolchains().tools.find(tool => tool.engine === engine);
  if (!detected?.available || !detected.command) throw new Error(`${engine} was not found on PATH. Install it or set ${engine === 'Godot' ? 'GODOT_BIN' : 'UNITY_BIN'} to its executable path before building.`);
  return detected.command || fallback;
}

export async function buildGameWithEngine({ workspacePath = process.cwd(), projectPath, outputPath, engine = 'auto', preset, buildMethod, target = 'desktop', mode = 'release' }) {
  if (!projectPath || !outputPath) throw new Error('projectPath and outputPath are required.');
  const root = await resolveWorkspaceDestination(workspacePath, projectPath);
  const output = await resolveWorkspaceDestination(workspacePath, outputPath);
  if (!['release', 'debug'].includes(mode)) throw new Error('mode must be "release" or "debug".');
  if (output === root || output.startsWith(`${root}${path.sep}`)) throw new Error('Build output must be outside the editable engine project folder.');
  const inspection = await inspectGameEngineProject({ workspacePath, projectPath });
  const projects = inspection.projects;
  const selected = engine === 'auto'
    ? (projects.length === 1 ? projects[0] : null)
    : projects.find(item => item.engine.toLowerCase() === engine.toLowerCase() || (engine.toLowerCase() === 'unreal' && item.engine === 'Unreal Engine'));
  if (!selected) throw new Error(projects.length > 1 ? `Multiple engine projects were found. Specify engine explicitly: ${projects.map(item => `${item.engine} (${item.projectFile})`).join(', ')}` : `No ${engine === 'auto' ? 'supported' : engine} project was found under ${root}.`);
  const projectFile = path.resolve(root, selected.projectFile);
  if (selected.engine === 'Godot') {
    if (!preset?.trim()) throw new Error('Godot export requires the exact name of a preset from export_presets.cfg. Open Game will not invent an export target.');
    const binary = installedEngineCommand('Godot', process.env.GODOT_BIN, 'godot');
    const exportPath = path.resolve(output);
    await prepareNewArtifact(exportPath);
    const flag = mode === 'debug' ? '--export-debug' : '--export-release';
    const result = run(binary, ['--headless', '--path', path.dirname(projectFile), flag, preset, exportPath], { cwd: root });
    if (result.exitCode !== 0) throw new Error(`Godot export exited with ${result.exitCode ?? result.signal}.\n${result.output}`);
    if (!await requireArtifact(exportPath)) throw new Error(`Godot reported success but did not create the requested artifact at ${exportPath}.\n${result.output}`);
    return { engine: selected.engine, projectFile, artifact: exportPath, build: result, limitation: 'A successful export is not runtime, scenario, performance, or quality verification.' };
  }
  if (selected.engine === 'Unity') {
    if (!buildMethod?.trim()) throw new Error('Unity batch builds require a project-owned static build method (for example GameBuild.PerformBuild) that reads OPEN_GAME_BUILD_OUTPUT and OPEN_GAME_BUILD_TARGET.');
    if (!/^[A-Za-z_][A-Za-z0-9_.]*$/.test(buildMethod)) throw new Error('buildMethod must be a fully qualified C# method name using letters, digits, underscores, and dots.');
    const binary = installedEngineCommand('Unity', process.env.UNITY_BIN, process.platform === 'win32' ? 'Unity.exe' : 'Unity');
    const unityTarget = target === 'desktop' ? ({ darwin: 'StandaloneOSX', win32: 'StandaloneWindows64', linux: 'StandaloneLinux64' }[process.platform] || 'StandaloneLinux64') : target;
    await prepareNewArtifact(output);
    const args = ['-batchmode', '-nographics', '-quit', '-projectPath', projectFile, '-buildTarget', unityTarget, '-executeMethod', buildMethod, '-logFile', '-'];
    const result = run(binary, args, { cwd: root, env: { ...process.env, OPEN_GAME_BUILD_OUTPUT: output, OPEN_GAME_BUILD_TARGET: unityTarget, OPEN_GAME_BUILD_MODE: mode } });
    if (result.exitCode !== 0) throw new Error(`Unity batch build exited with ${result.exitCode ?? result.signal}.\n${result.output}`);
    if (!await requireArtifact(output)) throw new Error(`Unity reported success but did not create OPEN_GAME_BUILD_OUTPUT at ${output}.\n${result.output}`);
    return { engine: selected.engine, target: unityTarget, projectFile, artifact: output, build: result, limitation: 'The project build method must honor OPEN_GAME_BUILD_OUTPUT. A successful editor batch exit is not runtime, scenario, performance, or quality verification.' };
  }
  if (selected.engine === 'Unreal Engine') {
    const engineRoot = process.env.UNREAL_ENGINE_ROOT;
    if (!engineRoot) throw new Error('Set UNREAL_ENGINE_ROOT to the installed Unreal Engine directory before packaging an Unreal project.');
    if (process.platform === 'win32') throw new Error('The Unreal adapter currently invokes RunUAT.sh and supports macOS/Linux hosts; use RunUAT.bat directly from the coding agent on Windows.');
    const automationTool = path.join(engineRoot, 'Engine', 'Build', 'BatchFiles', 'RunUAT.sh');
    const unrealTarget = target === 'desktop' ? ({ darwin: 'Mac', linux: 'Linux' }[process.platform] || 'Linux') : target;
    const config = mode === 'debug' ? 'Development' : 'Shipping';
    await prepareNewArtifact(output);
    const args = [
      'BuildCookRun', `-project=${projectFile}`, '-noP4', `-platform=${unrealTarget}`,
      `-clientconfig=${config}`, '-build', '-cook', '-stage', '-pak', '-archive',
      `-archivedirectory=${output}`
    ];
    const result = run(automationTool, args, { cwd: root, timeoutMs: 1800000 });
    if (result.exitCode !== 0) throw new Error(`Unreal BuildCookRun exited with ${result.exitCode ?? result.signal}.\n${result.output}`);
    if (!await requireArtifact(output)) throw new Error(`Unreal reported success but did not create the archive directory at ${output}.\n${result.output}`);
    return { engine: selected.engine, target: unrealTarget, configuration: config, projectFile, artifact: output, build: result, limitation: 'A successful BuildCookRun is not proof the packaged game launches, passes gameplay scenarios, meets performance targets, or has AAA quality.' };
  }
  throw new Error(`No build adapter is registered for ${selected.engine}.`);
}

async function findLaunchCandidates(root) {
  const candidates = [];
  const queue = [root];
  let visited = 0;
  while (queue.length && visited < LAUNCH_SCAN_LIMIT) {
    const directory = queue.shift();
    let entries;
    try { entries = await readdir(directory, { withFileTypes: true }); }
    catch { continue; }
    for (const entry of entries) {
      if (++visited > LAUNCH_SCAN_LIMIT) break;
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.endsWith('.app')) candidates.push(fullPath);
        else if (!LAUNCH_IGNORED_DIRECTORIES.has(entry.name) && !entry.name.startsWith('.')) queue.push(fullPath);
      } else if (entry.isFile() && (entry.name.toLowerCase().endsWith('.exe') || process.platform !== 'win32')) {
        try {
          const metadata = await stat(fullPath);
          if (process.platform === 'win32' || (metadata.mode & 0o111) !== 0) candidates.push(fullPath);
        } catch { /* ignore files removed during scan */ }
      }
    }
  }
  return { candidates, truncated: visited >= LAUNCH_SCAN_LIMIT };
}

function startDetached(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, detached: true, stdio: 'ignore', windowsHide: true });
    child.once('error', reject);
    child.once('spawn', () => {
      child.unref();
      resolve({ pid: child.pid ?? null });
    });
  });
}

export async function launchGameArtifact({ workspacePath = process.cwd(), artifactPath, executablePath }) {
  if (!artifactPath) throw new Error('artifactPath is required.');
  const artifact = await resolveWorkspaceDestination(workspacePath, artifactPath);
  const artifactStat = await lstat(artifact);
  let target = artifact;
  if (executablePath) {
    target = await resolveWorkspaceDestination(workspacePath, path.join(artifactPath, executablePath));
    const relative = path.relative(artifact, target);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('executablePath must stay inside artifactPath.');
  } else if (artifactStat.isDirectory() && artifact.endsWith('.app') && process.platform === 'darwin') {
    target = artifact;
  } else if (artifactStat.isDirectory()) {
    const { candidates, truncated } = await findLaunchCandidates(artifact);
    if (candidates.length !== 1) throw new Error(`Expected one launchable artifact but found ${candidates.length}${truncated ? ' (scan limit reached)' : ''}. Supply executable_path to select one: ${candidates.map(candidate => path.relative(artifact, candidate)).slice(0, 20).join(', ') || 'none found'}`);
    target = candidates[0];
  }
  if (process.platform === 'darwin' && target.endsWith('.app')) {
    const started = await startDetached('open', ['-a', target], path.dirname(target));
    return { status: 'launch-requested', artifact: target, launcherPid: started.pid, limitation: 'macOS accepted an app-open request. This does not confirm that the game reached its menu or that gameplay works.' };
  }
  const metadata = await stat(target);
  if (!metadata.isFile()) throw new Error(`Launch target must be an executable file or a macOS .app bundle: ${target}`);
  if (process.platform !== 'win32' && (metadata.mode & 0o111) === 0) throw new Error(`Launch target is not executable: ${target}`);
  const started = await startDetached(target, [], path.dirname(target));
  return { status: 'process-started', artifact: target, pid: started.pid, limitation: 'Process creation succeeded. The game still needs runtime observation and gameplay scenario checks.' };
}

export async function runGameEngineScenario({ workspacePath = process.cwd(), projectPath, scenarioId, engine = 'auto', unityMethod }) {
  if (!projectPath || !scenarioId) throw new Error('projectPath and scenarioId are required.');
  if (!/^[a-z0-9][a-z0-9._-]{0,99}$/i.test(scenarioId)) throw new Error('scenarioId must be a short stable ID using letters, numbers, dots, underscores, or hyphens.');
  const root = await resolveWorkspaceDestination(workspacePath, projectPath);
  const inspection = await inspectGameEngineProject({ workspacePath, projectPath });
  const selected = engine === 'auto'
    ? (inspection.projects.length === 1 ? inspection.projects[0] : null)
    : inspection.projects.find(item => item.engine.toLowerCase() === engine.toLowerCase() || (engine.toLowerCase() === 'unreal' && item.engine === 'Unreal Engine'));
  if (!selected) throw new Error('Specify one unambiguous engine project before running a scenario.');
  let binary;
  let args;
  let env = process.env;
  if (selected.engine === 'Godot') {
    const runner = path.join(root, 'tests', 'open_game_scenario_runner.gd');
    try { if (!(await lstat(runner)).isFile()) throw new Error('not a regular file'); }
    catch { throw new Error('Add tests/open_game_scenario_runner.gd to the Godot project. It should execute the named scenario and exit non-zero on any failed acceptance check.'); }
    binary = installedEngineCommand('Godot', process.env.GODOT_BIN, 'godot');
    const projectFile = path.resolve(root, selected.projectFile);
    args = ['--headless', '--path', path.dirname(projectFile), '--script', 'res://tests/open_game_scenario_runner.gd', '--', '--scenario', scenarioId];
  } else if (selected.engine === 'Unity') {
    if (!unityMethod?.trim() || !/^[A-Za-z_][A-Za-z0-9_.]*$/.test(unityMethod)) throw new Error('Unity scenario runs require a project-owned static method name (for example GameScenarios.RunOpenGameScenario) that reads OPEN_GAME_SCENARIO_ID and throws on failure.');
    binary = installedEngineCommand('Unity', process.env.UNITY_BIN, process.platform === 'win32' ? 'Unity.exe' : 'Unity');
    const projectRoot = path.resolve(root, selected.projectFile);
    args = ['-batchmode', '-nographics', '-quit', '-projectPath', projectRoot, '-executeMethod', unityMethod, '-logFile', '-'];
    env = { ...process.env, OPEN_GAME_SCENARIO_ID: scenarioId };
  } else {
    throw new Error('Unreal scenario execution is not implemented by the adapter. Use the project’s Unreal Automation Framework from the coding agent and attach the resulting log to the obligation evidence.');
  }
  const result = run(binary, args, { cwd: root, env, timeoutMs: 600000 });
  return {
    engine: selected.engine,
    scenarioId,
    passed: result.exitCode === 0,
    exitCode: result.exitCode,
    signal: result.signal,
    command: result.command,
    args: result.args,
    output: result.output,
    evidenceAuthority: 'engine-runner-exit-and-log',
    limitation: 'A passing runner result supports only this named scenario and its implemented assertions. It is not a general quality rating or AAA certification.'
  };
}
