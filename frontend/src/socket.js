import io from 'socket.io-client';

const socket = io('https://grid-server.onrender.com:10000');

console.log(socket);

export default socket;
