import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { addGameSystem, assessOriginality, createGameProject, planVerticalSlice, readGameProject } from '../core/project.js';
import { buildGame, packageGameDownload } from '../game/build.js';

const workspacePath = process.env.OPEN_GAME_WORKSPACE || process.cwd();

function result(value) {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}

function failure(error) {
  return { isError: true, content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }] };
}

function createServer() {
  const server = new McpServer({ name: 'open-game', version: '0.2.0' });

  server.registerTool('create_game_project', {
    title: 'Create game project blueprint',
    description: 'Create an original game project folder with a versioned blueprint, racing-game identity settings, design brief, milestones, and asset provenance ledger. Use build_playable_game afterward to create a playable browser racing game and downloadable ZIP.',
    inputSchema: {
      project_path: z.string().min(1).describe('New project folder path relative to the configured Open Game workspace.'),
      title: z.string().min(1).max(100),
      pitch: z.string().min(1).max(4000).describe('Original player experience and game vision.'),
      core_experience: z.string().min(1).max(100),
      tone: z.string().min(1).max(100),
      ambition: z.enum(['Focused', 'Expansive', 'Epic']).default('Expansive'),
      player_name: z.string().min(1).max(40).default('Racer'),
      team_name: z.string().min(1).max(50).default('Open Team'),
      rival_names: z.array(z.string().min(1).max(40)).max(7).default([]),
      track_name: z.string().min(1).max(60).default('Coastal Grand Circuit'),
      track_length_km: z.number().min(1).max(20).default(4.2),
      race_laps: z.number().int().min(1).max(12).default(3),
      accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#df4b36'),
      systems: z.array(z.object({ name: z.string().min(1).max(100), purpose: z.string().max(500).optional() })).max(40).default([])
    }
  }, async input => {
    try {
      const blueprint = {
        format: 'open-game-blueprint', version: 1, createdAt: new Date().toISOString(),
        game: {
          title: input.title, pitch: input.pitch, coreExperience: input.core_experience,
          tone: input.tone, ambition: input.ambition,
          playerName: input.player_name, teamName: input.team_name, rivalNames: input.rival_names,
          trackName: input.track_name, trackLengthKm: input.track_length_km, raceLaps: input.race_laps, accentColor: input.accent_color,
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
      return result(await createGameProject({ workspacePath, projectPath: input.project_path, blueprint }));
    } catch (error) { return failure(error); }
  });

  server.registerTool('add_game_system', {
    title: 'Add a connected game system',
    description: 'Add a planned system to an existing Open Game project. Dependencies must reference existing system IDs. Updates the versioned blueprint and design documents.',
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

  server.registerTool('build_playable_game', {
    title: 'Build playable game download',
    description: 'Generate an editable, standalone browser racing game from a project blueprint and package it as a ZIP. The build includes local race gameplay, AI rivals, vehicle setup, and an optional authoritative WebSocket room server. It is a playable prototype, not an AAA production or legal clearance.',
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
