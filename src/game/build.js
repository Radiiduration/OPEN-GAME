import path from 'node:path';
import { lstat, mkdir, open, opendir, readFile, writeFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { constants as fsConstants } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { assessOriginality, readGameProject, readProjectFile, resolveWorkspaceDestination } from '../core/project.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const template = path.join(here, 'template');
const MAX_ARCHIVE_FILES = 10000;
const MAX_ARCHIVE_BYTES = 256 * 1024 * 1024;

const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  return crc >>> 0;
});
function updateCrc(crc, chunk) { for (let index = 0; index < chunk.length; index++) crc = CRC_TABLE[(crc ^ chunk[index]) & 0xff] ^ (crc >>> 8); return crc >>> 0; }
function safeArchiveName(name) {
  if (!name || name.includes('\\') || name.startsWith('/') || name.split('/').some(part => part === '..' || part === '' || part === '.')) throw new Error(`Unsafe archive path: ${name}`);
  const bytes = Buffer.from(name, 'utf8');
  if (bytes.length > 0xffff) throw new Error(`Archive path is too long: ${name}`);
  return bytes;
}
async function withRegularFile(filePath, callback) {
  const before = await lstat(filePath);
  if (!before.isFile() || before.isSymbolicLink() || before.nlink > 1) throw new Error(`Cannot package non-regular or hard-linked file: ${filePath}`);
  const handle = await open(filePath, fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW || 0));
  try {
    const current = await handle.stat();
    if (!current.isFile() || current.nlink > 1 || current.dev !== before.dev || current.ino !== before.ino) throw new Error(`File changed during packaging: ${filePath}`);
    return await callback(handle, current);
  } finally { await handle.close(); }
}
async function fileChecksum(filePath) {
  return withRegularFile(filePath, async (handle, metadata) => {
    let crc = 0xffffffff, size = 0;
    for await (const chunk of handle.createReadStream({ autoClose: false })) { crc = updateCrc(crc, chunk); size += chunk.length; }
    if (size !== metadata.size) throw new Error(`File changed during packaging: ${filePath}`);
    return { crc: (crc ^ 0xffffffff) >>> 0, size };
  });
}
async function writeAll(handle, buffer) {
  let offset = 0;
  while (offset < buffer.length) {
    const { bytesWritten } = await handle.write(buffer, offset, buffer.length - offset);
    if (!bytesWritten) throw new Error('Could not write ZIP archive.');
    offset += bytesWritten;
  }
}
async function writeZip(entries, archivePath) {
  const archiveHandle = await open(archivePath, fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL, 0o600);
  const central = [];
  let offset = 0;
  try {
    for (const entry of entries) {
      const name = safeArchiveName(entry.name);
      const { crc, size } = await fileChecksum(entry.path);
      if (size !== entry.size || size > 0xffffffff) throw new Error(`File changed or exceeds ZIP limits: ${entry.name}`);
      const localOffset = offset;
      const header = Buffer.alloc(30); header.writeUInt32LE(0x04034b50, 0); header.writeUInt16LE(20, 4); header.writeUInt16LE(0x0800, 6); header.writeUInt16LE(0, 8); header.writeUInt32LE(crc, 14); header.writeUInt32LE(size, 18); header.writeUInt32LE(size, 22); header.writeUInt16LE(name.length, 26);
      await writeAll(archiveHandle, header); await writeAll(archiveHandle, name); offset += header.length + name.length;
      await withRegularFile(entry.path, async handle => {
        let written = 0, currentCrc = 0xffffffff;
        for await (const chunk of handle.createReadStream({ autoClose: false })) {
          written += chunk.length; currentCrc = updateCrc(currentCrc, chunk); await writeAll(archiveHandle, chunk);
        }
        if (written !== size || ((currentCrc ^ 0xffffffff) >>> 0) !== crc) throw new Error(`File changed while creating archive: ${entry.name}`);
      });
      offset += size;
      const dir = Buffer.alloc(46); dir.writeUInt32LE(0x02014b50, 0); dir.writeUInt16LE(20, 4); dir.writeUInt16LE(20, 6); dir.writeUInt16LE(0x0800, 8); dir.writeUInt16LE(0, 10); dir.writeUInt32LE(crc, 16); dir.writeUInt32LE(size, 20); dir.writeUInt32LE(size, 24); dir.writeUInt16LE(name.length, 28); dir.writeUInt32LE(localOffset, 42);
      central.push(dir, name);
    }
    const centralStart = offset, centralBytes = Buffer.concat(central);
    if (offset + centralBytes.length > 0xffffffff) throw new Error('ZIP archive exceeds the classic ZIP format size limit.');
    await writeAll(archiveHandle, centralBytes);
    const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(centralBytes.length, 12); end.writeUInt32LE(centralStart, 16);
    await writeAll(archiveHandle, end); await archiveHandle.sync();
  } catch (error) {
    await archiveHandle.close();
    const { unlink } = await import('node:fs/promises'); await unlink(archivePath).catch(() => {});
    throw error;
  }
  await archiveHandle.close();
}
async function collectFiles(directory, base = '') {
  const output = [];
  let totalBytes = 0;
  const directoryHandle = await opendir(directory);
  try { for await (const entry of directoryHandle) {
    const full = path.join(directory, entry.name); const relative = path.posix.join(base, entry.name);
    if (relative.includes('\\') || relative.split('/').includes('..')) throw new Error(`Unsafe package path: ${relative}`);
    if (entry.isSymbolicLink()) throw new Error(`Cannot package symbolic link: ${relative}`);
    if (entry.isDirectory() && !['.git', 'node_modules', '.godot', '__pycache__'].includes(entry.name)) {
      const nested = await collectFiles(full, relative);
      output.push(...nested);
      totalBytes += nested.reduce((sum, item) => sum + item.size, 0);
      if (output.length > MAX_ARCHIVE_FILES || totalBytes > MAX_ARCHIVE_BYTES) throw new Error('Package exceeds the built-in archive limits.');
    } else if (entry.isFile() && !isExcludedFile(entry.name)) {
      const metadata = await lstat(full);
      if (metadata.isSymbolicLink() || !metadata.isFile() || metadata.nlink > 1) throw new Error(`Cannot package non-regular or hard-linked file: ${relative}`);
      if (metadata.size > MAX_ARCHIVE_BYTES || totalBytes + metadata.size > MAX_ARCHIVE_BYTES) throw new Error(`Package exceeds the ${MAX_ARCHIVE_BYTES / 1024 / 1024} MiB uncompressed limit.`);
      if (output.length >= MAX_ARCHIVE_FILES) throw new Error(`Package exceeds the ${MAX_ARCHIVE_FILES} file limit.`);
      safeArchiveName(relative);
      totalBytes += metadata.size;
      output.push({ name: relative, path: full, size: metadata.size });
    }
  } } finally { await directoryHandle.close().catch(() => {}); }
  return output;
}
function isExcludedFile(name) {
  const lower = name.toLowerCase();
  return lower === '.ds_store' || lower.endsWith('.log') || lower === '.npmrc' || lower === '.env' || lower.startsWith('.env.') ||
    /(^|\b)(id_rsa|id_ed25519|id_ecdsa|id_dsa)$/.test(lower) || ['.pem', '.key', '.p12', '.pfx', '.p8'].some(ext => lower.endsWith(ext));
}
async function includeCreatorBundle(workspacePath, projectPath, outputDir) {
  for (const [source, target] of [['docs/GAME_DESIGN.md', 'GAME_DESIGN.md'], ['docs/MILESTONES.md', 'PRODUCTION_PLAN.md'], ['assets/ASSET_LEDGER.csv', 'ASSET_LEDGER.csv'], ['.agents/skills/open-game-creator/SKILL.md', 'OPEN_GAME_CREATOR_SKILL.md']]) {
    try { await writeFile(path.join(outputDir, target), await readProjectFile(workspacePath, projectPath, source, 2 * 1024 * 1024), { flag: 'wx' }); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  await writeFile(path.join(outputDir, 'AGENTS.md'), `# Game project agent instructions\n\nRead OPEN_GAME_CREATOR_SKILL.md, GAME_BRIEF.md when present, GAME_BLUEPRINT.json, GAME_DESIGN.md, and PRODUCTION_PLAN.md before changing this game. Treat the creator brief as the destination. The included adapter is a playable starting point, not the complete game. Implement the requested systems as connected, editable engine code; build and run the project where the toolchain permits; fix failures; and update the production plan and progress notes with verified results. Do not claim unimplemented multiplayer, content, or platform builds. Use original or properly licensed creative material and preserve its source and license in ASSET_LEDGER.csv.\n`);
}

export async function packageGameDownload({ workspacePath = process.cwd(), projectPath, outputPath }) {
  if (!projectPath || !outputPath) throw new Error('Both projectPath and outputPath are required.');
  const sourceDir = await resolveWorkspaceDestination(workspacePath, projectPath);
  const sourceStat = await lstat(sourceDir);
  if (!sourceStat.isDirectory()) throw new Error('projectPath must point to an exported game/build folder.');
  const archivePath = await resolveWorkspaceDestination(workspacePath, outputPath);
  if (path.extname(archivePath).toLowerCase() !== '.zip') throw new Error('outputPath must end in .zip.');
  const relativeArchive = path.relative(sourceDir, archivePath);
  if (!relativeArchive.startsWith('..') && !path.isAbsolute(relativeArchive)) throw new Error('The ZIP output must be outside the folder being packaged.');
  try { await lstat(archivePath); throw new Error(`Output already exists: ${archivePath}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const entries = await collectFiles(sourceDir);
  if (!entries.length) throw new Error('The game/build folder is empty.');
  await mkdir(path.dirname(archivePath), { recursive: true });
  await writeZip(entries, archivePath);
  const archiveStat = await lstat(archivePath);
  return { sourceFolder: sourceDir, downloadZip: archivePath, files: entries.length, bytes: archiveStat.size, excluded: ['.git', 'node_modules', '.godot', '__pycache__', '.DS_Store', '*.log', '.env*', '.npmrc', '*.pem', '*.key', '*.p12', '*.pfx', '*.p8', SSH private-key filenames, hard-linked files, and symbolic links'] };
}

export async function buildGame({ workspacePath = process.cwd(), projectPath, outputPath }) {
  if (!projectPath || !outputPath) throw new Error('Both projectPath and outputPath are required.');
  const projectDir = await resolveWorkspaceDestination(workspacePath, projectPath);
  const blueprint = await readGameProject({ workspacePath, projectPath });
  const originalityReview = assessOriginality(blueprint);
  const isRace = /(race|racing|motorsport|formula|circuit|driving)/i.test(blueprint.game.coreExperience);
  if (!isRace) throw new Error(`The built-in browser adapter is a racing example and does not match "${blueprint.game.coreExperience}". Use your coding agent and the Open Game Creator workflow to implement the requested game in its target engine, then package the exported folder with "open-game package".`);
  const outputDir = await resolveWorkspaceDestination(workspacePath, outputPath);
  const zipPath = `${outputDir}.zip`;
  for (const target of [outputDir, zipPath]) {
    try { await lstat(target); throw new Error(`Output already exists: ${target}`); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  await mkdir(path.dirname(outputDir), { recursive: true });
  await mkdir(outputDir, { recursive: false });
  for (const name of ['index.html', 'game.css', 'game.js']) await writeFile(path.join(outputDir, name), await readFile(path.join(template, name)));
  await writeFile(path.join(outputDir, 'race-sim.js'), await readFile(path.join(here, 'race-sim.js')));
  const rivals = blueprint.game.rivalNames.length ? blueprint.game.rivalNames : ['Mika Vale', 'Tomas Reed', 'Aya Nakamura', 'Luca Serrano', 'Nia Brooks'];
  const rivalTeams = ['Northstar Motorsport', 'Copperline Racing', 'Asterion GP', 'Solstice Works'];
  const config = { title: blueprint.game.title, pitch: blueprint.game.pitch, teamName: blueprint.game.teamName, playerName: blueprint.game.playerName, trackName: blueprint.game.trackName, trackLengthKm: blueprint.game.trackLengthKm, laps: blueprint.game.raceLaps, accentColor: blueprint.game.accentColor, rivals, rivalTeams };
  await writeFile(path.join(outputDir, 'game-config.js'), `window.OPEN_GAME_CONFIG=${safeJson(config)};\n`);
  await writeFile(path.join(outputDir, 'GAME_BLUEPRINT.json'), `${JSON.stringify(blueprint, null, 2)}\n`);
  try { await writeFile(path.join(outputDir, 'GAME_BRIEF.md'), await readProjectFile(workspacePath, projectPath, 'GAME_BRIEF.md', 2 * 1024 * 1024), { flag: 'wx' }); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  await includeCreatorBundle(workspacePath, projectPath, outputDir);
  await mkdir(path.join(outputDir, 'multiplayer'));
  await writeFile(path.join(outputDir, 'multiplayer', 'server.cjs'), await readFile(path.join(here, 'multiplayer-server.cjs')));
  await writeFile(path.join(outputDir, 'multiplayer', 'race-sim.js'), await readFile(path.join(here, 'race-sim.js')));
  await writeFile(path.join(outputDir, 'multiplayer', 'package.json'), `${JSON.stringify({ name: `${blueprint.game.slug}-race-server`, version: '1.0.0', private: true, description: `Multiplayer server for ${blueprint.game.title}`, scripts: { start: 'node server.cjs' }, dependencies: { ws: '8.22.0' } }, null, 2)}\n`);
  await writeFile(path.join(outputDir, 'multiplayer', 'README.md'), `# ${blueprint.game.title} multiplayer server\n\nThis is a small authoritative WebSocket race server for friends/LAN testing. It simulates each connected driver's speed, track progress, boost, and laps on the server. It is not a hosted service, ranked/anti-cheat platform, matchmaking service, or production deployment.\n\n## Start\n\n1. Install Node.js 20 or newer.\n2. Run \`npm install\` in this folder.\n3. Run \`npm start\`.\n4. Keep port 8787 reachable and open the generated game's \`index.html\` on each player's device.\n5. In Online lobby, set the server address (for another device, use the host's LAN IP), choose a name, and connect. All players must use the same address and room.\n\nThe health endpoint is \`http://localhost:8787/health\`. Set \`PORT\` to change the listening port, or \`HOST=0.0.0.0\` only when you intentionally want LAN access. The default bind is loopback-only. Rooms hold up to 8 players and exist only while connected; persistence, reconnect, matchmaking, user authentication, and TLS are not included. The server rate-limits connections/messages and blocks non-local browser origins by default, but anyone on an intentionally exposed LAN can still join and impersonate a display name. Do not expose it to the public internet; use a separately secured server with TLS, authentication, monitoring, moderation, and abuse controls.\n`);
  await writeFile(path.join(outputDir, 'README.md'), `# ${blueprint.game.title}\n\n${blueprint.game.pitch}\n\n## Play\n\nOpen \`index.html\` in a desktop browser. Use W/A/S/D or arrow keys to drive, Shift to use overtake boost. Adjust downforce and power in the garage before the race. The game includes a multi-lap race, computer-controlled rivals, a live classification, setup tradeoffs saved by career profile, local career reputation, and a finish state.\n\n## Online multiplayer\n\nSee [multiplayer/README.md](multiplayer/README.md). A host runs the included room server; players connect from the Online lobby. The build contains a shared countdown and server-authoritative simulation for connected drivers.\n\n## Build contents\n\nThis folder is the playable game. The adjacent ZIP file is a portable download of the same build. Game code is editable; replace the original sample visuals, sounds, track, AI, and content as your project grows. The current target is a browser prototype, not an AAA-scale game or a packaged native console/desktop binary.\n\n## Originality and provenance\n\nOpen Game generated this from an original brief. Review [ORIGINALITY_REVIEW.md](ORIGINALITY_REVIEW.md), replace sample content with original or properly licensed work, and keep asset sources in your project's provenance ledger. This toolkit cannot certify legal safety or prevent a rights-holder claim.\n`);
  const matches = originalityReview.matches.map(match => `- ${match.reference} in ${match.field}`).join('\n');
  const notes = originalityReview.notes.map(note => `- ${note}`).join('\n');
  await writeFile(path.join(outputDir, 'ORIGINALITY_REVIEW.md'), `# Originality review signals\n\n**Status: ${originalityReview.status}**\n\n${matches ? `The lightweight text scan found these reference terms:\n\n${matches}\n\nReview these fields and replace franchise references with a distinct creative brief before release.` : 'The lightweight text scan found no configured franchise reference patterns in selected blueprint fields. This does not establish originality or non-infringement.'}\n\n## Limits\n\n${notes}\n`);
  const files = await collectFiles(outputDir);
  await writeZip(files, zipPath);
  return { game: blueprint.game.title, adapter: 'browser-racing', playableFolder: outputDir, downloadZip: zipPath, files: files.length, multiplayer: path.join(outputDir, 'multiplayer'), originalityReview };
}
