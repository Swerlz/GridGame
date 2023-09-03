require('dotenv').config();
const cors = require('cors');

const express = require('express');
const app = express();

const http = require('http').createServer(express);

const FRONTEND_URL = process.env.REACT_APP_ENV === 'production' ? process.env.REACT_APP_FRONT_PROD_URL : process.env.REACT_APP_FRONT_DEV_URL;
const PORT = process.env.REACT_APP_PORT || 5000;

const corsOptions = {
  origin: FRONTEND_URL,
  methods: ['GET', 'POST'],
};

const io = require('socket.io')(http, {
  cors: corsOptions,
});

app.use(cors(corsOptions));

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

function emitMainRoomUpdate(id, updatedRoom) {
  io.in(id).emit('mainRoomUpdated', updatedRoom);
}

function emitStartGame(id, startRoom) {
  io.in(id).emit('startGame', startRoom);
}

function emitError(id, errorMsg) {
  io.in(id).emit('roomError', errorMsg);
}

function emitSettingsUpdate(id, updatedRoom) {
  io.in(id).emit('settingsUpdate', updatedRoom);
}

function emitBackToRoom(roomID) {
  io.in(roomID).emit('fromGame');
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
    socket.emit('removeAll');
    socket.leave(roomID);
  });

  removeRoom(roomID);
}

function removePlayerFromRoom(room, playerSocket) {
  const playerName = room.players.find(player => player.id === playerSocket.id);
  const updatedRoom = {
    ...room,
    players: room.players.filter((player) => player.id !== playerSocket.id)
  }

  updateRooms(updatedRoom)

  const roomAlert = { message: `${playerName.name} left the room.`, style: 'warning' };
  const roomAll = { newRoom: updatedRoom, alert: roomAlert };

  playerSocket.leave(room.id);
  playerSocket.emit('leaveRoom', room.name);

  io.in(room.id).emit('roomUpdated', roomAll);
}

function updateStartingPosition(room) {
  const randomStart = room.settings.randomStart;
  const gridSize = room.settings.gridSize - 1;
  room.playersPos = [];

  room.players.forEach((player, index) => {
    let row, col, winLane;

    if (index === 0) {
      col = randomStart ? getRandomEvenNumber(0, gridSize) : gridSize / 2;
      row = gridSize;
      winLane = 'row-0';
    } else if (index === 1) {
      row = 0;
      col = randomStart ? getRandomEvenNumber(0, gridSize) : gridSize / 2;
      winLane = 'row-' + gridSize;
    } else if (index === 2) {
      row = randomStart ? getRandomEvenNumber(0, gridSize) : gridSize / 2;
      col = 0;
      winLane = 'col-' + gridSize;
    } else {
      row = randomStart ? getRandomEvenNumber(0, gridSize) : gridSize / 2;
      col = gridSize;
      winLane = 'col-0';
    }

    player.winLane = winLane;
    player.playerPos = row + '-' + col;
    room.playersPos.push(row + '-' + col);
  });

  return room;
}

function updateNextPlayer(roomFound, currentPlayerID) {
  const playerIndex = roomFound.players.findIndex(p => p.id === currentPlayerID);
  let nextPlayerIndex = playerIndex + 1;

  if (nextPlayerIndex >= roomFound.players.length) {
    nextPlayerIndex = 0;
  }

  const nextPlayer = roomFound.players[nextPlayerIndex];

  if (roomFound.settings.moveDiagonal && nextPlayer.moveDiagonalDelay > 0) {
    nextPlayer.moveDiagonalDelay--;
  }

  if (roomFound.settings.doubleJump && nextPlayer.doubleJumpDelay > 0) {
    nextPlayer.doubleJumpDelay--;
  }

  if (nextPlayer.delay > 0) {
    nextPlayer.delay--;

    updateNextPlayer(roomFound, nextPlayer.id);
  } else {
    roomFound.turn = nextPlayer;
  }
}

function getRandomPlayer(players) {
  return players[Math.floor(Math.random() * players.length)];
}

function getRandomOddNumber(min, max) {
  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  return randomNumber % 2 === 0 ? randomNumber + 1 : randomNumber;
}

function getRandomEvenNumber(min, max) {
  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  return randomNumber % 2 !== 0 ? randomNumber + 1 : randomNumber;
}

function getRandomNumber(max) {
  return Math.floor(Math.random() * (max - 1));
}

function setRandomBlocks(randomBlocks, randomPlayerBlocks, gridSize) {
  let randomArray = [];

  if (randomBlocks > 0) {
    for (let i = 0; i < randomBlocks; i++) {
      let row = getRandomNumber(gridSize);
      let col;

      if (row % 2 === 0) {
        col = getRandomOddNumber(0, gridSize);
      } else {
        col = getRandomEvenNumber(0, gridSize);
      }

      randomArray.push(row + '-' + col);
    }
  }

  if (randomPlayerBlocks > 0) {
    for (let i = 0; i < randomPlayerBlocks; i++) {
      let row = getRandomEvenNumber(0, gridSize);
      let col = getRandomEvenNumber(0, gridSize);

      randomArray.push(row + '-' + col);
    }
  }

  return randomArray;
}

