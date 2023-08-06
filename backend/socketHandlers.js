// backend/socketHandlers.js
const { getGridData, updateGridData } = require('./game');

const handlePlayerMove = (socket, { player, direction }) => {
  const gridData = getGridData();

  // Logic to update the grid data based on the player's move
  // ...

  // Update the grid data
  updateGridData(gridData);

  // Emit the updated grid data to all connected clients
  socket.emit('gridUpdate', gridData);
};

module.exports = { handlePlayerMove };
