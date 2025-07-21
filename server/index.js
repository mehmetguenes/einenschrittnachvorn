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
  { id: 1, description: 'Du bist ein erfolgreicher Unternehmer in Deutschland. Du besitzt mehrere Firmen, hast ein hohes Einkommen und kannst dir nahezu alles leisten, was du brauchst.', privileged: true },
  { id: 2, description: 'Du bist eine arbeitslose, alleinerziehende Mutter. Du erhältst staatliche Unterstützung und versuchst, mit wenig Geld deinen Kindern ein gutes Leben zu ermöglichen.', privileged: false },
  { id: 3, description: 'Du bist ein 19-jähriger Flüchtling aus Afghanistan. Du lebst in einer Gemeinschaftsunterkunft in Deutschland, hast kaum Kontakte und kämpfst mit der deutschen Sprache.', privileged: false },
  { id: 4, description: 'Du bist eine HIV-positive Person in Nigeria. Die medizinische Versorgung in deiner Umgebung ist mangelhaft, und du erfährst oft soziale Ausgrenzung.', privileged: false },
  { id: 5, description: 'Du bist peruanischer Bauarbeiter, hast bei der Arbeit einen Arm verloren und findest keine Arbeit mehr. Du lebst in ärmeren Verhältnissen.', privileged: false },
  { id: 6, description: 'Du bist ein 19-jähriger Soldat bei der Bundeswehr. Du hast eine gute Ausbildung, regelmäßiges Einkommen und medizinische Versorgung.', privileged: true },
  { id: 7, description: 'Du bist ein 22-jähriger deutscher Zivildienstleistender in Mexiko. Du lebst mit einer Gastfamilie, lernst eine neue Kultur kennen und arbeitest mit Kindern.', privileged: true },
  { id: 8, description: 'Du bist die 12-jährige Tochter eines Straßenhändlers in Ecuador. Du hilfst täglich beim Verkaufen und gehst nur unregelmäßig zur Schule.', privileged: false },
  { id: 9, description: 'Du bist ein 8-jähriges Mädchen aus Guatemala, das auf der Müllkippe nach Essen, Metall etc. sucht. Du hast nie eine Schule besucht.', privileged: false },
  { id: 10, description: 'Du hast einen Brand überlebt. Seitdem ist deine linke Gesichtshälfte vernarbt und einige Operationen stehen dir noch bevor. Du lebst in Deutschland.', privileged: false },
  { id: 11, description: 'Du bist ein 14-jähriges kurzsichtiges Mädchen in Deutschland und hast eine Brille. Du gehst auf ein Gymnasium und wirst von deinen Eltern unterstützt.', privileged: true },
  { id: 12, description: 'Du bist die 16-jährige Tochter des brasilianischen Botschafters in Deutschland. Du lebst in einer Villa, gehst auf eine Privatschule und planst ein Auslandsstudium.', privileged: true },
  { id: 13, description: 'Du bist ein 15-jähriger Schüler und möchtest im nächsten Jahr eine Ausbildung anfangen. Du lebst in einer sicheren Umgebung und wirst in deiner Entscheidung unterstützt.', privileged: true },
  { id: 14, description: 'Du bist ein 8-jähriger Junge aus Deutschland und wurdest in eine bessere Schule mit kleineren Klassen versetzt, damit du besser lernen kannst.', privileged: true },
  { id: 15, description: 'Du bist ein 18-jähriger Soldat aus Uganda und kämpfst schon seit acht Jahren. In Uganda herrscht Bürgerkrieg, du hast keine Familie mehr.', privileged: false },
  { id: 16, description: 'Du bist ein 21-jähriger deutscher Mann, der im Rollstuhl sitzt. Du lebst in einer barrierefreien Wohnung und erhältst staatliche Unterstützung.', privileged: false },
  { id: 17, description: 'Du bist ein illegaler Einwanderer aus Albanien und lebst unerkannt in Deutschland. Du arbeitest schwarz und hast ständig Angst entdeckt zu werden.', privileged: false },
  { id: 18, description: 'Du bist eine 16-jährige Brasilianerin, hast ein 1-jähriges Kind und lebst auf der Straße. Du versuchst irgendwie durchzukommen.', privileged: false },
  { id: 19, description: 'Du bist ein 21-jähriger Mann, der aufgrund seiner Lähmung nicht laufen kann und in Indien auf dem Land lebt. Du bist stark auf andere angewiesen.', privileged: false },
  { id: 20, description: 'Du bist ein gehörloses 9-jähriges Mädchen in Deutschland. Du gehst auf eine spezielle Schule für Hörgeschädigte und wirst dort gut betreut.', privileged: false },
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
