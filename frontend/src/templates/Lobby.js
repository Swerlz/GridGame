import React, { useEffect, useState } from 'react';
import Room from './Room';
import socket from '../socket';
import { v4 as uuidv4 } from 'uuid';

const Lobby = ({ player, mainRoomUpdate, room }) => {
    const [isCreatingRoom, setIsCreatingRoom] = useState(false);
    const [roomName, setRoomName] = useState('');
    const [rooms, setRooms] = useState([]);
    const [currentRoom, setCurrentRoom] = useState(room);

    useEffect(() => {
        socket.on('lobbyUpdate', (updatedRooms) => {
            setRooms(updatedRooms);
        });


        return () => {
            socket.off('lobbyUpdate');
        };
    }, []);

    useEffect(() => {
        socket.emit('getRooms');
    }, []);

    useEffect(() => {
        socket.on('roomUpdated', (targetRoom) => {
            setCurrentRoom(targetRoom);
        });

        socket.on('startGame', (gameRoom) => {
            mainRoomUpdate(gameRoom);
        });

        return () => {
            socket.off('roomUpdated');
            socket.off('startGame');
        };
    // eslint-disable-next-line
    }, [currentRoom]);

    const createRoom = (e) => {
        e.preventDefault();

        if (roomName === '') return;

        const newRoom = {
            id:         uuidv4(),
            name:       roomName,
            turn:       {name: player.name, id: player.id},
            admin:      {name: player.name, id: player.id},
            players:    [player],
            blocks:     [],
            winner:     null,
            status:     'inLobby',
            settings:   {}
        };

        setIsCreatingRoom(false);

        socket.emit('createRoom', newRoom);
    };

    const joinRoom = (id) => {
        const targetRoom = rooms.find((room) => room.id === id);

        if (targetRoom) {
            socket.emit('joinRoom', targetRoom.id, player);
        }
    };

    const leaveRoom = () => {
        socket.emit('leaveRoom', currentRoom, player.id);
    };

    const startGame = (newSettings) => {
        const newRoom = {...currentRoom, settings: {...currentRoom.settings, ...newSettings}};

        socket.emit('startGame', newRoom);
    };

    return (
        <>
            {currentRoom === null ? (
                <div>
                    <h2>Available Rooms</h2>
                    <ul>
                        {rooms.map((room) => (
                            <li key={room.id} data-id={room.id}>
                                {room.name} <button onClick={() => joinRoom(room.id)}>Join</button>
                            </li>
                        ))}
                    </ul>

                    {isCreatingRoom ? (
                        <form onSubmit={(e) => { createRoom(e) }}>
                            <input
                                type="text"
                                value={roomName}
                                onChange={(e) => setRoomName(e.target.value)}
                                placeholder="Enter room name"
                            />
                            <button type="submit">Create Room</button>
                        </form>
                    ) : (
                        <button onClick={() => setIsCreatingRoom(true)}>Create a Room</button>
                    )}
                </div>
            ) : (
                <Room room={currentRoom} theplayer={player} leaveRoom={leaveRoom} startGame={startGame}/>
            )}
        </>
    );
};

export default Lobby;
