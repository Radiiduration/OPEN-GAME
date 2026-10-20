import path from 'node:path';
import { lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { assessOriginality, normalizeBlueprint, resolveWorkspaceDestination } from '../core/project.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const template = path.join(here, 'template');

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) { c ^= byte; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; }
  return (c ^ 0xffffffff) >>> 0;
}
function zipBuffer(entries) {
  const local = [], central = []; let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name.replaceAll('\\', '/'), 'utf8'); const data = entry.data; const crc = crc32(data);
    const header = Buffer.alloc(30); header.writeUInt32LE(0x04034b50, 0); header.writeUInt16LE(20, 4); header.writeUInt16LE(0x0800, 6); header.writeUInt16LE(0, 8); header.writeUInt32LE(crc, 14); header.writeUInt32LE(data.length, 18); header.writeUInt32LE(data.length, 22); header.writeUInt16LE(name.length, 26);
    local.push(header, name, data);
    const dir = Buffer.alloc(46); dir.writeUInt32LE(0x02014b50, 0); dir.writeUInt16LE(20, 4); dir.writeUInt16LE(20, 6); dir.writeUInt16LE(0x0800, 8); dir.writeUInt16LE(0, 10); dir.writeUInt32LE(crc, 16); dir.writeUInt32LE(data.length, 20); dir.writeUInt32LE(data.length, 24); dir.writeUInt16LE(name.length, 28); dir.writeUInt32LE(offset, 42);
    central.push(dir, name); offset += header.length + name.length + data.length;
  }
  const centralBytes = Buffer.concat(central); const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(centralBytes.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, centralBytes, end]);
}
async function collectFiles(directory, base = '') {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name); const relative = path.posix.join(base, entry.name);
    if (entry.isDirectory()) output.push(...await collectFiles(full, relative));
    else if (entry.isFile()) output.push({ name: relative, data: await readFile(full) });
  }
  return output;
}
function safeJson(value) { return JSON.stringify(value).replace(/</g, '\\u003c'); }

export async function buildGame({ workspacePath = process.cwd(), projectPath, outputPath }) {
  if (!projectPath || !outputPath) throw new Error('Both projectPath and outputPath are required.');
  const projectDir = await resolveWorkspaceDestination(workspacePath, projectPath);
  const blueprint = normalizeBlueprint(JSON.parse(await readFile(path.join(projectDir, 'open-game.json'), 'utf8')));
  const originalityReview = assessOriginality(blueprint);
  if (!/(race|racing|motorsport|formula|circuit|driving)/i.test(blueprint.game.coreExperience)) {
    throw new Error(`The included browser adapter builds racing games; this project's core experience is "${blueprint.game.coreExperience}". Use the Open Game Creator workflow to implement a matching genre adapter instead.`);
  }
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
  await mkdir(path.join(outputDir, 'multiplayer'));
  await writeFile(path.join(outputDir, 'multiplayer', 'server.cjs'), await readFile(path.join(here, 'multiplayer-server.cjs')));
  await writeFile(path.join(outputDir, 'multiplayer', 'race-sim.js'), await readFile(path.join(here, 'race-sim.js')));
  await writeFile(path.join(outputDir, 'multiplayer', 'package.json'), `${JSON.stringify({ name: `${blueprint.game.slug}-race-server`, version: '1.0.0', private: true, description: `Multiplayer server for ${blueprint.game.title}`, scripts: { start: 'node server.cjs' }, dependencies: { ws: '^8.18.3' } }, null, 2)}\n`);
  await writeFile(path.join(outputDir, 'multiplayer', 'README.md'), `# ${blueprint.game.title} multiplayer server\n\nThis is a small authoritative WebSocket race server for friends/LAN testing. It simulates each connected driver's speed, track progress, boost, and laps on the server. It is not a hosted service, ranked/anti-cheat platform, matchmaking service, or production deployment.\n\n## Start\n\n1. Install Node.js 20 or newer.\n2. Run \`npm install\` in this folder.\n3. Run \`npm start\`.\n4. Keep port 8787 reachable and open the generated game's \`index.html\` on each player's device.\n5. In Online lobby, set the server address (for another device, use the host's LAN IP), choose a name, and connect. All players must use the same address and room.\n\nThe health endpoint is \`http://localhost:8787/health\`. Set \`PORT\` to change the listening port, or \`HOST=127.0.0.1\` to bind only to the host device. Rooms hold up to 8 players and exist only while connected; persistence, reconnect, matchmaking, authentication, and TLS are not included. The default bind allows local network devices to connect. Do not expose it to the public internet without TLS, deployment monitoring, moderation, abuse controls, authentication, and a security review.\n`);
  await writeFile(path.join(outputDir, 'README.md'), `# ${blueprint.game.title}\n\n${blueprint.game.pitch}\n\n## Play\n\nOpen \`index.html\` in a desktop browser. Use W/A/S/D or arrow keys to drive, Shift to use overtake boost. Adjust downforce and power in the garage before the race. The game includes a multi-lap race, computer-controlled rivals, a live classification, setup tradeoffs saved by career profile, local career reputation, and a finish state.\n\n## Online multiplayer\n\nSee [multiplayer/README.md](multiplayer/README.md). A host runs the included room server; players connect from the Online lobby. The build contains a shared countdown and server-authoritative simulation for connected drivers.\n\n## Build contents\n\nThis folder is the playable game. The adjacent ZIP file is a portable download of the same build. Game code is editable; replace the original sample visuals, sounds, track, AI, and content as your project grows. The current target is a browser prototype, not an AAA-scale game or a packaged native console/desktop binary.\n\n## Originality and provenance\n\nOpen Game generated this from an original brief. Review [ORIGINALITY_REVIEW.md](ORIGINALITY_REVIEW.md), replace sample content with original or properly licensed work, and keep asset sources in your project's provenance ledger. This toolkit cannot certify legal safety or prevent a rights-holder claim.\n`);
  const matches = originalityReview.matches.map(match => `- ${match.reference} in ${match.field}`).join('\n');
  const notes = originalityReview.notes.map(note => `- ${note}`).join('\n');
  await writeFile(path.join(outputDir, 'ORIGINALITY_REVIEW.md'), `# Originality review signals\n\n**Status: ${originalityReview.status}**\n\n${matches ? `The lightweight text scan found these reference terms:\n\n${matches}\n\nReview these fields and replace franchise references with a distinct creative brief before release.` : 'The lightweight text scan found no configured franchise reference patterns in selected blueprint fields. This does not establish originality or non-infringement.'}\n\n## Limits\n\n${notes}\n`);
  const files = await collectFiles(outputDir);
  await writeFile(zipPath, zipBuffer(files));
  return { game: blueprint.game.title, playableFolder: outputDir, downloadZip: zipPath, files: files.length, multiplayer: path.join(outputDir, 'multiplayer'), originalityReview };
}
