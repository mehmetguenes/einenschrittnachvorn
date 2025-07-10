import React, { useEffect, useState } from 'react';
import './App.css';

const socket = new WebSocket('ws://localhost:4000');

function ProgressGrid({ players }) {
  const columns = 11;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
      {players.map((p, idx) => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {/* Spieler X links anzeigen */}
          <div style={{ width: '100px', fontWeight: 'bold' }}>Spieler {idx + 1}</div>

          {/* 11 vertikale Linien */}
          {[...Array(columns)].map((_, i) => (
            <div
              key={i}
              style={{
                width: '20px',
                height: '40px',
                borderLeft: '2px solid black',
                position: 'relative',
              }}
            >
              {/* Marker setzen */}
              {i === p.progress && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '-7px',
                    transform: 'translateY(-50%)',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: p.role.privileged ? 'blue' : 'orange',
                  }}
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function App() {
  const [role, setRole] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const [playerId, setPlayerId] = useState(null);
  const [players, setPlayers] = useState([]);
  const [playerNumber, setPlayerNumber] = useState(null);

  useEffect(() => {
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'init') {
        setRole(data.role);
        setQuestions(data.questions);
        setPlayerId(data.id);
      } else if (data.type === 'state') {
        setPlayers(data.players);

        const index = data.players.findIndex(p => p.id === playerId);
        if (index !== -1) {
          setPlayerNumber(index + 1);
        }
      }
    };
  }, [playerId]);

  const handleAnswer = (yes) => {
    const updatedProgress = yes ? progress + 1 : progress;
    setProgress(updatedProgress);
    setCurrent(current + 1);

    socket.send(JSON.stringify({ type: 'answer', id: playerId, progress: updatedProgress }));
  };

  if (!role) return <div>Lade...</div>;

  if (current >= questions.length)
    return (
      <div style={{ padding: 20 }}>
        {playerNumber && <h2>Spieler {playerNumber}</h2>}
        <h3>Rolle:</h3>
        <p>{role.description}</p>
        <h3>Spiel beendet! Fortschritt aller Spieler:</h3>
        <ProgressGrid players={players} />
      </div>
    );

  return (
    <div style={{ padding: 20 }}>
      {playerNumber && <h2>Spieler {playerNumber}</h2>}
      <h3>Rolle:</h3>
      <p>{role.description}</p>

      <h3>Frage {current + 1} von {questions.length}:</h3>
      <p>{questions[current]}</p>

      <button onClick={() => handleAnswer(true)} style={{ marginRight: 10 }}>
        Ja
      </button>
      <button onClick={() => handleAnswer(false)}>Nein</button>
    </div>
  );
}

export default App;
