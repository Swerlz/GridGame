import React, { useEffect, useState } from 'react';
import socket from '../socket';

const Login = ({ onSubmit }) => {
  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
    socket.on('playerAdded', (player) => {
      onSubmit(player);
    });

    return () => {
        socket.off('playerAdded');
    };
  // eslint-disable-next-line
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    var player = {
        name: playerName.trim(),
        inGame: false,
        row: 0,
        col: 0,
    }

    playerName !== '' && socket.emit('newPlayer', player);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        placeholder="Enter your player's name"
      />
      <button type="submit">View Lobbies</button>
    </form>
  );
};

export default Login;
