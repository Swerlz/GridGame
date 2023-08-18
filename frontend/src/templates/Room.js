import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import socket from '../socket';

const Room = ({ room, theplayer, leaveRoom, startGame }) => {
  const [settings, setSettings] = useState({
    gridSize: 17,
    maxBlocks: 6,
    jumpActive: false,
    jumpDelay: 2,
    randomStart: false,
    randomBlocks: 0,
    randomPlayerBlocks: 0,
  })

  useEffect(() => {
    socket.on('settingsUpdate', (updatedSettings) => {
      setSettings(updatedSettings);
    });


    return () => {
      socket.off('settingsUpdate');
    };
  }, [settings]);

  const gridOptions = [13, 17, 21, 25];

  if (!room || room.length === 0) {
    return <div>Loading...</div>;
  }


  const handleStartGame = () => {
    startGame(settings);
  };

  const saveSettings = () => {
    console.log(settings);
    socket.emit('updateSettings', room.id, settings);
  }

  return (
    <>
      <h2>Room Name: {room.name}</h2>


      <div>
        <h2>Settings</h2>
        <div>
          <h4>Grid Size</h4>
          <div>
            {gridOptions.map((option) => (
              <p
                key={option}
                onClick={theplayer.id === room.admin.id ? (prev) => setSettings({ ...settings, gridSize: option }) : null}
                className={settings.gridSize === option ? 'activeSetting' : ''}
              >
                {option}
              </p>
            ))}
          </div>
        </div>

        <div>
          <h4>Max Wall Blocks</h4>
          <input
            type="number"
            value={settings.maxBlocks}
            onChange={(e) => setSettings({ ...settings, maxBlocks: parseInt(e.target.value) })}
          />
        </div>

        <div>
          <h4>Wall Jump Delay</h4>
          <input
            type="number"
            value={settings.jumpDelay}
            onChange={(e) => setSettings({ ...settings, jumpDelay: parseInt(e.target.value, 10) })}
          />
        </div>

        <div>
          <h4>Enable Wall Jump</h4>
          <input type='checkbox'
            id="jump"
            name="jump"
            checked={settings.jumpActive}
            onChange={() => setSettings({ ...settings, jumpActive: !settings.jumpActive })}
          />
        </div>
        
        <div>
          <h4>Random Start Position</h4>
          <input type='checkbox'
            id="jump"
            name="jump"
            checked={settings.randomStartPos}
            onChange={() => setSettings({ ...settings, randomStartPos: !settings.randomStartPos })}
          />
        </div>
        
        <div>
          <h4>Random Blocks</h4>
          <input
            type="number"
            value={settings.randomBlocks}
            onChange={(e) => setSettings({ ...settings, randomBlocks: parseInt(e.target.value, 10) })}
          />
        </div>

        <div>
          <h4>Random Player Blocks</h4>
          <input
            type="number"
            value={settings.randomPlayerBlocks}
            onChange={(e) => setSettings({ ...settings, randomPlayerBlocks: parseInt(e.target.value, 10) })}
          />
        </div>
      </div>

      {theplayer.id === room.admin.id && <button onClick={saveSettings}>Save Settings</button>}

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