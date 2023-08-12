import React, {useState} from 'react';
import { v4 as uuidv4 } from 'uuid';

const Room = ({ room, theplayer, leaveRoom, startGame }) => {
  const [gridSize, setGridSize] = useState(17); 
  const [blocks, setBlocks] = useState(6);

  const gridOptions = [13, 17, 21];

  if (!room || room.length === 0) {
    return <div>Loading...</div>;
  }

  const handleStartGame = () => {
    const settings = {
      gridSize,
      maxBlocks: blocks
    }
    
    startGame(settings);
  };

  return (
    <>
      <h2>Room Name: {room.name}</h2>

      {theplayer.id === room.admin.id &&
      <div>
        <h2>Settings</h2>
        <div>
          <h4>Grid Size</h4>
          <div>
            {gridOptions.map((option) => (
              <p
                key={option}
                onClick={(prev) => setGridSize(option)}
                className={gridSize === option ? 'activeSetting' : ''}
              >
                {option}
              </p>
            ))}
          </div>
        </div>
        
        <div>
        <h4>Wall Blocks Amount</h4>
            <input
              type="number"
              value={blocks}
              onChange={(e) => setBlocks(e.target.value)}
            />
        </div>
      </div>
      }

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

        {room.admin.id === theplayer.id && <button onClick={handleStartGame}>Start Game</button>}

      </div>
    </>
  );
};

export default Room;