import React, { useState, useEffect } from 'react';
import socket from '../socket';
import Settings from './Settings';
import { motion, AnimatePresence } from 'framer-motion';

const Room = ({ roomID, player, newAlert, setStatus }) => {
  const [newRoom, setNewRoom] = useState(null);
  const [roomSettings, setRoomSettings] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLeavingRoom, setIsLeavingRoom] = useState(false); // New state for controlling exit animations

  useEffect(() => {
    socket.emit('getRoom', roomID);
  }, [roomID])

  useEffect(() => {
    socket.on('roomUpdated', (updatedRoom) => {
      if (updatedRoom.newRoom.admin.id === player.id) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }

      setRoomSettings(updatedRoom.newRoom.settings);
      setNewRoom(updatedRoom.newRoom);

      if (updatedRoom.alert.message.length > 0) {
        newAlert(updatedRoom.alert.message, updatedRoom.alert.style);
      }
    });
    
    socket.on('clientStartGame', () => {
      setIsLeavingRoom(true);

      setTimeout(() => {
        setStatus('inGame');
      }, 300);
    });


    return () => {
      socket.off('roomUpdated');
      socket.off('clientStartGame')
    };
  }, []);

  const handleStartGame = () => {
    socket.emit('serverStartGame', roomID);
  }

  const leaveRoom = () => {
    setIsLeavingRoom(true);

    setTimeout(() => {
      socket.emit('leaveRoom', roomID, player.id);
    }, 300);
  };

  return (
    <>
      {newRoom && (
        <AnimatePresence>
          {!isLeavingRoom && (
            <motion.div
              className='area room'
              initial={{ x: -400 }}
              animate={{
                x: 0, transition: {
                  duration: 0.3,
                  delay: .1,
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                },
              }}
              exit={{ x: -400 }}
            >
              <div className='glass-box'>
                <div className='room-box'>
                  <div className='room-each'>
                    <h6>Room Name:</h6>
                    <h5 className=''>{newRoom.name}</h5>
                  </div>

                  <div className='room-each'>
                    <h6>Room Admin:</h6>
                    <h5>{newRoom.admin.name}</h5>
                  </div>

                  <div className='room-each'>
                    <h6>Room Status:</h6>
                    <h5>{newRoom.status}</h5>
                  </div>

                  <div className='room-each'>
                    <h6>Room Players:</h6>
                    <h5>{newRoom.players.length}/4</h5>
                  </div>

                  <div className='room-players'>
                    <ul>
                      {newRoom.players.map((player, index) => (
                        <li key={player.id} className={`each-player`}>
                          <h5>{player.name}</h5>
                          <img src={`/images/players/player-${index + 1}.png`} className='player-img'></img>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className='inline-flex'>
                    <button className='btn-plain' onClick={leaveRoom}>{isAdmin ? 'Delete Room' : 'Back'}</button>
                    {isAdmin && <button onClick={handleStartGame}>Start Game</button>}
                  </div>

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {roomSettings && (
        <AnimatePresence>
          {!isLeavingRoom && (
            <motion.div
              className='area middle'
              initial={{ x: 1300 }}
              animate={{
                x: 0, transition: {
                  delay: .4,
                  duration: .3,
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                }
              }}
              exit={{ x: 1300 }}>
              <Settings roomID={roomID} roomSettings={roomSettings} isAdmin={isAdmin} newAlert={newAlert} />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  );
};

export default Room;