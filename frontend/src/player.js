import React from 'react';

const Player = ({ position }) => {
  const { row, col } = position;
  const cellSize = 52; // Player's cell size (including border and margin)

  const playerStyle = {
    position: 'absolute',
    top: `${row * cellSize}px`,
    left: `${col * cellSize}px`,
    width: `${cellSize}px`,
    height: `${cellSize}px`,
    backgroundColor: 'orange',
    borderRadius: '50%',
  };

  return <div className="player" style={playerStyle}></div>;
};

export default Player;
