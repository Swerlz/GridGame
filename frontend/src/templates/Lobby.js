import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import socket from '../socket';
import { v4 as uuidv4 } from 'uuid';

const Lobby = ({ player, newAlert }) => {
    const [isLeavingLobby, setIsLeavingLobby] = useState(false);
    const [roomName, setRoomName] = useState('');
    const [rooms, setRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const timeoutIdRef = useRef(null);

    useEffect(() => {
        socket.on('lobbyUpdate', (updatedRooms) => {
            setRooms(updatedRooms);
        });

        return () => {
            socket.off('lobbyUpdate');
        };
    }, []);

    useEffect(() => {
        socket.emit('updateLobby');
    }, []);

    const createRoom = (newName) => {
        if (newName === '') return;

        const newRoom = {
            id: uuidv4(),
            name: newName,
            turn: { player },
            admin: { name: player.name, id: player.id },
            players: [player],
            blocks: [],
            winner: null,
            status: 'inRoom',
            settings: {
                defaultSettings: true,
                gridSize: 17,
                wallJump: false,
                wallJumpDelay: 2,
                moveDiagonal: false,
                moveDiagonalDelay: 0,
                doubleJump: false,
                doubleJumpDelay: 3,
                randomStart: false,
                maxBlocks: 6,
                randomBlocks: 1,
                randomPlayerBlocks: 2,
            }
        };

        socket.emit('createRoom', newRoom);
    };

    const joinRoom = (id) => {
        const targetRoom = rooms.find((room) => room.id === id);

        socket.emit('joinRoom', id, player);
    };

    const updateLobby = () => {
        socket.emit('updateLobby');
        setTimeout(() => {
            newAlert('Lobby updated.', 'success');
        }, 400);
    }

    const changeName = (newName) => {
        setRoomName(newName);

        if (timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current);
        }

        setIsLoading(false);

        if (newName.length > 0) {
            timeoutIdRef.current = setTimeout(() => {
                setIsLoading(true);

                const newTimeoutId = setTimeout(() => {
                    setIsLeavingLobby(true);
                    setTimeout(() => {
                        createRoom(newName);
                        setIsLoading(false);
                    }, 300);
                }, 2800);

                timeoutIdRef.current = newTimeoutId;
            }, 300);
        }
    };

    return (
        <>
            <AnimatePresence>
                {!isLeavingLobby && (
                    <motion.div
                        className='area new-room'
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
                            <p className='text-center'>Create a room...</p>
                            <input
                                type="text"
                                value={roomName}
                                onChange={(e) => changeName(e.target.value)}
                                placeholder="Enter room name"
                                autoComplete='off'
                            />
                        </div>
                        {isLoading && (
                            <motion.div
                                className="loading-bar"
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 2.5, type: "tween" }} // Adjust duration as needed
                            ></motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {!isLeavingLobby && (
                    <motion.div
                        className='area lobby'
                        key='lobby'
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
                        <div className='glass-box'>
                            <div className='text-center mb-3'>
                                <button onClick={updateLobby}>Refresh</button>
                            </div>

                            {rooms.length === 0 ? (
                                <h1 className='text-center'>No Rooms Available</h1>
                            ) : null}

                            <ul>
                                {rooms.map((room) => (
                                    <li
                                        key={room.id}
                                        data-id={room.id}
                                        onClick={room.players.length < 4 ? () => joinRoom(room.id) : null}
                                        className={room.players.length < 4 ? 'join-room' : 'room-full'}
                                    >
                                        <span>{room.name}</span>
                                        <span>{room.status === 'inRoom' ? room.players.length == 4 ? 'Room Full' : 'Waiting' : 'In Game'}</span>
                                        <span>{room.players.length}/4</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Lobby;
