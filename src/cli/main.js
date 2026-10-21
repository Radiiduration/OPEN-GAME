#!/usr/bin/env node
import { createServer } from 'node:http';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { addGameSystem, assessOriginality, createGameProject, planVerticalSlice, readGameProject, resolveWorkspaceDestination, reviewGameObligations } from '../core/project.js';
import { buildGameWithEngine, inspectGameEngineProject, launchGameArtifact, runGameEngineScenario } from '../core/engine-adapters.js';
import { buildGame, packageGameDownload } from '../game/build.js';
import { inspectGameToolchains } from '../core/toolchains.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);

function option(name, fallback = undefined) {
  const index = args.indexOf(name);
  return index < 0 ? fallback : args[index + 1];
}

function help() {
  console.log(`Open Game CLI\n\nCommands:\n  open-game doctor  (detect installed game engines and build tools)\n  open-game studio [--port 4173]\n  open-game create --blueprint <file.json> --output <project-folder>\n  open-game add-system --project <folder> --name <name> [--purpose <text>]\n  open-game plan --project <folder>  (full roadmap + playable-slice criteria)\n  open-game inspect --project <folder>\n  open-game review --project <folder>\n  open-game obligations --project <folder>  (ledger completeness only)\n  open-game engine-inspect --project <folder>  (find Unity/Godot/Unreal project markers)\n  open-game engine-build --project <folder> --output <artifact> [--engine godot|unity|unreal] [--preset <name>|--build-method <Type.Method>]\n  open-game engine-launch --artifact <build-folder-or-file> [--executable <relative-path>]\n  open-game engine-scenario --project <folder> --scenario <scenario-id> [--engine godot|unity] [--unity-method <Type.Method>]\n  open-game build --project <folder> --output <playable-folder>  (racing example adapter)\n  open-game package --project <exported-build-folder> --output <download.zip>\n  open-game multiplayer --project <playable-folder>\n  open-game mcp\n\nProject paths are created inside or resolved relative to the current working directory.`);
}

async function serveStudio() {
  const port = Number(option('--port', '4173'));
  const allowed = new Map([
    ['/', ['studio.html', 'text/html; charset=utf-8']],
    ['/index.html', ['studio.html', 'text/html; charset=utf-8']],
    ['/app.css', ['app.css', 'text/css; charset=utf-8']],
    ['/app.js', ['app.js', 'text/javascript; charset=utf-8']]
  ]);
  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url || '/', 'http://localhost').pathname;
    const item = allowed.get(pathname);
    if (!item) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }
    try {
      const body = await readFile(path.join(packageRoot, item[0]));
      response.writeHead(200, { 'content-type': item[1], 'cache-control': 'no-store' });
      response.end(body);
    } catch {
      response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Studio asset unavailable');
    }
  });
  server.listen(port, '127.0.0.1', () => console.log(`Open Game Studio: http://127.0.0.1:${port}`));
}

async function main() {
  const command = args[0];
  if (!command || command === '--help' || command === 'help') return help();
  if (command === 'studio') return serveStudio();
  if (command === 'doctor') {
    console.log(JSON.stringify(inspectGameToolchains(), null, 2));
    return;
  }
  if (command === 'mcp') {
    const { startMcpServer } = await import('../mcp/server.js');
    return startMcpServer();
  }
  if (command === 'create') {
    const blueprintFile = option('--blueprint');
    const projectPath = option('--output');
    if (!blueprintFile || !projectPath) throw new Error('create requires --blueprint and --output.');
    const blueprint = JSON.parse(await readFile(path.resolve(blueprintFile), 'utf8'));
    const result = await createGameProject({ workspacePath: process.cwd(), projectPath, blueprint });
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (command === 'build' || command === 'build-game') {
    const result = await buildGame({ workspacePath: process.cwd(), projectPath: option('--project'), outputPath: option('--output') });
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (command === 'package') {
    const result = await packageGameDownload({ workspacePath: process.cwd(), projectPath: option('--project'), outputPath: option('--output') });
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (command === 'obligations') {
    const projectPath = option('--project');
    if (!projectPath) throw new Error('obligations requires --project <folder>.');
    console.log(JSON.stringify(await reviewGameObligations({ workspacePath: process.cwd(), projectPath }), null, 2));
    return;
  }
  if (command === 'engine-inspect') {
    const projectPath = option('--project');
    if (!projectPath) throw new Error('engine-inspect requires --project <folder>.');
    console.log(JSON.stringify(await inspectGameEngineProject({ workspacePath: process.cwd(), projectPath }), null, 2));
    return;
  }
  if (command === 'engine-build') {
    const projectPath = option('--project');
    const outputPath = option('--output');
    if (!projectPath || !outputPath) throw new Error('engine-build requires --project and --output.');
    const result = await buildGameWithEngine({ workspacePath: process.cwd(), projectPath, outputPath, engine: option('--engine', 'auto'), preset: option('--preset'), buildMethod: option('--build-method'), target: option('--target', 'desktop'), mode: option('--mode', 'release') });
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (command === 'engine-launch') {
    const artifactPath = option('--artifact');
    if (!artifactPath) throw new Error('engine-launch requires --artifact <build-folder-or-file>.');
    const result = await launchGameArtifact({ workspacePath: process.cwd(), artifactPath, executablePath: option('--executable') });
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (command === 'engine-scenario') {
    const projectPath = option('--project');
    const scenarioId = option('--scenario');
    if (!projectPath || !scenarioId) throw new Error('engine-scenario requires --project and --scenario.');
    const result = await runGameEngineScenario({ workspacePath: process.cwd(), projectPath, scenarioId, engine: option('--engine', 'auto'), unityMethod: option('--unity-method') });
    console.log(JSON.stringify(result, null, 2));
    if (!result.passed) process.exitCode = 1;
    return;
  }
  if (command === 'multiplayer') {
    const projectPath = option('--project');
    if (!projectPath) throw new Error('multiplayer requires --project <playable-folder>.');
    const serverDir = await resolveWorkspaceDestination(process.cwd(), path.join(projectPath, 'multiplayer'));
    const child = spawn(process.execPath, ['server.cjs'], { cwd: serverDir, stdio: 'inherit' });
    child.on('error', error => { console.error(`Could not start multiplayer server: ${error.message}`); process.exitCode = 1; });
    child.on('exit', code => { process.exitCode = code ?? 0; });
    return;
  }
  if (command === 'inspect' || command === 'plan' || command === 'review' || command === 'add-system') {
    const projectPath = option('--project');
    if (!projectPath) throw new Error(`${command} requires --project.`);
    if (command === 'inspect') {
      console.log(JSON.stringify(await readGameProject({ workspacePath: process.cwd(), projectPath }), null, 2));
      return;
    }
    if (command === 'plan') {
      console.log(JSON.stringify(await planVerticalSlice({ workspacePath: process.cwd(), projectPath }), null, 2));
      return;
    }
    if (command === 'review') {
      const blueprint = await readGameProject({ workspacePath: process.cwd(), projectPath });
      console.log(JSON.stringify(assessOriginality(blueprint), null, 2));
      return;
    }
    const name = option('--name');
    if (!name) throw new Error('add-system requires --name.');
    const blueprint = await addGameSystem({ workspacePath: process.cwd(), projectPath, name, purpose: option('--purpose') });
    console.log(JSON.stringify({ game: blueprint.game.title, systems: blueprint.systems.map(({ id, name: systemName }) => ({ id, name: systemName })) }, null, 2));
    return;
  }
  throw new Error(`Unknown command: ${command}`);
}

main().catch(error => {
  console.error(`open-game: ${error.message}`);
  process.exitCode = 1;
});
