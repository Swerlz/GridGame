import React from 'react';
import { v4 as uuidv4 } from 'uuid';

const Room = ({ room, theplayer, leaveRoom, startGame }) => {
  console.log(room);

  if (!room || room.length === 0) {
    // If room is null or an empty array, show a loading or placeholder message
    return <div>Loading...</div>;
  }

  const handleStartGame = () => {
    console.log('Game is starting...');
  };

  return (
    <>
      <h2>{room.name}</h2>

      <div>
        <h2>Players in the Room</h2>
        <ul>
          {room.players.map((player) => (
            <li key={uuidv4()}>
              {player.name} {player.id === room.admin.id ? '(Admin)' : ''}
            </li>
          ))}
        </ul>

        <button onClick={leaveRoom}>Back</button>

        {room.admin.id === theplayer.id && <button onClick={startGame}>Start Game</button>}

      </div>
    </>
  );
};

export default Room;