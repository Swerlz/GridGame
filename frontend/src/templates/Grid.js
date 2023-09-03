import React, { useState, useEffect, useRef } from 'react';
import Players from './Players';
import GridBackground from './GridBackground';
import Cell from './Cell';

const Grid = ({ room, playerID, handlePlayerAction, newAlert }) => {
    const [gridData, setGridData] = useState(null);
    const [playerData, setPlayerData] = useState([]);
    const [blocksData, setBlocksData] = useState([]);
    const [moveDivs, setMoveDivs] = useState([]);

    const hoverData = useRef(null);
    const currentPlayerIndex = useRef('');

    useEffect(() => {
        if (!gridData && room) {
            const grid = Array.from({ length: room.settings.gridSize }, () =>
                Array.from({ length: room.settings.gridSize }, () => 'empty')
            );

            if (currentPlayerIndex.current === '') {
                const currI = room.players.findIndex((v) => v.id === playerID);
                currentPlayerIndex.current = currI;
            }

            setGridData(grid);
        }

        if (gridData) {
            if (!arraysAreEqual(blocksData, room.blocks)) {
                setBlocksData(room.blocks);
            }

            const playersPos = room.players.map((p) => {
                return p.playerPos;
            });

            if (!arraysAreEqual(playerData, playersPos)) {
                setPlayerData(room.players);
            }

            getPlayerMove();
        }

    }, [room, gridData]);

    function arraysAreEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) {
            return false;
        }

        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) {
                return false;
            }
        }

        return true;
    }

    const handleEnter = (e) => {
        const currentHover = e.target;
        const currentPlayer = getPlayer();

        if (currentPlayer && currentPlayer.blocks > 0 && room.turn.id === playerID && !room.winner) {
            setTimeout(() => {
                if (currentHover.matches(':hover')) {
                    const isHorizontal = currentHover.classList.contains('block');
                    const rect = currentHover.getBoundingClientRect();
                    const currentCol = parseInt(currentHover.dataset.col);
                    const currentRow = parseInt(currentHover.dataset.row);
                    const pIndex = room.players.findIndex((v) => v.id === currentPlayer.id);
                    let rectPos = isHorizontal ? rect.left + rect.width / 2 : rect.top + rect.height / 2;
                    let axis = isHorizontal ? 'clientX' : 'clientY';
                    let direction;

                     if (pIndex === 1 ) {
                        // Player is rotated 180deg.
                        direction = e[axis] < rectPos ? 'right' : 'left';
                    } else if (pIndex === 2) {
                        // Player is rotated -90deg
                        rectPos = isHorizontal ? rect.top + rect.height / 2 : rect.left + rect.width / 2;
                        axis = isHorizontal ? 'clientY' : 'clientX';
                        if (isHorizontal) {
                            direction = e[axis] < rectPos ? 'right' : 'left';
                        } else {
                            direction = e[axis] > rectPos ? 'right' : 'left';
                        }
                    } else if (pIndex === 3) {
                        // Player is rotated 90deg
                        rectPos = isHorizontal ? rect.top + rect.height / 2 : rect.left + rect.width / 2;
                        axis = isHorizontal ? 'clientY' : 'clientX';
                        if (isHorizontal) {
                            direction = e[axis] > rectPos ? 'right' : 'left';
                        } else {
                            direction = e[axis] < rectPos ? 'right' : 'left';
                        }
                    } else {
                        // Player is not rotated and has the original view.
                        direction = e[axis] > rectPos ? 'right' : 'left';
                    }
                    
                    const getDiv = (row, col) => document.querySelector(`div[data-row="${row}"][data-col="${col}"]`);

                    let divs = [currentHover];
                    let newCols = [];
                    let colsArr = [];

                    newCols.push({ row: currentRow, col: currentCol });

                    if (isHorizontal) {
                        if ('right' === direction) {
                            divs.push(getDiv(currentRow, +currentCol + 2))
                            newCols.push({ row: currentRow, col: +currentCol + 2 });
                        } else {
                            divs.push(getDiv(currentRow, currentCol - 2))
                            newCols.push({ row: currentRow, col: currentCol - 2 });
                        }

                        const arr = [...room.blocks, ...newCols];

                        arr.filter((v, k) => {
                            if (v.row === currentRow) {
                                colsArr.push(v.col);
                            }
                        })

                        colsArr.sort((a, b) => a - b);

                        for (let i = 0; i < colsArr.length - 1; i++) {
                            if (colsArr[i] + 2 === colsArr[i + 1]) {
                                divs.push(getDiv(currentRow, colsArr[i] + 1));
                            }
                        }
                    } else {
                        if ('right' === direction) {
                            divs.push(getDiv(+currentRow + 2, currentCol))
                            newCols.push({ row: +currentRow + 2, col: currentCol });
                        } else {
                            divs.push(getDiv(currentRow - 2, currentCol))
                            newCols.push({ row: currentRow - 2, col: currentCol });
                        }

                        const arr = [...room.blocks, ...newCols];

                        arr.filter((v, k) => {
                            if (v.col === currentCol) {
                                colsArr.push(v.row);
                            }
                        })

                        colsArr.sort((a, b) => a - b);

                        for (let i = 0; i < colsArr.length - 1; i++) {
                            if (colsArr[i] + 2 === colsArr[i + 1]) {
                                divs.push(getDiv(colsArr[i] + 1, currentCol));
                            }
                        };
                    }

                    currentHover.classList.add('blockHover');

                    divs.forEach(v => {
                        if (v) {
                            v.classList.add('blockHover')
                        }
                    });

                    const data = { divs, direction, axis };

                    hoverData.current = data;
                }
            }, 100);
        }
    };

    const handleLeave = () => {
        if (hoverData.current) {

            hoverData.current.divs.forEach((div) => {
                if (div) {
                    if (div.classList.contains('blockHover')) {
                        div.classList.remove('blockHover');
                    }
                }
            });

            hoverData.current = null;
        }
    };

    const placeBlock = () => {
        if (hoverData.current && !room.winner) {
            const first = hoverData.current.divs[0];
            const firstRow = first.dataset.row;
            const firstCol = first.dataset.col;

            const playerBlocked = isPlayersBoxed();
            const pathBlocked = isPathBlocked(firstRow, firstCol);

            if (!playerBlocked) {
                // if (!pathBlocked) {
                    let allBlocks = [...room.blocks];

                    hoverData.current.divs.forEach((div, key) => {
                        if (div && !div.classList.contains('hasBlock')) {
                            allBlocks.push(div.dataset.row + '-' + div.dataset.col);
                        }
                    });

                    handlePlayerAction('addBlocks', allBlocks, playerID);
                // } else {
                //     newAlert('You cannot block the path! Idiot.', 'danger');
                // }
            } else {
                newAlert('You cannot block a player! Idiot.', 'danger');
            }
        }
    }

    const isPathBlocked = (row, col) => {
        const elements = hoverData.current.axis === 'clientX' ? document.querySelectorAll(`div[data-row="${row}"] .block`) : document.querySelectorAll(`.block-vert[data-col="${col}"]`);
        const cells = elements.length;
        let isBlocked = 0;

        for (const element of elements) {
            if (element.classList.contains('hasBlock')) {
                isBlocked++
            }
        }

        return (cells - isBlocked) > 2 ? false : true;
    }

    const hasBlock = (position) => {
        return room.blocks.some(blockPos => blockPos === position);
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

    const getPlayerMove = () => {
        if (room.turn.id === playerID && !room.winner) {
            const player = room.turn;
            const playerPosition = room.turn.playerPos;
            const maxPos = room.settings.gridSize - 1;
            const canWallJump = room.settings.wallJump;
            let canMove = [];
            let moveAmount = 2;

            let directions = [
                { rowChange: 0, colChange: -1, moveDiagonal: false }, // left
                { rowChange: 0, colChange: 1, moveDiagonal: false }, // right
                { rowChange: 1, colChange: -1, moveDiagonal: true }, // downleft
                { rowChange: 1, colChange: 0, moveDiagonal: false }, // down
                { rowChange: 1, colChange: 1, moveDiagonal: true }, // downright
                { rowChange: -1, colChange: -1, moveDiagonal: true }, // upleft
                { rowChange: -1, colChange: 0, moveDiagonal: false }, // up
                { rowChange: -1, colChange: 1, moveDiagonal: true }, // upright
            ];

            if (!room.settings.moveDiagonal || player.moveDiagonalDelay > 0) {
                directions = directions.filter(direction => !direction.moveDiagonal);
            }

            if (room.settings.doubleJump && player.doubleJumpDelay === 0) {
                moveAmount = 4;
            }

            for (const dir of directions) {
                let row = parseInt(playerPosition.split('-')[0]);
                let col = parseInt(playerPosition.split('-')[1]);
                let wall_1 = false;
                let wall_2 = false;

                for (let i = 1; i <= moveAmount; i++) {
                    row += dir.rowChange;
                    col += dir.colChange;

                    if (row <= maxPos && col <= maxPos && row >= 0 && col >= 0) {
                        const positionToCheck = `${row}-${col}`;

                        if (canWallJump) {
                            if (!hasBlock(positionToCheck)) {
                                const wallPos = i === 2 ? 1 : 3;
                                if (i == 2 || i == 4) {
                                    canMove.push({
                                        newPosition: positionToCheck,
                                        moveDiagonal: dir.moveDiagonal,
                                        doubleJump: i === 4 ? true : false,
                                        wallJump: i === 2 ? wall_1 ? true : false : wall_1 || wall_2 ? true : false,
                                    });
                                }
                            } else {
                                if (i === 1) {
                                    wall_1 = true;
                                }

                                if (i === 3) {
                                    wall_2 = true;
                                }
                            }
                        } else {
                            if (hasBlock(positionToCheck)) {
                                break;
                            } else {
                                if (i == 2 || i == 4) {
                                    canMove.push({ newPosition: positionToCheck, moveDiagonal: dir.moveDiagonal, doubleJump: i === 4 ? true : false });
                                }
                            }
                        }
                    }
                }
            }

            if (canMove.length > 0) {
                // Player can move.
                let theDivs = [];

                for (let i = 0; i < canMove.length; i++) {
                    const el = canMove[i];
                    const pos = el.newPosition.split('-');
                    theDivs.push({ row: pos[0], col: pos[1], double: el.doubleJump, diagonal: el.moveDiagonal, wallJump: el.wallJump });
                }

                setMoveDivs(theDivs)
            } else {
                // Player cannot move.
                setMoveDivs([]);
                newAlert('You cannot move.', 'danger');
            }
        } else {
            setMoveDivs([]);
        }
    }

    const prevMoveDivs = useRef([]);

    useEffect(() => {
        const playerIndex = room.players.findIndex(p => p.id === playerID) + 1;

        // Remove event listeners from previous moveDivs
        prevMoveDivs.current.forEach((pos) => {
            const div = document.querySelector(`div[data-row="${pos.row}"][data-col="${pos.col}"]`);
            if (div) {
                div.classList.remove(`canMove-${playerIndex}`);
                div.dataset.diagonal = '';
                div.dataset.double = '';
                div.dataset.walljump = '';
                div.removeEventListener('click', clicked)
            }
        });

        // Add event listeners to new moveDivs
        moveDivs.forEach((pos) => {
            const div = document.querySelector(`div[data-row="${pos.row}"][data-col="${pos.col}"]`);
            if (div) {
                div.classList.add(`canMove-${playerIndex}`);
                div.dataset.diagonal = pos.diagonal;
                div.dataset.double = pos.double;
                div.dataset.walljump = pos.wallJump;
                div.addEventListener('click', clicked);
            }
        });

        // Update the previous moveDivs with the new value
        prevMoveDivs.current = moveDivs;

        return () => {
            prevMoveDivs.current.forEach((pos) => {
                const div = document.querySelector(`div[data-row="${pos.row}"][data-col="${pos.col}"]`);
                if (div) {
                    div.classList.remove('canMove');
                    div.dataset.diagonal = '';
                    div.dataset.double = '';
                    div.dataset.walljump = '';
                    div.removeEventListener('click', clicked)
                }
            });

        }

    }, [moveDivs]);

    const collisionWinner = (row, col) => {
        const foundPlayer = getPlayer(playerID);

        const [winLane, winSideStr] = foundPlayer.winLane.split('-');
        const winSide = parseInt(winSideStr);

        if (winLane === 'row') {
            return winSide === 0 ? row == winSide : row == winSide;
        } else {
            return winSide === 0 ? col == winSide : col == winSide;
        }
    }

    const clicked = (e) => {
        const foundPlayer = getPlayer(playerID);
        const el = e.target;
        const row = el.dataset.row;
        const col = el.dataset.col;
        const hasWon = collisionWinner(row, col);
        let delayed = 0;

        const updatedPlayers = room.players.map(p => {
            if (p.id === playerID) {
                p.playerPos = `${row + '-' + col}`

                if (el.dataset.walljump == 'true') {
                    p.delay = room.settings.wallJumpDelay + 1;
                    delayed = room.settings.wallJumpDelay + 1;
                }

                if (el.dataset.double == 'true') {
                    p.doubleJumpDelay = room.settings.doubleJumpDelay + 1;
                }

                if (el.dataset.diagonal == 'true') {
                    p.moveDiagonalDelay = room.settings.moveDiagonalDelay + 1;
                }
            }
            return p;
        });

        if (hasWon) {
            handlePlayerAction('playerWon', updatedPlayers, foundPlayer);
        } else {
            handlePlayerAction('playerMove', updatedPlayers, playerID);
        }
    }

    const getPlayer = () => {
        return room.players.find(p => p.id === playerID);
    }

    return (
        <div className={`game-container view-${currentPlayerIndex.current}`}>

            <Players playersData={playerData} playerID={playerID} />

            {gridData && (
                <div className="grid">
                    {gridData.map((row, rowIndex) => (
                        <div key={rowIndex} data-key={rowIndex} className={`row ${rowIndex % 2 !== 0 ? 'block-row' : 'square-row'}`} data-row={rowIndex}>
                            {row.map((cell, colIndex) => {
                                let classNames = `cell ${cell}`;
                                let mouseEv = false;
                                let hasBlock = false;

                                if (rowIndex % 2 === 1) {
                                    if (colIndex % 2 === 0) {
                                        classNames += ' block';
                                        mouseEv = true
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

                                for (const roomBlock of blocksData) {
                                    const split = roomBlock.split("-");
                                    if (rowIndex == split[0] && colIndex == split[1]) {
                                        hasBlock = true;
                                        break;
                                    }
                                }

                                if (hasBlock) {
                                    classNames += ' hasBlock';
                                }

                                return (
                                    <Cell
                                        key={`${rowIndex}-${colIndex}`}
                                        classNames={classNames}
                                        rowIndex={rowIndex}
                                        colIndex={colIndex}
                                        mouseEv={mouseEv}
                                        hasBlock={hasBlock}
                                        handleEnter={handleEnter}
                                        handleLeave={handleLeave}
                                        placeBlock={placeBlock}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}

            <GridBackground gridData={gridData} />

        </div>
    )
}

export default Grid;