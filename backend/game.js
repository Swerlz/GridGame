// backend/game.js
const GRID_SIZE = 17;

// Initialize the grid data
let gridData = Array.from({ length: GRID_SIZE }, () =>
  Array.from({ length: GRID_SIZE }, () => 'empty')
);

const getGridData = () => gridData;

const updateGridData = (newGridData) => {
  gridData = newGridData;
};



module.exports = { getGridData, updateGridData };
