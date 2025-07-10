const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 4000;

const questions = [
  'Du hattest nie ernsthafte Geldprobleme.',
  'Du lebst in einem Haus oder einer Wohnung mit fließendem Wasser, Strom und einer Toilette.',
  'Du hast das Gefühl, dass du deine Meinung frei äußern kannst und dass dich die anderen ernst nehmen.',
  'Du hast keine Angst in eine Polizeikontrolle zu geraten.',
  'Deine medizinische Versorgung ist gesichert.',
  'Du kannst einmal im Jahr verreisen und Urlaub machen.',
  'Du kannst Freunde und Freundinnen nach Hause zum Essen einladen.',
  'Du schaust optimistisch in die Zukunft.',
  'Du kannst den Beruf erlernen, den du dir wünschst.',
  'Du hast keine Angst nachts einzuschlafen.',
];

const roles = [
  { id: 1, description: 'Du bist ein erfolgreicher Unternehmer in Deutschland.', privileged: true },
  { id: 2, description: 'Du bist eine arbeitslose, alleinerziehende Mutter.', privileged: false },
  { id: 3, description: 'Du bist ein 19-jähriger Flüchtling aus Afghanistan.', privileged: false },
  { id: 4, description: 'Du bist eine HIV-positive Person in Nigeria.', privileged: false },
];

let players = {}; // { id: { role, progress, socket, joinedAt } }

function assignRole() {
  const assignedRoleIds = Object.values(players).map(p => p.role.id);
  const availableRoles = roles.filter(role => !assignedRoleIds.includes(role.id));

  const totalPlayers = Object.keys(players).length;
  const privilegedCount = Object.values(players).filter(p => p.role.privileged).length;
  const privilegedLimit = Math.ceil((totalPlayers + 1) / 4);

  const privilegedAvailable = availableRoles.filter(r => r.privileged);
  const nonPrivilegedAvailable = availableRoles.filter(r => !r.privileged);

  if (privilegedCount < privilegedLimit && privilegedAvailable.length > 0) {
    return privilegedAvailable[0];
  } else if (nonPrivilegedAvailable.length > 0) {
    return nonPrivilegedAvailable[0];
  }

  // Fallback (sollte kaum vorkommen)
  return availableRoles[0] || roles[0];
}

wss.on('connection', (ws) => {
  const id = Date.now().toString() + Math.random().toString().slice(2);
  const role = assignRole();

  players[id] = {
    role,
    progress: 0,
    socket: ws,
    joinedAt: Date.now(),
  };

  ws.send(JSON.stringify({ type: 'init', id, role, questions }));
  broadcastPlayers();

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === 'answer') {
        if (players[data.id]) {
          players[data.id].progress = data.progress;
          broadcastPlayers();
        }
      }
    } catch (e) {
      console.error('Invalid message:', msg);
    }
  });

  ws.on('close', () => {
    delete players[id];
    broadcastPlayers();
  });
});

function broadcastPlayers() {
  const state = Object.entries(players)
    .sort(([, a], [, b]) => a.joinedAt - b.joinedAt)
    .map(([id, { role, progress }], index) => ({
      id,
      playerNumber: index + 1,
      role,
      progress,
    }));

  const message = JSON.stringify({ type: 'state', players: state });

  for (const { socket } of Object.values(players)) {
    socket.send(message);
  }
}

server.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
