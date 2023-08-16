import io from 'socket.io-client';

const socketURL = process.env.REACT_APP_ENV === 'production' ? process.env.REACT_APP_SERVER_PROD_URL : process.env.REACT_APP_SERVER_DEV_URL;

const socket = io(socketURL);

export default socket;
