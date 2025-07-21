import React, { useEffect, useState } from 'react';
import './App.css';

const socket = new WebSocket('https://einenschrittnachvorne.onrender.com');

function ProgressGrid({ players }) {
  const columns = 11;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '32px' }}>
      {players.map((p, idx) => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '100px', fontWeight: 'bold', fontSize: '16px' }}>
            Spieler {p.playerNumber}
          </div>

          {[...Array(columns)].map((_, i) => (
            <div
              key={i}
              style={{
                width: '24px',
                height: '48px',
                borderLeft: '2px solid #444',
                position: 'relative',
              }}
            >
              {i === p.progress && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '-7px',
                    transform: 'translateY(-50%)',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: p.role.privileged ? 'orange' : 'blue',
                    boxShadow: '0 0 5px rgba(0,0,0,0.2)',
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
  const [roles, setRole] = useState(null);
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
          setPlayerNumber(data.players[index].playerNumber);
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

  if (!roles) return <div style={{ padding: 30, fontSize: 18 }}>Lade Spiel ...</div>;

  if (current >= questions.length)
    return (
      <div style={{ padding: '30px', fontFamily: 'sans-serif' }}>
        <h1 style={{ marginBottom: '10px' }}>Spieler {playerNumber}</h1>
        <div style={{ fontSize: '18px', marginBottom: '20px' }}>
          <strong>Rollenbeschreibung:</strong>
          <p style={{ marginTop: 5 }}>{roles.description}</p>
        </div>

        <h2>Spiel beendet!</h2>
        <p>Hier siehst du den Fortschritt aller Spieler:</p>
        <ProgressGrid players={players} />

        <div style={{ marginTop: '32px', fontSize: '16px' }}>
          <h3>Legende</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '16px', height: '16px', backgroundColor: 'orange', borderRadius: '50%' }} />
            <span>Privilegiert</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '16px', height: '16px', backgroundColor: 'blue', borderRadius: '50%' }} />
            <span>Nicht-privilegiert</span>
          </div>
        </div>
      </div>
    );

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: '10px' }}>Spieler {playerNumber}</h1>

      <div style={{ fontSize: '18px', marginBottom: '30px' }}>
        <strong>Rollenbeschreibung:</strong>
        <p style={{ marginTop: 5 }}>{roles.description}</p>
      </div>

      <h2 style={{ marginBottom: '10px' }}>Frage {current + 1} von {questions.length}</h2>
      <p style={{ fontSize: '16px', marginBottom: '20px' }}>{questions[current]}</p>

      <div style={{ display: 'flex', gap: '20px' }}>
        <button
          onClick={() => handleAnswer(true)}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Ja
        </button>
        <button
          onClick={() => handleAnswer(false)}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Nein
        </button>
      </div>
    </div>
  );
}

export default App;
