import React, { useEffect, useState } from 'react';
import Players from './Players';
import socket from '../socket';

const Game = ({ player, initialRoom }) => {
  const [room, setRoom] = useState(initialRoom);
  const [hoverData, sethoverData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const gridData = Array.from({ length: room.settings.gridSize }, () =>
    Array.from({ length: room.settings.gridSize }, () => 'empty')
  );

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (room.turn.id === player.id) {
        const foundPlayer = room.players.find((val) => val.id === player.id)

        if (foundPlayer) {
          const { row, col } = foundPlayer;
          let updatedPlayers;

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

          setErrorMsg('');

          if (updatedPlayers) {
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
    socket.on('roomUpdated', (updatedRooms) => {
      setRoom(updatedRooms);
    });

    return () => {
      socket.off('roomUpdated');
    };
  }, []);

  function collisionGrid(row, col) {
    return (row < 0 || row > 16) || (col < 0 || col > 16);
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

    if (rowOffset === 0) {
      blockY = row;
      if (colOffset > 0) {
        blockX = col + (colOffset - 1);
      } else {
        blockX = col + (colOffset + 1);
      }
    } else {
      blockX = col;
      if (rowOffset > 0) {
        blockY = row + (rowOffset - 1);
      } else {
        blockY = row + (rowOffset + 1);
      }
    }

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
    if (hoverData) {
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

    if (currentPlayer && currentPlayer.blocks > 0 && room.turn.id === player.id) {
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

          // const applyHoverClass = (current, middle, second) => {
          //   current.classList.add('blockHover');

          //   if (second && !second.classList.contains('hasBlock')) {
          //     middle.classList.add('blockHover');
          //     second.classList.add('blockHover');
          //   } else if (middle) {
          //     middle.classList.add('blockHover');
          //   }
          // }

          let middleR, middleL, middleXL, spaceR, spaceL, spaceXL;

          if (isHorizontal) {
            middleR = getDiv(row, +col + 1);
            middleL = getDiv(row, col - 1);
            middleXL = getDiv(row, +col + 3);
            spaceR = getDiv(row, +col + 2);
            spaceL = getDiv(row, col - 2);
            spaceXL = getDiv(row, col - 4);
            
            if ('right' === direction) {
              middleXL = getDiv(row, +col + 3);
              spaceXL = getDiv(row, +col + 4);
            } else {
              middleXL = getDiv(row, col - 3);
              spaceXL = getDiv(row, col -4);
            }
          } else {
            middleR = getDiv(+row + 1, col);
            middleL = getDiv(row - 1, col);
            spaceR = getDiv(+row + 2, col);
            spaceL = getDiv(row - 2, col);

            if ('right' === direction) {
              middleXL = getDiv(+row + 3, col);
              spaceXL = getDiv(+row + 4, col);
            } else {
              middleXL = getDiv(row - 3, col);
              spaceXL = getDiv(row - 4, col);
            }
          }

          let divs = [currentHover];

          currentHover.classList.add('blockHover');

          if ('right' === direction) {
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
          } else {
            if (spaceL && middleL) {
              divs.push(spaceL);
              divs.push(middleL);
            }

            if (spaceR && spaceR.classList.contains('hasBlock') && !middleR.classList.contains('hasBlock')) {
              divs.push(middleR);
            }

            if (spaceXL && spaceXL.classList.contains('hasBlock') && !middleXL.classList.contains('hasBlock')) {
              divs.push(middleXL);
            }
          }

          divs.map(v => { v.classList.add('blockHover') })

          // const middle = direction == 'right' ? 
          //   isHorizontal ? getDiv(row, +col + 1) : getDiv(+row + 1, col) : 
          //   isHorizontal ? getDiv(row, col - 1) : getDiv(row - 1, col);
          // const second = direction == 'right' ?
          //   isHorizontal ? getDiv(row, +col + 2) : getDiv(+row + 2, col) : 
          //   isHorizontal ? getDiv(row, col - 2) : getDiv(row - 2, col);

          // applyHoverClass(currentHover, middle, second);
          // applyHoverClass(currentHover, middle, second);

          // const data = { divs: [currentHover, middle, second], direction, axis };
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
            return <li key={p.id}>{p.name} {p.name === room.turn.name ? '- your turn, idiot' : ''}</li>
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
      </div>
    </div>
  );
};

export default Game;
