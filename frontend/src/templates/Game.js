import React, { useEffect, useState } from 'react';
import Players from './Players';
import socket from '../socket';

const Game = ({ player, initialRoom, mainRoomUpdate }) => {
  const [room, setRoom] = useState(initialRoom);
  const [hoverData, sethoverData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const gridData = Array.from({ length: room.settings.gridSize }, () =>
    Array.from({ length: room.settings.gridSize }, () => 'empty')
  );

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (room.turn.id === player.id && !room.winner) {
        const foundPlayer = getPlayer(player.id);

        if (foundPlayer) {
          const { row, col } = foundPlayer;
          let updatedPlayers;

          setErrorMsg('');

          switch (event.key) {
            case 'ArrowUp':
              updatedPlayers = movePlayer(row, col, -2, 0);
              break;
            case 'ArrowDown':
              updatedPlayers = movePlayer(row, col, +2, 0);
              break;
            case 'ArrowLeft':
              updatedPlayers = movePlayer(row, col, 0, -2);
              break;
            case 'ArrowRight':
              updatedPlayers = movePlayer(row, col, 0, +2);
              break;
            default:
              break;
          }

          if ('Winner' === updatedPlayers) {
            socket.emit('playerWon', room.id, foundPlayer);
          } else if (updatedPlayers) {
            socket.emit('playerMove', room.id, updatedPlayers, player.id);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [room]);


  useEffect(() => {
    socket.on('roomUpdated', (updatedRoom) => {
      if (updatedRoom.status === 'inLobby') {
        mainRoomUpdate(updatedRoom);
      } else {
        if (updatedRoom.winner) {
          if (updatedRoom.winner.id === player.id) {
            setErrorMsg('no problems, you won. idiot');
          } else {
            setErrorMsg('you lost, idiot.')
          }
        }

        setRoom(updatedRoom);
      }
    });
    
    socket.on('startGame', (gameRoom) => {
      setRoom(gameRoom);
    });

    return () => {
      socket.off('roomUpdated');
      socket.off('startGame');
    };
  }, []);

  function collisionGrid(row, col) {
    return (row < 0 || row > room.settings.gridSize) || (col < 0 || col > room.settings.gridSize);
  }

  function collisionWinner(row, col) {
    const foundPlayer = getPlayer(player.id);

    const [winLane, winSideStr] = foundPlayer.winLane.split('-');
    const winSide = parseInt(winSideStr);

    if (winLane === 'row') {
      return winSide === 0 ? row < winSide : row > winSide;
    } else {
      return winSide === 0 ? col < winSide : col > winSide;
    }
  }

  function collisionWall(row, col) {
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

  function collisionPlayer(row, col) {
    let playerFound = false;

    room.players.forEach((player) => {
      if (player.row === row && player.col === col) {
        playerFound = true;
      }
    });

    return playerFound;
  }

  function movePlayer(row, col, rowOffset, colOffset) {
    let blockX, blockY;

    blockX = col + (rowOffset === 0 ? (colOffset > 0 ? colOffset - 1 : colOffset + 1) : 0);
    blockY = row + (colOffset === 0 ? (rowOffset > 0 ? rowOffset - 1 : rowOffset + 1) : 0);

    const checkW = collisionWinner(+row + rowOffset, +col + colOffset);
    if (checkW) {
      return 'Winner';
    } else {
      const checkB = collisionWall(blockY, blockX);
      const checkP = collisionPlayer(+row + rowOffset, +col + colOffset);
      const checkG = collisionGrid(+row + rowOffset, +col + colOffset);

      if (checkB || checkP || checkG) {
        setErrorMsg(`You cannot move there, idiot.`);
        return false;
      } else {
        return room.players.map(p => {
          if (p.id === player.id) {
            p.row += rowOffset;
            p.col += colOffset;
          }
          return p;
        });
      }
    }
  }

  const getPlayer = () => {
    return room.players.find(p => p.id === player.id);
  }

  const isPlayersBoxed = () => {
    const players = room.players;

    for (const player of players) {
      const { row, col } = player;

      const leftDiv = document.querySelector(`div[data-row="${row}"][data-col="${col - 1}"]`);
      const rightDiv = document.querySelector(`div[data-row="${row}"][data-col="${col + 1}"]`);
      const topDiv = document.querySelector(`div[data-row="${row - 1}"][data-col="${col}"]`);
      const bottomDiv = document.querySelector(`div[data-row="${row + 1}"][data-col="${col}"]`);

      const isLeftBlocked = leftDiv && leftDiv.classList.contains('hasBlock');
      const isRightBlocked = rightDiv && rightDiv.classList.contains('hasBlock');
      const isTopBlocked = topDiv && topDiv.classList.contains('hasBlock');
      const isBottomBlocked = bottomDiv && bottomDiv.classList.contains('hasBlock');

      if (isLeftBlocked && isRightBlocked && isTopBlocked && isBottomBlocked) {
        return true
      }
    }

    return false
  };

  const isPathBlocked = (row, col) => {
    const elements = hoverData.axis === 'clientX' ? document.querySelectorAll(`div[data-row="${row}"] .block`) : document.querySelectorAll(`.block-vert[data-col="${col}"]`);
    const cells = elements.length;
    let isBlocked = 0;

    for (const element of elements) {
      if (element.classList.contains('hasBlock')) {
        isBlocked++
      }
    }

    return (cells - isBlocked) > 1 ? false : true;
  }

  const placeBlock = () => {
    if (hoverData && !room.winner) {
      const first = hoverData.divs[0];
      const firstRow = first.dataset.row;
      const firstCol = first.dataset.col;

      const playerBlocked = isPlayersBoxed();
      const pathBlocked = isPathBlocked(firstRow, firstCol);

      if (!playerBlocked) {
        if (!pathBlocked) {
          let allBlocks = [...room.blocks];

          hoverData.divs.map((div, key) => {
            if (div && !div.classList.contains('hasBlock')) {
              allBlocks.push({ row: parseInt(div.dataset.row), col: parseInt(div.dataset.col) });
            }
          });

          socket.emit('addBlocks', room.id, allBlocks, player.id);
        } else {
          setErrorMsg('You cannot bloth the path! Idiot.');
        }
      } else {
        setErrorMsg('You cannot block a player! Idiot.');
      }
    }
  }

  const handleEnter = (e) => {
    const currentHover = e.target;
    const currentPlayer = getPlayer();

    if (currentPlayer && currentPlayer.blocks > 0 && room.turn.id === player.id && !room.winner) {
      setTimeout(() => {
        if (currentHover.matches(':hover')) {
          const isHorizontal = currentHover.classList.contains('block');
          const axis = isHorizontal ? 'clientX' : 'clientY';
          const rect = currentHover.getBoundingClientRect();
          const rectPos = isHorizontal ? rect.left + rect.width / 2 : rect.top + rect.height / 2;
          const col = currentHover.dataset.col;
          const row = currentHover.dataset.row;
          const direction = e[axis] > rectPos ? 'right' : 'left';
      
          const getDiv = (row, col) => document.querySelector(`div[data-row="${row}"][data-col="${col}"]`);
          
          const getMiddleSpace = (rowOffset, colOffset) => {
              const newRow = isHorizontal ? row : +row + rowOffset;
              const newCol = isHorizontal ? +col + colOffset : col;
              return getDiv(newRow, newCol);
          };
      
          let middleR, middleL, middleXL, spaceR, spaceL, spaceXL;
      
          if (isHorizontal) {
              middleR = getMiddleSpace(0, 1);
              middleL = getMiddleSpace(0, -1);
              spaceR = getMiddleSpace(0, 2);
              spaceL = getMiddleSpace(0, -2);
              middleXL = getMiddleSpace(0, 3);
              spaceXL = getMiddleSpace(0, 4);
          } else {
              middleR = getMiddleSpace(1, 0);
              middleL = getMiddleSpace(-1, 0);
              spaceR = getMiddleSpace(2, 0);
              spaceL = getMiddleSpace(-2, 0);
              middleXL = getMiddleSpace(3, 0);
              spaceXL = getMiddleSpace(4, 0);
          }
      
          if (direction === 'left') {
              [middleR, middleL] = [middleL, middleR];
              [spaceR, spaceL] = [spaceL, spaceR];
              [middleXL, spaceXL] = [spaceXL, middleXL];
          }
      
          let divs = [currentHover];
      
          currentHover.classList.add('blockHover');
      
          if (spaceR && middleR) {
              divs.push(spaceR);
              divs.push(middleR);
          }
      
          if (spaceL && spaceL.classList.contains('hasBlock') && !middleL.classList.contains('hasBlock')) {
              divs.push(middleL);
          }
      
          if (spaceXL && spaceXL.classList.contains('hasBlock') && !middleXL.classList.contains('hasBlock')) {
              divs.push(middleXL);
          }
      
          divs.forEach(v => v.classList.add('blockHover'));
      
          const data = { divs, direction, axis };
      
          sethoverData(data);
      }      
      }, 100);
    }
  };

  const handleLeave = () => {
    if (hoverData) {

      hoverData.divs.map((div) => {
        if (div) {
          div.classList.remove('blockHover');
        }
      });

      sethoverData(null);
    }
  };

  return (
    <div>
      <div>Problems: {errorMsg}</div>
      <div>
        <h4>Players</h4>
        <ul>
          {room.players.map((p) => {
            return <li key={p.id}>{p.name} - {p.name === room.turn.name ? 'your turn, idiot' : ''}</li>
          })}
        </ul>
      </div>
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
                    break;
                  }
                }

                if (hasBlock) {
                  classNames += ' hasBlock';
                }

                return (
                  <div
                    key={colIndex}
                    className={classNames}
                    data-row={rowIndex}
                    data-col={colIndex}
                    onMouseEnter={mouseEv && !hasBlock ? handleEnter : undefined}
                    onMouseLeave={mouseEv && !hasBlock ? handleLeave : undefined}
                    onClick={mouseEv && !hasBlock ? placeBlock : undefined}
                  ></div>
                );
              })}

            </div>
          ))}
        </div>
        {room.winner && room.admin.id === player.id ? ( 
        <div>
          <button onClick={() => {socket.emit('roomStatus', room.id, 'inLobby')}}>Lobby</button>
          <button onClick={() => {socket.emit('startGame', room)}}>Play Again</button>
        </div>
        ) : null }
      </div>
    </div>
  );
};

export default Game;
