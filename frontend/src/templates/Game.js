import React, { useEffect, useState } from 'react';
import Players from './Players';
import socket from '../socket';

const Game = ({ player, initialRoom }) => {
  const [room, setRoom] = useState(initialRoom);
  const [prevMouseX, setPrevMouseX] = useState(0);
  const [classState, setClassState] = useState('');

  const GRID_SIZE = 17;

  function checkGrid(row) {
    console.log(row);
    return row < 0 || row > 16;
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
    const foundPlayer = room.players.find((val) => val.id === player.id)

    if (foundPlayer) {
      let row = foundPlayer.row;
      let col = foundPlayer.col;
      let checkB, checkP, checkG;

      switch (direction) {
        case 'up':
          checkB = checkBlock(row - 1, col);
          checkP = checkPlayer(row - 2, col);
          checkG = checkGrid(row - 2);
          console.log(checkB, checkP, checkG);

          if (checkB || checkP || checkG) {
            console.log('You cannot move up');
          } else {
            const playerIndex = room.players.findIndex(p => p.id === player.id);

            getNextPlayer(playerIndex);

            const updatedPlayers = room.players.map((p) => {
              if (p.id === player.id) {
                p.row -= 2;
              }
              return p;
            });

            const updatedRoom = { ...room, players: updatedPlayers };
            socket.emit('playerMove', updatedRoom);
          }
          break;
        case 'down':
          checkB = checkBlock(row + 1, col);
          checkP = checkPlayer(row + 2, col);
          checkG = checkGrid(row + 2);
          console.log(checkB, checkP, checkG);

          if (checkB || checkP || checkG) {
            console.log('You cannot move down');
          } else {
            const playerIndex = room.players.findIndex(p => p.id === player.id);

            getNextPlayer(playerIndex);

            const updatedPlayers = room.players.map((p) => {
              if (p.id === player.id) {
                p.row += 2;
              }
              return p;
            });

            const updatedRoom = { ...room, players: updatedPlayers };
            socket.emit('playerMove', updatedRoom);
          }
          break;
        case 'left':
          checkB = checkBlock(row, col - 1);
          checkP = checkPlayer(row, col - 2);
          checkG = checkGrid(col - 2);

          if (checkB || checkP || checkG) {
            console.log('You cannot move left');
          } else {
            const playerIndex = room.players.findIndex(p => p.id === player.id);

            getNextPlayer(playerIndex);

            const updatedPlayers = room.players.map((p) => {
              if (p.id === player.id) {
                p.col -= 2;
              }
              return p;
            });

            const updatedRoom = { ...room, players: updatedPlayers };
            socket.emit('playerMove', updatedRoom);
          }
          break;
        case 'right':
          checkB = checkBlock(row, col + 1);
          checkP = checkPlayer(row, col + 2);
          checkG = checkGrid(col + 2);

          if (checkB || checkP || checkG) {
            console.log('You cannot move right');
          } else {
            const playerIndex = room.players.findIndex(p => p.id === player.id);

            getNextPlayer(playerIndex);

            const updatedPlayers = room.players.map((p) => {
              if (p.id === player.id) {
                p.col += 2;
              }
              return p;
            });

            const updatedRoom = { ...room, players: updatedPlayers };
            socket.emit('playerMove', updatedRoom);
          }
          break;
        default:
          break;
      }
    }
  }

  function getNextPlayer(playerIndex) {
    // Get the next player index, loop back to 0 if at end
    let nextPlayerIndex = playerIndex + 1;
    if (nextPlayerIndex >= room.players.length) {
      nextPlayerIndex = 0;
    }

    // Update room.turn 
    room.turn = room.players[nextPlayerIndex];
  }

  useEffect(() => {

    const handleKeyPress = (event) => {
      if (room.turn.id === player.id) {
        console.log('this player turn');
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
  }, [room]);


  useEffect(() => {
    socket.on('roomUpdated', (updatedRooms) => {
      console.log('nextTurn1')
      console.log(updatedRooms);
      setRoom(updatedRooms);
    });


    return () => {
      socket.off('roomUpdated');
    };
  }, []);

  const gridData = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => 'empty')
  );

  const handleHover = (event) => {
    const element = event.target;

    if (!element.classList.contains('hasBlock')) {
      const rect = element.getBoundingClientRect();
      
      const col = element.dataset.col; 
      const row = element.dataset.row;

      if (element.classList.contains('block')) {
        const mouseX = event.clientX;

        if (mouseX > rect.left + rect.width / 2) {
          const next = document.querySelector(`div[data-row="${row}"][data-col="${+col + 2}"]`);
          console.log(next);
          element.classList.add('block-right');
          element.classList.remove('block-left');

          if (next) {
            next.classList.add('block-right');
          }
        } else {
          const next = document.querySelector(`div[data-row="${row}"][data-col="${col - 2}"]`);
          console.log(next);
          element.classList.add('block-left');
          element.classList.remove('block-right');
          if (next) {
            next.classList.add('block-left');
          }
        }
      }

      if (element.classList.contains('block-vert')) {
        const mouseY = event.clientY;
        if (mouseY > rect.top + rect.height / 2) {
          element.classList.add('block-right');
          element.classList.remove('block-left');
        } else {
          element.classList.add('block-left');
          element.classList.remove('block-right');
        }
      }
    }
  };

  const handleLeave = (event) => {
    const element = event.target;
    element.classList.remove('block-left');
    element.classList.remove('block-right');
  };

  return (
    <div>
      <div>Player's Turn: {room.turn.name}</div>
      <div className="game-container">
        <Players room={room} />
        <div className="grid">
          {gridData.map((row, rowIndex) => (
            <div key={rowIndex} className={`row ${rowIndex % 2 !== 0 ? 'block-row' : 'square-row'}`} data-row={rowIndex}>
              {row.map((cell, colIndex) => (
                <div
                  key={colIndex}
                  className={`cell ${cell} ${rowIndex % 2 === 1 ? colIndex % 2 === 0 ? 'block' : 'block-mid' : colIndex % 2 !== 0 ? 'block-vert' : 'square'}`}
                  data-row={rowIndex}
                  data-col={colIndex}
                  onMouseMove={handleHover}
                  onMouseLeave={handleLeave}
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
