import React from 'react';

const Player = React.memo(({ playersData, playerID }) => {

  const eachPlayer = () => {
    const size = 25;

    return playersData.map((player, index) => {
      let rotation = '';
      let view = false;

      if (player.id === playerID) {
        view = true;
        rotation =  index === 1 ? 'rotate(180deg)' :
                    index === 2 ? 'rotate(-90deg)' :
                    index === 3 ? 'rotate(90deg)' : '';
      }
      const split = player.playerPos.split("-");
      const row = split[0];
      const col = split[1];
      const translateX = row * size + 'px';
      const translateY = col * size + 'px';

      return (
        <div key={index} 
        data-player-row={row} 
        data-player-col={col} 
        className={`player player-${index + 1}`}
        style={{
          transform: `translate(${translateY}, ${translateX})`,
        }}
        >
          <img
            src={`/images/players/player-${index + 1}.png`}
            className={`playerImg${view ? ` view-img-${index}` : ''}`}
            
          />
        </div>
      );
    });
  };

  return <div className="players">{eachPlayer()}</div>;
});

export default Player;
