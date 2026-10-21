import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { addGameSystem, assessOriginality, createGameProject, planVerticalSlice, readGameObligations, readGameProgress, readGameProject, reviewGameObligations, updateGameProgress } from '../core/project.js';
import { buildGame, packageGameDownload } from '../game/build.js';
import { buildGameWithEngine, inspectGameEngineProject, launchGameArtifact, runGameEngineScenario } from '../core/engine-adapters.js';
import { inspectGameToolchains } from '../core/toolchains.js';

const workspacePath = process.env.OPEN_GAME_WORKSPACE || process.cwd();

function result(value) {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}

function failure(error) {
  return { isError: true, content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }] };
}

function createServer() {
  const server = new McpServer({ name: 'open-game', version: '0.2.0' });

  server.registerTool('inspect_game_toolchains', {
    title: 'Inspect installed game build tools',
    description: 'Detect available engines and build tools before choosing a target. Detection does not prove export modules, platform SDKs, licenses, or assets are installed.',
    inputSchema: {}
  }, async () => result(inspectGameToolchains()));

  server.registerTool('inspect_game_engine_project', {
    title: 'Inspect an engine project',
    description: 'Find Godot, Unity, and Unreal project markers under a game project and report which engine operations Open Game currently supports. Detection does not prove that the project builds.',
    inputSchema: { project_path: z.string().min(1) }
  }, async input => {
    try { return result(await inspectGameEngineProject({ workspacePath, projectPath: input.project_path })); }
    catch (error) { return failure(error); }
  });

  server.registerTool('build_game_engine_project', {
    title: 'Build a native game project',
    description: 'Run a bounded engine CLI build for a detected Godot project using a named export preset, a Unity project using its own static build method, or an Unreal project through RunUAT BuildCookRun when UNREAL_ENGINE_ROOT is configured on macOS/Linux. A successful build alone does not verify gameplay or AAA quality.',
    inputSchema: {
      project_path: z.string().min(1),
      output_path: z.string().min(1),
      engine: z.enum(['auto', 'godot', 'unity', 'unreal']).default('auto'),
      preset: z.string().max(200).optional().describe('Exact Godot export preset name from export_presets.cfg.'),
      build_method: z.string().max(300).optional().describe('Unity static C# method that reads OPEN_GAME_BUILD_OUTPUT and OPEN_GAME_BUILD_TARGET.'),
      target: z.string().max(100).default('desktop'),
      mode: z.enum(['release', 'debug']).default('release')
    }
  }, async input => {
    try { return result(await buildGameWithEngine({ workspacePath, projectPath: input.project_path, outputPath: input.output_path, engine: input.engine, preset: input.preset, buildMethod: input.build_method, target: input.target, mode: input.mode })); }
    catch (error) { return failure(error); }
  });

  server.registerTool('launch_game_artifact', {
    title: 'Launch a built game artifact',
    description: 'Start a built executable from within the configured workspace, or ask macOS to open a .app bundle. This only confirms a process launch request; the coding agent must observe the game and exercise gameplay scenarios separately.',
    inputSchema: {
      artifact_path: z.string().min(1),
      executable_path: z.string().min(1).optional().describe('Relative executable path inside artifact_path when a build folder contains multiple launch candidates.')
    }
  }, async input => {
    try { return result(await launchGameArtifact({ workspacePath, artifactPath: input.artifact_path, executablePath: input.executable_path })); }
    catch (error) { return failure(error); }
  });

  server.registerTool('run_game_engine_scenario', {
    title: 'Run a named gameplay scenario',
    description: 'Run a project-owned Godot scenario runner or Unity static scenario method and return its exit result and logs. The coding agent must author assertions for the named gameplay behavior; an exit code only verifies what that runner checks. Unreal automation remains an agent-driven step.',
    inputSchema: {
      project_path: z.string().min(1),
      scenario_id: z.string().regex(/^[a-z0-9][a-z0-9._-]{0,99}$/i),
      engine: z.enum(['auto', 'godot', 'unity', 'unreal']).default('auto'),
      unity_method: z.string().max(300).optional().describe('Unity project-owned static scenario method, such as GameScenarios.RunOpenGameScenario.')
    }
  }, async input => {
    try { return result(await runGameEngineScenario({ workspacePath, projectPath: input.project_path, scenarioId: input.scenario_id, engine: input.engine, unityMethod: input.unity_method })); }
    catch (error) { return failure(error); }
  });

  server.registerTool('create_game_project', {
    title: 'Create game project blueprint',
    description: 'Create a project handoff from the creator’s original brief, characters, world, platform, and systems, including a reference-study ledger and typed implementation obligations. The connected coding agent must implement the requested game in its chosen engine; this tool does not generate a playable game by itself.',
    inputSchema: {
      project_path: z.string().min(1).describe('New project folder path relative to the configured Open Game workspace.'),
      creator_brief: z.string().max(20000).optional().describe('The complete original prompt, including requested experience, characters, world, systems, target platform, and multiplayer needs. Preserve this verbatim for the coding agent.'),
      target_platform: z.string().max(200).optional(),
      world: z.string().max(6000).optional(),
      multiplayer: z.string().max(2000).optional(),
      characters: z.array(z.object({ name: z.string().min(1).max(100), description: z.string().max(2000).default(''), role: z.string().max(100).default('') })).max(100).default([]),
      title: z.string().min(1).max(100),
      pitch: z.string().min(1).max(4000).describe('Original player experience and game vision.'),
      core_experience: z.string().min(1).max(100),
      tone: z.string().min(1).max(100),
      ambition: z.enum(['Focused', 'Expansive', 'Epic']).default('Expansive'),
      accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#df4b36'),
      systems: z.array(z.object({ name: z.string().min(1).max(100), purpose: z.string().max(500).optional() })).max(40).default([])
    }
  }, async input => {
    try {
      const blueprint = {
        format: 'open-game-blueprint', version: 1, createdAt: new Date().toISOString(),
        game: {
          title: input.title, pitch: input.pitch, coreExperience: input.core_experience,
          tone: input.tone, ambition: input.ambition, targetPlatform: input.target_platform, multiplayer: input.multiplayer, world: input.world, characters: input.characters,
          accentColor: input.accent_color,
          originality: 'Original expression, world, characters, story, visual identity, audio, and implementation.'
        },
        systems: input.systems.map((system, index) => ({ id: `system-${index + 1}`, ...system, status: 'planned' })),
        production: {},
        originalityReview: [
          'Use original names, characters, story, locations, visual identity, audio, and assets.',
          'Record source and license details for third-party dependencies and assets.',
          'This blueprint is not legal clearance and cannot guarantee protection from legal claims.'
        ]
      };
      return result(await createGameProject({ workspacePath, projectPath: input.project_path, blueprint, creatorBrief: input.creator_brief }));
    } catch (error) { return failure(error); }
  });

  server.registerTool('add_game_system', {
    title: 'Add a connected game system',
    description: 'Add a planned system to an existing Open Game project. Dependencies must reference existing system IDs. Updates the versioned blueprint, design documents, and implementation-obligation ledger while preserving existing ledger entries.',
    inputSchema: {
      project_path: z.string().min(1),
      name: z.string().min(1).max(100),
      purpose: z.string().max(500).optional(),
      inputs: z.array(z.string().max(100)).max(30).default([]),
      outputs: z.array(z.string().max(100)).max(30).default([]),
      depends_on: z.array(z.string().min(1)).max(30).default([])
    }
  }, async input => {
    try {
      const blueprint = await addGameSystem({
        workspacePath, projectPath: input.project_path, name: input.name, purpose: input.purpose,
        inputs: input.inputs, outputs: input.outputs, dependsOn: input.depends_on
      });
      return result({ game: blueprint.game.title, systems: blueprint.systems });
    } catch (error) { return failure(error); }
  });

  server.registerTool('plan_game_vertical_slice', {
    title: 'Plan the complete game production path',
    description: 'Return the full requested system set in dependency order, a complete production roadmap, and first-slice acceptance criteria. The slice is a checkpoint, not completion; the coding agent should implement and package the requested game and resume from OPEN_GAME_STATUS.md.',
    inputSchema: { project_path: z.string().min(1) }
  }, async input => {
    try { return result(await planVerticalSlice({ workspacePath, projectPath: input.project_path })); }
    catch (error) { return failure(error); }
  });

  server.registerTool('read_game_blueprint', {
    title: 'Read game blueprint',
    description: "Read and normalize an Open Game project blueprint so the agent can continue implementation in the user's selected engine.",
    inputSchema: { project_path: z.string().min(1) }
  }, async input => {
    try { return result(await readGameProject({ workspacePath, projectPath: input.project_path })); }
    catch (error) { return failure(error); }
  });

  server.registerTool('read_game_progress', {
    title: 'Resume game production',
    description: 'Read the last recorded engine, target, completed systems, build/play evidence, artifacts, blockers, and next task before continuing implementation.',
    inputSchema: { project_path: z.string().min(1) }
  }, async input => {
    try { return result(await readGameProgress({ workspacePath, projectPath: input.project_path })); }
    catch (error) { return failure(error); }
  });

  server.registerTool('read_game_obligations', {
    title: 'Read game implementation obligations',
    description: 'Read the generated project’s evidence-linked implementation obligations and quality gates before continuing work.',
    inputSchema: { project_path: z.string().min(1) }
  }, async input => {
    try { return result(await readGameObligations({ workspacePath, projectPath: input.project_path })); }
    catch (error) { return failure(error); }
  });

  server.registerTool('review_game_obligations', {
    title: 'Review obligation ledger completeness',
    description: 'Check obligation IDs, system ownership, dependencies, applicability decisions, and evidence fields. This checks ledger consistency only; it does not run the game or independently verify AAA quality.',
    inputSchema: { project_path: z.string().min(1) }
  }, async input => {
    try { return result(await reviewGameObligations({ workspacePath, projectPath: input.project_path })); }
    catch (error) { return failure(error); }
  });

  server.registerTool('update_game_progress', {
    title: 'Record game production progress',
    description: 'Persist verified implementation progress so the coding agent can continue across long runs. Record only systems actually implemented, commands actually run, artifacts actually produced, and concrete current blockers.',
    inputSchema: {
      project_path: z.string().min(1),
      engine: z.string().max(200).optional(),
      target: z.string().max(200).optional(),
      phase: z.string().max(100).optional(),
      completed_systems: z.array(z.string().max(2000)).max(300).optional(),
      verification: z.array(z.string().max(2000)).max(300).optional().describe('Exact command or play check, followed by its actual outcome.'),
      artifacts: z.array(z.string().max(2000)).max(300).optional(),
      blockers: z.array(z.string().max(2000)).max(300).optional(),
      next_task: z.string().max(2000).optional()
    }
  }, async input => {
    try {
      return result(await updateGameProgress({
        workspacePath, projectPath: input.project_path, engine: input.engine, target: input.target,
        phase: input.phase, completedSystems: input.completed_systems, verification: input.verification,
        artifacts: input.artifacts, blockers: input.blockers, nextTask: input.next_task
      }));
    } catch (error) { return failure(error); }
  });

  server.registerTool('build_playable_game', {
    title: 'Build playable browser game download',
    description: 'Build the included browser racing example from a project blueprint. This is a bounded example adapter, not a universal game generator; for other genres, the connected coding agent implements the requested game in its engine using the project brief and production plan.',
    inputSchema: {
      project_path: z.string().min(1).describe('Existing Open Game project folder relative to the configured workspace.'),
      output_path: z.string().min(1).describe('New output folder path relative to the configured workspace. A .zip file is generated beside it.')
    }
  }, async input => {
    try { return result(await buildGame({ workspacePath, projectPath: input.project_path, outputPath: input.output_path })); }
    catch (error) { return failure(error); }
  });

  server.registerTool('package_game_download', {
    title: 'Package an exported game for download',
    description: 'Create a ZIP download from a game source or exported build folder produced by any engine adapter. Excludes common repository/dependency caches. This packages existing files; it does not compile the game.',
    inputSchema: {
      project_path: z.string().min(1).describe('Game project or exported build folder relative to the configured workspace.'),
      output_path: z.string().min(1).describe('New ZIP file path outside the folder being packaged.')
    }
  }, async input => {
    try { return result(await packageGameDownload({ workspacePath, projectPath: input.project_path, outputPath: input.output_path })); }
    catch (error) { return failure(error); }
  });

  server.registerTool('review_game_originality', {
    title: 'Review blueprint originality signals',
    description: 'Scan selected blueprint text for a small list of named commercial game references. This is a narrow review aid, not a copyright analysis, legal opinion, originality certificate, or guarantee against claims.',
    inputSchema: { project_path: z.string().min(1) }
  }, async input => {
    try { return result(assessOriginality(await readGameProject({ workspacePath, projectPath: input.project_path }))); }
    catch (error) { return failure(error); }
  });

  return server;
}

export function startMcpServer() {
  return serveStdio(createServer);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { startMcpServer(); } catch (error) {
    console.error(`Open Game MCP server failed: ${error.message}`);
    process.exitCode = 1;
  }
}
