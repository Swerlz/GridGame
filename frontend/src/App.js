import React, { useEffect, useState } from 'react';
import Login from './templates/Login';
import Lobby from './templates/Lobby';
import Game from './templates/Game';

const App = () => {
  const [player, setPlayer] = useState([]);
  const [room, setRoom] = useState(null);

  const createPlayer = (player) => {
    player.length !== 0 && setPlayer(player);
  };

  const inGame = (newRoom) => {
    setRoom(newRoom);
  }

  return (
    <div className="App">
      {player.length === 0 ? (
        <>
          <h1>Enter Player Name</h1>
          <Login onSubmit={createPlayer} />
        </>
      ) : (

        room === null ?
        
        <>
          <h1>Hey, {player.name}</h1>
          <Lobby player={player} inGame={inGame}/>
        </>

        : 

        <>
          <h1>Playing as: {player.name}</h1>
          <Game player={player} initialRoom={room}/>
        </>

      )}
    </div>
  );
};

export default App;
