const cors = require('cors');

const express = require('express');
const app = express();

const http = require('http').createServer(express);

const MODE = process.env.NODE_ENV;
const FRONTEND_URL = MODE === 'production' ? process.env.FRONTEND_URL : process.env.DEV_URL;
const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: "http://localhost:3000",
  methods: ['GET', 'POST'],
};

const io = require('socket.io')(http, {
  cors: corsOptions,
});

app.use(cors(corsOptions));

if (MODE === 'production') {
  app.use(express.static(path.join(__dirname, 'frontend/build')));
}

let rooms = [];

function isRoomAdmin(adminID, playerID) {
  return adminID === playerID;
}

function lobbyUpdate() {
  io.in('lobby').emit('lobbyUpdate', rooms);
}

function emitRoomUpdate(id, updatedRoom) {
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
  const updatedRoom = {
    ...room,
    players: room.players.filter((player) => player.id !== playerSocket.id)
  }

  updateRooms(updatedRoom)

  playerSocket.leave(room.id);
  playerSocket.join('lobby');

  playerSocket.emit('roomUpdated', null);
  io.in(room.id).emit('roomUpdated', updatedRoom);
}

function updateStartingPosition(room) {
  room.players.forEach((player, index) => {
    const gridSize = room.settings.gridSize;
    let row, col, winLane;

    if (index === 0) {
      row = gridSize - 1;
      col = (gridSize - 1) / 2;
      winLane = 'row-0';
    } else if (index === 1) {
      row = 0;
      col = (gridSize - 1) / 2;
      winLane = 'row-' + gridSize;
    } else if (index === 2) {
      row = (gridSize - 1) / 2;
      col = 0;
      winLane = 'col-' + gridSize;
    } else {
      row = (gridSize - 1) / 2;
      col = gridSize - 1;
      winLane = 'col-0';
    }

    player.winLane = winLane;
    player.row = row;
    player.col = col;
  });

  return room;
}

function updateNextPlayer(roomFound, currentPlayerID) {
  const playerIndex = roomFound.players.findIndex(p => p.id === currentPlayerID);

  let nextPlayerIndex = playerIndex + 1;

  if (nextPlayerIndex >= roomFound.players.length) {
    nextPlayerIndex = 0;
  }

  roomFound.turn = roomFound.players[nextPlayerIndex];
}

function getRandomPlayer(players) {
  return players[Math.floor(Math.random() * players.length)];
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
      targetRoom.players.push({ name: player.name, id: player.id });

      updateRooms(targetRoom);

      socket.leave('lobby');
      socket.join(id);

      emitRoomUpdate(id, targetRoom);
    }
  });

  socket.on('playerMove', (roomID, updatedPlayers, currentPlayerID) => {
    const roomFound = findRoom(roomID);

    if (roomFound) {
      roomFound.players = updatedPlayers;

      updateNextPlayer(roomFound, currentPlayerID);

      emitRoomUpdate(roomID, roomFound);
    }
  });

  socket.on('playerWon', (roomID, player) => {
    const roomFound = findRoom(roomID);

    if (roomFound) {
      roomFound.winner = player;

      updateRooms(roomFound);
      emitRoomUpdate(roomFound.id, roomFound)
    }
  });

  socket.on('addBlocks', (roomID, blocks, currentPlayerID) => {
    const roomFound = findRoom(roomID);

    if (roomFound) {
      roomFound.blocks = blocks;

      roomFound.players = roomFound.players.map(v => {
        return v.id === currentPlayerID ? { ...v, blocks: v.blocks - 1 } : v;
      });

      updateNextPlayer(roomFound, currentPlayerID);

      emitRoomUpdate(roomID, roomFound);
    }
  });

  socket.on('roomStatus', (roomID, status) => {
    const roomFound = findRoom(roomID);

    if (roomFound) {
      roomFound.status = status;

      updateRooms(roomFound);
      emitRoomUpdate(roomFound.id, roomFound)
    }
  });

  socket.on('leaveRoom', (room, playerID) => {
    if (isRoomAdmin(room.admin.id, playerID)) {
      removeAllFromRoom(room.id);
    } else {
      removePlayerFromRoom(room, socket);
    }
  });

  socket.on('startGame', (room) => {
    const randomPlayer = getRandomPlayer(room.players);

    room.players.map((val, key) => { val.blocks = room.settings.maxBlocks; });
    room.winner = null;
    room.turn.name = randomPlayer.name;
    room.turn.id = randomPlayer.id;
    room.blocks = [];
    room.status = 'inGame';
    room = updateStartingPosition(room);

    updateRooms(room);

    io.in(room.id).emit('startGame', room);
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
});

http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
