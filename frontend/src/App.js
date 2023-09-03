import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import Login from './templates/Login';
import Name from './templates/Name';
import Lobby from './templates/Lobby';
import Room from './templates/Room';
import Game from './templates/Game';
import Theme from './templates/Theme';
import './css/animated-bg.css';
import socket from './socket';

const App = () => {
  const [player, setPlayer] = useState({ name: '' });
  const [roomID, setRoomID] = useState(null);
  const [alert, setAlert] = useState({ message: '', style: '' });
  const [status, setStatus] = useState('');

  const timeoutRef = useRef(null);
  const refTheme = useRef('');

  useEffect(() => {
    socket.on('newPlayer', (player) => {
      setPlayer(player);
      setStatus('inLobby');
    });

    socket.on('roomCreated', (newRoom) => {
      setRoomID(newRoom);
      setStatus('inRoom');

      setTimeout(() => {
        newAlert('Room Created', 'success');
      }, 300);
    });

    socket.on('alert', (a) => {
      newAlert(a.alert, a.style);
    })

    socket.on('joinedRoom', (newRoom) => {
      setRoomID(newRoom);
      setStatus('inRoom');

      setTimeout(() => {
        newAlert('Room Joined!', 'success');
      }, 300);
    });

    socket.on('leaveRoom', (roomN) => {
      setRoomID(null);
      setStatus('inLobby');
      newAlert(`You left ${roomN}`, 'warning');
    });

    socket.on('removeAll', () => {
      setRoomID(null);
      setStatus('inLobby');
      newAlert(`Room Deleted.`, 'danger');
    });

    socket.on('roomError', (msg) => {
      setAlert(msg.message, msg.style);
    })


    return () => {
      socket.off('roomCreated');
      socket.off('startGame');
      socket.off('newPlayer');
    };
    // eslint-disable-next-line
  }, []);

  function newAlert(message, style) {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setAlert({ message, style });

    timeoutRef.current = setTimeout(() => {
      setAlert({ message: '', style: '' });
    }, 3000);
  }

  const updateTheme = (theme) => {
    refTheme.current = theme;
  }

  return (
    <div className="App">
      <Theme updateTheme={updateTheme} />

      <AnimatePresence>
        {player.name === '' ? <Login /> : null}
      </AnimatePresence>

      {player.name !== '' ? <Name player={player} /> : null}

      <AnimatePresence>
        {alert.message !== '' && (
          <motion.div
            initial={{ y: -500 }}
            animate={{ y: 0 }}
            exit={{ y: -500 }}
          >
            <div className='area alert'>
              <div className={`glass-box alert-${alert.style}`}>
                <h1>{alert.message}</h1>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {status === 'inLobby' ? (
          <Lobby player={player} newAlert={newAlert} />
      ) : null}

      {status === 'inRoom' && roomID ? (
          <Room roomID={roomID} player={player} newAlert={newAlert} setStatus={setStatus} />
      ) : null}

      {status === 'inGame' && roomID ? (
        <Game playerID={player.id} roomID={roomID} curTheme={refTheme.current} newAlert={newAlert} setStatus={setStatus} />
      ) : null}
    </div >
  );
};

export default App;
