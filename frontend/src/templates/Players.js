import React from 'react';

const Game = ({ room }) => {

  const eachPlayer = () => {
    const size = 25;

    return room.players.map((player, index) => {
        const translateX = player.row * size + 'px';
        const translateY = player.col * size + 'px';

        return (
            <>
              <div key={`finish${index + 1}`} className={`finish${index + 1}`}></div>
              <div
                  key={index}
                  data-playerid={player.id}
                  data-row={player.row}
                  data-col={player.col}
                  className={`player player${index + 1}`}
                  style={{
                      transform: `translate(${translateY}, ${translateX})`,
                  }}
              ></div>
            </>
        );
    });
  };

  return <div className="game-players">{eachPlayer()}</div>;
};

export default Game;
