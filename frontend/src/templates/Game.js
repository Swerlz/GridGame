import React, { useEffect, useState, useRef } from 'react';
import Players from './Players';
import socket from '../socket';

const Game = ({ player, initialRoom }) => {
  const [room, setRoom] = useState(initialRoom);
  const [hoverBlock, setHoverBlock] = useState(null);

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
    console.log(room);

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
      setRoom(updatedRooms);
    });

    return () => {
      socket.off('roomUpdated');
    };
  }, []);

  const gridData = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => 'empty')
  );
  
  const eventRef = useRef({
    clientX: 0,
    clientY: 0  
  })

  const checkHover = (e) => {
    console.log(hoverBlock)
    if (hoverBlock) {
      const element = hoverBlock.element;
      const mouse = eventRef.current[hoverBlock.dir];

      if (mouse > hoverBlock.rectPos) {
        element.classList.add('block-right');
        element.classList.remove('block-left');
        
        const next = hoverBlock.next;

        if (next) {
          next.classList.add('block-right');
          hoverBlock.nextMid.classList.add('block-right');
        }
      } else {
        element.classList.add('block-left');
        element.classList.remove('block-right');

        const prev = hoverBlock.prev;
        const prevMid = hoverBlock.prevMid;

        if (prev) {
          prev.classList.add('block-left');
          hoverBlock.prevMid.classList.add('block-left');
        }
      }
    }
  }
  useEffect(() => {
    if (hoverBlock) {
      checkHover(event); 
    }
  }, [hoverBlock]);

  const handleHover = (e) => {
    checkHover(e);
  };


  const handleEnter = (e) => {
    const element = e.target;
    eventRef.current.clientX = e.clientX;
    eventRef.current.clientY = e.clientY;

    setTimeout(() => {
      if (element.matches(':hover')) {
        const col = element.dataset.col;
        const row = element.dataset.row;
        const rect = element.getBoundingClientRect();

        let rectPos, dir, next, nextMid, prev, prevMid;

        if (element.classList.contains('block')) {
          rectPos = rect.left + rect.width / 2;
          dir = 'clientX';

          // Check if exists and if it has class hasBlock.
          next = document.querySelector(`div[data-row="${row}"][data-col="${+col + 2}"]`);
          nextMid = document.querySelector(`div[data-row="${row}"][data-col="${+col + 1}"]`);

          // Check if exists and if it has class hasBlock.
          prev = document.querySelector(`div[data-row="${row}"][data-col="${+col - 2}"]`);
          prevMid = document.querySelector(`div[data-row="${row}"][data-col="${+col - 1}"]`);
        } else {
          rectPos = rect.top + rect.height / 2;
          dir = 'clientY';

          // Check if exists and if it has class hasBlock.
          next = document.querySelector(`div[data-row="${+row + 2}"][data-col="${col}"]`);
          nextMid = document.querySelector(`div[data-row="${+row + 1}"][data-col="${col}"]`);

          // Check if exists and if it has class hasBlock.
          prev = document.querySelector(`div[data-row="${row - 2}"][data-col="${col}"]`);
          prevMid = document.querySelector(`div[data-row="${row - 1}"][data-col="${col}"]`);
        }

        const data = { element, col, row, rectPos, dir, next, nextMid, prev, prevMid };

        setHoverBlock(data);
      }
    }, 200);
  };

  const handleLeave = () => {
    if (hoverBlock) {
      const element = hoverBlock.element;

      element.classList.remove('block-left');
      element.classList.remove('block-right');

      const next = hoverBlock.next;
      const prev = hoverBlock.prev;

      if (next) {
        next.classList.remove('block-right');
        hoverBlock.nextMid.classList.remove('block-right');
      }

      if (prev) {
        prev.classList.remove('block-left');
        hoverBlock.prevMid.classList.remove('block-left');
      }

      setHoverBlock(null);
    }
  };

  return (
    <div>
      <div>Player's Turn: {room.turn.name}</div>
      <div className="game-container">
        <Players room={room} />
        <div className="grid">
          {gridData.map((row, rowIndex) => (
            <div key={rowIndex} className={`row ${rowIndex % 2 !== 0 ? 'block-row' : 'square-row'}`} data-row={rowIndex}>
              {row.map((cell, colIndex) => {
                let classNames = `cell ${cell}`;
                let mouseEv = false;
                let hasBlock = false;

                if (rowIndex % 2 === 1) {
                  if (colIndex % 2 === 0) {
                    classNames += ' block';
                    mouseEv = true;
                  } else {
                    classNames += ' block-mid';
                  }
                } else {
                  if (colIndex % 2 !== 0) {
                    classNames += ' block-vert';
                    mouseEv = true;
                  } else {
                    classNames += ' square';
                  }
                }

                for (const roomBlock of room.blocks) {
                  if (rowIndex === roomBlock.row && colIndex === roomBlock.col) {
                    hasBlock = true;
                    break; // Exit the loop if a match is found
                  }
                }
          
                if (hasBlock) {
                  classNames += ' hasBlock'; // Add the 'hasBlock' class if there's a match
                }

                return (
                  <div
                    key={colIndex}
                    className={classNames}
                    data-row={rowIndex}
                    data-col={colIndex}
                    onMouseEnter={mouseEv ? handleEnter : undefined}
                    onMouseMove={mouseEv ? handleHover : undefined}
                    onMouseLeave={mouseEv ? handleLeave : undefined}
                  ></div>
                );
              })}

            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Game;
