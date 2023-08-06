import React, { useEffect, useState } from 'react';
import Players from './Players';
import socket from '../socket';

const Game = ({ player, initialRoom }) => {
  const [room, setRoom] = useState(initialRoom);

  const GRID_SIZE = 17;

  function checkGrid(row) {
    return row < 0;
  }

  function checkBlock(row, col) {
    let blockFound = false;

    if (room.blocks.length > 0) {
      room.blocks.forEach((block) => {
        if (block.row === row && block.col === col) {
          blockFound = true;
        }
      });
    }

    return blockFound;

  }

  function checkPlayer(row, col) {
    let playerFound = false;

    room.players.forEach((player) => {
      if (player.row === row && player.col === col) {
        playerFound = true;
      }
    });

    return playerFound;
  }

  function checkMove(direction) {
    const foundPlayer = room.players.filter((val) => val.id === player.id)

    if (foundPlayer) {
      let row = foundPlayer.row;
      let col = foundPlayer.col;
      let checkB, checkP, checkG;

      switch (direction) {
        case 'up':
          checkB = checkBlock(row - 1, col);
          checkP = checkPlayer(row - 2, col);
          checkG = checkGrid(row - 2);

          if (checkB && checkP && checkG) {
            console.log('You cannot move up');
          } else {
            const playerIndex = room.players.findIndex(p => p.id === player.id);

            // Get the next player index, loop back to 0 if at end
            let nextPlayerIndex = playerIndex + 1;
            if (nextPlayerIndex >= room.players.length) {
              nextPlayerIndex = 0; 
            }

            // Update room.turn 
            room.turn = room.players[nextPlayerIndex];

            const updatedPlayers = room.players.map((p) => {
              if (p.id === player.id) {
                p.row -= 2;
              }
              return p; 
            });

            console.log(room);
            
            const updatedRoom = { ...room, players: updatedPlayers };
            socket.emit('playerMove', updatedRoom);
          }
          break;
        case 'down':
          checkB = checkBlock(row + 1, col);
          checkP = checkPlayer(row + 2, col);
          checkG = checkGrid(row + 2);

          if (checkB && checkP && checkG) {
            console.log('You cannot move up');
          } else {
            const newRow = row + 2;
            const updatedPlayer = { ...foundPlayer, row: newRow };
            const updatedPlayers = room.players.map((p) => (p.id === player.id ? updatedPlayer : p));
            const updatedRoom = { ...room, players: updatedPlayers };
            socket.emit('playerMove', updatedRoom);
          }
          break;
        case 'left':
          checkB = checkBlock(row, col - 1);
          checkP = checkPlayer(row, col - 2);
          checkG = checkGrid(col - 2);

          if (checkB && checkP && checkG) {
            console.log('You cannot move up');
          } else {
            const newCol = col - 2;
            const updatedPlayer = { ...foundPlayer, col: newCol };
            const updatedPlayers = room.players.map((p) => (p.id === player.id ? updatedPlayer : p));
            const updatedRoom = { ...room, players: updatedPlayers };
            socket.emit('playerMove', updatedRoom);
          }
          break;
        case 'right':
          checkB = checkBlock(row, col + 1);
          checkP = checkPlayer(row, col + 2);
          checkG = checkGrid(col + 2);

          if (checkB && checkP && checkG) {
            console.log('You cannot move up');
          } else {
            const newCol = col + 2;
            const updatedPlayer = { ...foundPlayer, col: newCol };
            const updatedPlayers = room.players.map((p) => (p.id === player.id ? updatedPlayer : p));
            const updatedRoom = { ...room, players: updatedPlayers };
            socket.emit('playerMove', updatedRoom);
          }
          break;
        default:
          break;
      }
    }
  }

  useEffect(() => {

    const handleKeyPress = (event) => {
      if (room.turn.id === player.id) {
        switch (event.key) {
          case 'ArrowUp':
            checkMove('up')
            break;
          case 'ArrowDown':
            checkMove('down')
            break;
          case 'ArrowLeft':
            checkMove('left')
            break;
          case 'ArrowRight':
            checkMove('right')
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  
  useEffect(() => {
    socket.on('roomUpdated', (updatedRooms) => {
      console.log('nextTurn')
        setRoom(updatedRooms);
    });


    return () => {
        socket.off('roomUpdated');
    };
}, []);

  const gridData = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => 'empty')
  );

  return (
    <div>
      <div>Player's Turn: {room.turn.name}</div>
      <div className="game-container">
        <Players room={room}/>
        <div className="grid">
          {gridData.map((row, rowIndex) => (
            <div key={rowIndex} className="row" data-row={rowIndex}>
              {row.map((cell, colIndex) => (
                <div
                  key={colIndex}
                  className={`cell ${cell}`}
                  data-row={rowIndex}
                  data-col={colIndex}
                ></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Game;
