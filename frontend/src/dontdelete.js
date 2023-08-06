import React, { useEffect, useState } from 'react';
import socket from './socket'; // Ensure this path is correct
import Grid from './grid'; // Ensure this path is correct
import Player from './player'; // Import the Player component
import RoomForm from './RoomForm';

const App = () => {
  const [gridData, setGridData] = useState([]);
  const [playerPosition, setPlayerPosition] = useState({ row: 9, col: 4 });
  const [characterName, setCharacterName] = useState('');
  const [rooms, setRooms] = useState([]);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  // Function to handle room creation and add the new room to the list
  const handleCreateRoom = (roomName) => {
    // Your logic to create a new room on the server
    // For now, let's just add the room to the list
    setRooms([...rooms, { name: roomName }]);
    setIsCreatingRoom(false);
  };

  const handleSubmitCharacterName = (e) => {
    e.preventDefault();
    // Do not submit the form here; handle character name submission on button click
  };

  const handleEnterGame = () => {
    if (characterName.trim() !== '') {
      setCharacterName(characterName.trim());
    }
  };

  // Listen for the grid data from the server
  useEffect(() => {
    socket.on('gridUpdate', (data) => {
      setGridData(data);
    });

    const handleKeyPress = (event) => {
      const { row, col } = playerPosition;
      let newRow = row;
      let newCol = col;

      switch (event.key) {
        case 'ArrowUp':
          newRow = Math.max(row - 1, 0); // Ensure the player stays within the grid bounds
          break;
        case 'ArrowDown':
          newRow = Math.min(row + 1, gridData.length - 1);
          break;
        case 'ArrowLeft':
          newCol = Math.max(col - 1, 0);
          break;
        case 'ArrowRight':
          newCol = Math.min(col + 1, gridData[0].length - 1);
          break;
        default:
          break;
      }

      // Update the player's position
      setPlayerPosition({ row: newRow, col: newCol });
    };

    // Attach the event listener when the component mounts
    // window.addEventListener('keydown', handleKeyPress);

    // Clean up the socket listener when component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      socket.off('gridUpdate');
    };
  }, [playerPosition, gridData]);

  return (
    <div className="App">
      <h1>My Multiplayer Grid Game</h1>
      {characterName ? (
        <>
          {/* List of rooms */}
          <h2>Available Rooms</h2>
          <ul>
            {rooms.map((room) => (
              <li key={room.name}>{room.name}</li>
            ))}
          </ul>

          {/* Room creation form */}
          {isCreatingRoom ? (
            <RoomForm onCreateRoom={handleCreateRoom} />
          ) : (
            <button onClick={() => setIsCreatingRoom(true)}>Create a Room</button>
          )}
        </>
      ) : (
        /* Character name input */
        <div>
          <input
            type="text"
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            placeholder="Enter your character's name"
          />
          <button onClick={handleEnterGame}>Enter Game</button>
        </div>
      )}
    </div>
    // <div className="App">
    //   <h1>My Multiplayer Grid Game</h1>
    //   <div className="game-container">
    //     <Grid gridData={gridData} />
    //     <Player position={playerPosition} /> {/* Pass the cellSize prop */}
    //   </div>
    // </div>
  );
};

export default App;
