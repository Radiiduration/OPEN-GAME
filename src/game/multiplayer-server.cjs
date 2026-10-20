'use strict';
const http = require('node:http');
const crypto = require('node:crypto');
const { WebSocketServer } = require('ws');
const Sim = require('./race-sim.js');

const PORT = Math.max(1, Math.min(65535, Number(process.env.PORT) || 8787));
const HOST = process.env.HOST || '0.0.0.0';
const TICK_RATE = 20;
const MAX_CLIENTS = 48;
const MAX_ROOMS = 20;
const rooms = new Map();
let nextId = 1;

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
    res.end(JSON.stringify({ status: 'ok', rooms: rooms.size, players: [...rooms.values()].reduce((n, r) => n + r.players.size, 0) }));
    return;
  }
  res.writeHead(404, { 'content-type': 'text/plain' }); res.end('Open Game race server. WebSocket endpoint: /');
});
const wss = new WebSocketServer({ server, maxPayload: 4096, perMessageDeflate: false });

function safeText(value, fallback, max = 32) {
  if (typeof value !== 'string') return fallback;
  const text = value.replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, max);
  return text || fallback;
}
function send(ws, data) { if (ws.readyState === 1) ws.send(JSON.stringify(data)); }
function roomState(room) {
  return [...room.players.values()].map(p => ({ id: p.id, name: p.name, team: p.team, color: p.color, progress: p.car.progress, lateral: p.car.lateral, speed: p.car.speed, laps: p.car.laps, boost: p.car.boost, finished: p.car.finished }));
}
function broadcast(room, message) { for (const p of room.players.values()) send(p.ws, message); }
function join(ws, data) {
  const roomId = safeText(data.room, 'open-grid', 24).toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  let room = rooms.get(roomId);
  if (!room) {
    if (rooms.size >= MAX_ROOMS) return send(ws, { type: 'error', message: 'Server is at its room limit.' });
    room = { id: roomId, players: new Map(), lastSnapshot: 0, startedAt: 0, raceActive: false, trackLength: Math.max(100, Math.min(2000, Number(data.trackLength) || 420)), lapsToWin: Math.max(1, Math.min(12, Number(data.laps) || 3)) }; rooms.set(roomId, room);
  }
  if (room.players.size >= 8) return send(ws, { type: 'error', message: 'That race room is full (8 drivers maximum).' });
  if (room.raceActive) return send(ws, { type: 'error', message: 'That race has already started. Join after the current drivers finish.' });
  const requestedTrackLength = Math.max(100, Math.min(2000, Number(data.trackLength) || room.trackLength));
  if (Math.abs(requestedTrackLength - room.trackLength) > 1) return send(ws, { type: 'error', message: 'This room is running a different track configuration.' });
  const requestedLaps = Math.max(1, Math.min(12, Number(data.laps) || room.lapsToWin));
  if (requestedLaps !== room.lapsToWin) return send(ws, { type: 'error', message: 'This room is running a different race length.' });
  const id = String(nextId++);
  const player = { id, ws, name: safeText(data.name, `Driver ${id}`, 24), team: safeText(data.team, 'Visitor', 30), color: /^#[0-9a-f]{6}$/i.test(data.color || '') ? data.color : '#df4b36', car: Sim.createCar(id, data.name, data.color), input: { throttle: 0, brake: 0, steer: 0, boost: false }, lapsToWin: requestedLaps, lastInput: Date.now() };
  player.car.progress = room.players.size * .008;
  room.players.set(id, player); ws.player = player; ws.room = room;
  send(ws, { type: 'welcome', id, room: roomId, players: room.players.size });
  broadcast(room, { type: 'state', players: roomState(room) });
}
wss.on('connection', ws => {
  if (wss.clients.size > MAX_CLIENTS) { ws.close(1013, 'Server capacity reached'); return; }
  ws.on('message', raw => {
    if (raw.length > 4096) return ws.close(1009, 'Message too large');
    let message;
    try { message = JSON.parse(raw.toString()); } catch { return send(ws, { type: 'error', message: 'Message must be valid JSON.' }); }
    if (message.type === 'join' && !ws.player) return join(ws, message);
    if (message.type === 'start' && ws.player) {
      const room = ws.room; const now = Date.now();
      if (room.startedAt > now) return;
      if (room.raceActive) return send(ws, { type: 'error', message: 'Wait for every driver to finish before restarting the race.' });
      room.raceActive = true;
      room.startedAt = now + 3000;
      for (const [index, player] of [...room.players.values()].entries()) { player.car.progress = 0; player.car.lateral = -.32 + index * .09; player.car.speed = 0; player.car.laps = 0; player.car.boost = 100; player.car.finished = false; player.input = { throttle: 0, brake: 0, steer: 0, boost: false }; }
      broadcast(room, { type: 'race-start', startAt: room.startedAt });
      broadcast(room, { type: 'state', players: roomState(room) });
      return;
    }
    if (message.type === 'input' && ws.player) {
      const now = Date.now(); if (now - ws.player.lastInput < 25) return;
      ws.player.lastInput = now;
      const input = message.input || {};
      ws.player.input = { throttle: Math.max(0, Math.min(1, Number(input.throttle) || 0)), brake: Math.max(0, Math.min(1, Number(input.brake) || 0)), steer: Math.max(-1, Math.min(1, Number(input.steer) || 0)), boost: Boolean(input.boost) };
    }
  });
  ws.on('close', () => {
    if (!ws.player || !ws.room) return;
    ws.room.players.delete(ws.player.id);
    broadcast(ws.room, { type: 'state', players: roomState(ws.room) });
    if (!ws.room.players.size) rooms.delete(ws.room.id);
  });
});

setInterval(() => {
  const dt = 1 / TICK_RATE;
  for (const room of rooms.values()) {
    if (!room.raceActive || !room.startedAt || Date.now() < room.startedAt) continue;
    for (const player of room.players.values()) {
      if (player.car.finished) continue;
      if (Date.now() - player.lastInput > 1500) player.input = { throttle: 0, brake: 0, steer: 0, boost: false };
      const before = player.car.progress;
      Sim.stepCar(player.car, player.input, dt, { trackLength: room.trackLength, maxSpeed: 40 });
      if (player.car.progress < before) player.car.laps++;
      if (player.car.laps >= player.lapsToWin) player.car.finished = true;
    }
    const now = Date.now();
    if ([...room.players.values()].every(p => p.car.finished)) room.raceActive = false;
    if ([...room.players.values()].every(p => p.car.finished)) room.raceActive = false;
    if (now - room.lastSnapshot >= 50) { room.lastSnapshot = now; broadcast(room, { type: 'state', players: roomState(room), serverTime: now }); }
  }
}, 1000 / TICK_RATE).unref();

server.listen(PORT, HOST, () => console.log(`Open Game multiplayer server listening on ws://${HOST}:${PORT}`));
process.on('SIGINT', () => { for (const ws of wss.clients) ws.close(); server.close(() => process.exit(0)); });
process.on('SIGTERM', () => { for (const ws of wss.clients) ws.close(); server.close(() => process.exit(0)); });