io.on('connection', (socket) => {

  socket.on('newPlayer', (player) => {
    player.id = socket.id;

    socket.emit('newPlayer', player);
  });

  socket.on('changeName', player => {

  });

  socket.on('getRoom', (roomID) => {
    roomFound = findRoom(roomID);

    if (roomFound) {

      const alert = { message: ``, style: 'success' };
      const updatedRoom = { newRoom: roomFound, alert };

      emitRoomUpdate(roomFound.id, updatedRoom);
    } else {
      emitError(roomID, { message: 'getRoom Error', style: 'danger' });
    }
  })

  socket.on('createRoom', (newRoom) => {
    rooms.push(newRoom);

    socket.join(newRoom.id);
    socket.emit('roomCreated', newRoom.id);
  });

  socket.on('updateLobby', () => {
    socket.emit('lobbyUpdate', rooms);
  });

  socket.on('joinRoom', (id, player) => {
    const targetRoom = findRoom(id);

    if (targetRoom ) {
      
      if (targetRoom.players.length < 4 && targetRoom.status === 'inRoom') {
      targetRoom.players.push(player);

      updateRooms(targetRoom);

      const alert = { message: `${player.name} joined the room.`, style: 'success' };
      const updatedRoom = { newRoom: targetRoom, alert };

      emitRoomUpdate(id, updatedRoom);

      socket.leave('lobby');
      socket.join(id);
      socket.emit('joinedRoom', targetRoom.id);
      } else {
        // Room Full.
        let alert = '';
        if (targetRoom.players.length === 4) {
          alert = 'Room is full.';
        }
        if (targetRoom.status === 'inGame') {
          alert = 'Game has started.';
        }

        const newAlert = {alert, style: 'danger'};

        socket.emit('alert', newAlert);
      }
    } else {
      let alert = 'Room not found.';

      const newAlert = {alert, style: 'danger'};

      socket.emit('alert', newAlert);
    }
  });

  socket.on('playerMove', (roomID, updatedPlayers, foundPlayer) => {
    const roomFound = findRoom(roomID);

    if (roomFound) {
      roomFound.players = updatedPlayers;

      updateNextPlayer(roomFound, foundPlayer);

      // emitRoomUpdate(roomID, roomFound);
      const alert = { message: `Player moved.`, style: 'warning' };
      const newRoom = { newRoom: roomFound, alert };

      emitRoomUpdate(roomID, newRoom);
    }
  });

  socket.on('playerWon', (roomID, updatedPlayers, foundPlayer) => {
    const roomFound = findRoom(roomID);

    if (roomFound) {
      roomFound.winner = foundPlayer;
      roomFound.players = updatedPlayers;

      const newAlert = { message: ``, style: 'success' };
      const newRoom = { newRoom: roomFound, alert: newAlert };

      emitRoomUpdate(roomID, newRoom);
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

      const newAlert = { message: `A block was placed.`, style: 'warning' };
      const newRoom = { newRoom: roomFound, alert: newAlert };

      emitRoomUpdate(roomID, newRoom);
    }
  });

  socket.on('updateSettings', (roomID, settings) => {
    const roomFound = findRoom(roomID);

    if (roomFound) {
      roomFound.settings = settings;

      updateRooms(roomFound);

      emitSettingsUpdate(roomFound.id, roomFound)
    }
  });

  socket.on('leaveRoom', (roomID, playerID) => {
    const roomFound = findRoom(roomID);

    if (roomFound) {
      if (isRoomAdmin(roomFound.admin.id, playerID)) {
        removeAllFromRoom(roomFound.id);
      } else {
        removePlayerFromRoom(roomFound, socket);
      }
    }
  });

  socket.on('backToRoom', (roomID) => {
    const roomFound = findRoom(roomID);

    if (roomFound) {
      roomFound.status = 'inRoom'

      emitBackToRoom(roomFound.id)
    }
  });

  socket.on('serverStartGame', (roomID) => {
    let room = findRoom(roomID);
    const randomPlayer = getRandomPlayer(room.players);

    room.players.map(p => {
      p.blocks = room.settings.maxBlocks;

      if (room.settings.wallJump) {
        p.delay = room.settings.wallJumpDelay;
      }

      if (room.settings.doubleJump) {
        p.doubleJumpDelay =  0;
      }

      if (room.settings.moveDiagonal) {
        p.moveDiagonalDelay =  0;
      }
    });

    room.winner = null;
    room.blocks = setRandomBlocks(room.settings.randomBlocks, room.settings.randomPlayerBlocks, room.settings.gridSize - 1);
    room.status = 'inGame';
    room = updateStartingPosition(room);

    room.turn = randomPlayer;

    updateRooms(room);

    io.in(room.id).emit('clientStartGame', room);
  });

  socket.on('disconnect', () => {
    rooms.forEach((room, index) => {
      if (room.players.some((player) => player.id === socket.id)) {
        if (isRoomAdmin(room.admin.id, socket.id)) {
          removeAllFromRoom(room.id);
        } else {
          removePlayerFromRoom(room, socket);
        }

        return false;
      }
    });
  });
});

http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
