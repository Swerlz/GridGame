const rooms = [];

function roomCreate(roomID, roomName, admin) {
    const newRoom = { id: roomID, name: roomName, admin, players: [{ name: admin, id: socket.id }] };
    rooms.push(newRoom);
}

function roomJoin(id, playerName) {
    const targetRoom = rooms.find((room) => room.id === id);

    if (targetRoom) {
      targetRoom.players.push({ name: playerName, id: socket.id });

      return true;
    }
}

function roomLeave(socketID) {
    console.log('A user disconnected:', socket.id);

    let updatedRoom;

    rooms.forEach((room, index) => {
      console.log('looping through rooms')
      if (room.players.some((player) => player.id === socket.id)) {
        updatedRoom = { ...room, players: room.players.filter((player) => player.id !== socket.id) };

        if (updatedRoom.players.length === 0) {
          rooms.splice(index, 1);

          socket.emit('lobbyUpdate', rooms);
        } else {
          updatedRoom.players.forEach(player => {
            socket.to(player.id).emit('roomUpdated', updatedRoom);
          });
        }

        return false;
      }
    });
}

function lobbyUpdate() {
    socket.emit('lobbyUpdate', rooms);
}

module.exports = {
    rooms,
    roomCreate,
    roomJoin,
    roomLeave,
    lobbyUpdate
}