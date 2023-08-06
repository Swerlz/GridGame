const express = require('express');
const cors = require('cors');
const http = require('http').createServer(express);
const { handlePlayerMove } = require('./socketHandlers');
const io = require('socket.io')(http, {
  cors: {
    origin: 'http://localhost:3000', // Replace with your frontend's URL
    methods: ['GET', 'POST'],
  },
});

const GRID_SIZE = 9;
let rooms = [];

// Initialize the grid data
let gridData = Array.from({ length: GRID_SIZE }, () =>
  Array.from({ length: GRID_SIZE }, () => 'empty')
);

const getGridData = () => gridData;

const updateGridData = (newGridData) => {
  gridData = newGridData;
};

express().use(
  cors({
    origin: 'http://localhost:3000',
  })
);

function isRoomAdmin(adminID, playerID) {
  return adminID === playerID;
}

function lobbyUpdate() {
  io.in('lobby').emit('lobbyUpdate', rooms);
}

function updateRoom(id, updatedRoom) {
  io.in(id).emit('roomUpdated', updatedRoom);
}

function updateRooms(updatedRoom) {
  rooms = rooms.map(room => (room.id === updatedRoom.id ? updatedRoom : room));
}

function findRoom(id) {
  return rooms.find((room) => room.id === id);
}

function removeRoom(roomID) {
  rooms = rooms.filter((room) => room.id !== roomID);
}

async function removeAllFromRoom(roomID) {
  const roomSockets = await io.in(roomID).fetchSockets();

  roomSockets.forEach(socket => {
    socket.emit('roomUpdated', null);
    socket.leave(roomID);
    socket.join('lobby');
  });

  removeRoom(roomID);
  lobbyUpdate();
}

function removePlayerFromRoom(room, playerSocket) {
  const removedPlayer = {
    ...room,
    players: room.players.filter((player) => player.id !== playerSocket.id)
  }

  const updatedRoom = updateStartingPosition(removedPlayer);

  updateRooms(updatedRoom)

  playerSocket.leave(room.id);
  playerSocket.join('lobby');

  playerSocket.emit('roomUpdated', null);
  io.in(room.id).emit('roomUpdated', updatedRoom);
}

function updateStartingPosition(room) {
  room.players.forEach((player, index) => {
    let row;
    let col;

    if (index === 0) {
      row = 16;
      col = 8;
    } else if (index === 1) {
      row = 0;
      col = 8;
    } else if (index === 2) {
      row = 8;
      col = 0;
    } else {
      row = 8;
      col = 16;
    }
    
    player.row = row;
    player.col = col;
  });

  return room;
}

io.on('connection', (socket) => {
  
  socket.on('newPlayer', (player) => {
    player.inGame = false;
    player.id = socket.id;

    socket.join('lobby');
    socket.emit('playerAdded', player);
  });

  socket.on('createRoom', (newRoom) => {
    rooms.push(newRoom);

    socket.leave('lobby');
    socket.join(newRoom.id);
    socket.emit('roomUpdated', newRoom);

    lobbyUpdate();
  });

  socket.on('getRooms', () => {
    socket.emit('lobbyUpdate', rooms);
  });

  socket.on('joinRoom', (id, player) => {
    const targetRoom = findRoom(id);

    if (targetRoom) {
      targetRoom.players.push({ name: player.name, id: player.id, blocks: 8 });

      const updatedRoom = updateStartingPosition(targetRoom);

      socket.leave('lobby');
      socket.join(id);

      updateRoom(id, updatedRoom);
    }
  });

  socket.on('playerMove', (updatedRoom) => {
    updateRoom(updatedRoom.id, updatedRoom);
  });

  socket.on('leaveRoom', (room, playerID) => {
      if (isRoomAdmin(room.admin.id, playerID)) {
        removeAllFromRoom(room.id);
      } else {
        removePlayerFromRoom(room, socket);
      }
  });

  socket.on('startGame', (room) => {
    io.in(room.id).emit('startGame');
  }); 

  socket.on('disconnect', () => {
    rooms.forEach((room, index) => {
      if (room.players.some((player) => player.id === socket.id)) {
        if (isRoomAdmin(room.admin.id, socket.id)) {
          removeAllFromRoom(room.id);
        } else {
          removePlayerFromRoom(room, socket);
          socket.emit('roomUpdate', null);
        }

        return false;
      }
    });
  });










  // Emit the initial grid data to the newly connected client
  // socket.emit('gridUpdate', gridData);

  // // Handle player move events from the client
  // socket.on('playerMove', (data) => {
  //   handlePlayerMove(socket, data);
  // });

});

const PORT = process.env.PORT || 5000;

http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});