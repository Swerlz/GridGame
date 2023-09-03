import React, { useEffect, useState } from 'react';
import GameInfo from './GameInfo';
import socket from '../socket';
import Grid from './Grid';
import { motion, AnimatePresence } from 'framer-motion';
import '../css/game.scss';

const Game = ({ playerID, roomID, curTheme, newAlert, setStatus }) => {
  const [room, setRoom] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [isLeavingGame, setIsLeavingGame] = useState(false);
  const [playerTurn, setPlayerTurn] = useState(false);

  useEffect(() => {
    socket.emit('getRoom', roomID);

    socket.on('roomUpdated', (updatedRoom) => {
      setPlayerTurn(false);
      const theRoom = updatedRoom.newRoom;

      setRoom(theRoom);

      if (theRoom.winner) {
        if (theRoom.winner.id === playerID) {
          newAlert('You have won!', 'success');
        } else {
          newAlert('You have lost! :(', 'danger');
        }
      } else {
        setCurrentPlayer(theRoom.players.find(p => p.id === playerID));

        if (theRoom.turn.id === playerID) {
          setPlayerTurn(true);
        }
      }
    });

    socket.on('fromGame', () => {
      setIsLeavingGame(true);

      setTimeout(() => {
        setStatus('inRoom');
        newAlert('Back to Room.', 'warning');
      }, 300);
    });

    return () => {
      socket.off('roomUpdated');
      socket.off('fromGame');
    };
    // eslint-disable-next-line
  }, []);

  const returnToRoom = () => {
    socket.emit('backToRoom', roomID);
  };

  const handlePlayerAction = (action, updatedPlayers, foundPlayer) => {
    socket.emit(action, room.id, updatedPlayers, foundPlayer);
  };

  return (
    <>
      {room && (
        <AnimatePresence>
          {!isLeavingGame && (
            <motion.div
              className='area game'
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
              exit={{ x: 1300 }}
            >
              <div className={`js-theme glass-box game-bg-${curTheme}`} data-theme='grid'>
                {playerTurn && ( <div className='game-turn'><h3>Your Turn.</h3></div>)}
                <Grid room={room} playerID={playerID} handlePlayerAction={handlePlayerAction} newAlert={newAlert} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {currentPlayer && (
        <AnimatePresence>
          {!isLeavingGame && (
            <motion.div
              className='area game-info self-top'
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
                <GameInfo currentPlayer={currentPlayer} />

                {room && room.admin.id === playerID && (
                  <div className='mt-2'>
                    <button data-id={room.id} onClick={returnToRoom}>Lobby</button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  );
};

export default Game;
