import React from 'react';

const GameInfo = ({ currentPlayer }) => {
    return (
        <div className='all-stats'>
            <div className='stats'>
                <h2 className='stat-value'>Blocks left: {currentPlayer.blocks}</h2>
            </div>

            {currentPlayer.wallJumpDelay >= 0 && (
                <div className='stats'>
                    <h2 className='stat-title'>Jump Delay: {currentPlayer.wallJumpDelay}</h2>
                </div>
            )}

            {currentPlayer.doubleJumpDelay >= 0 && (
                <div className='stats'>
                    <h2 className='stat-value'>Double jump delay: {currentPlayer.doubleJumpDelay}</h2>
                </div>
            )}

            {currentPlayer.moveDiagonalDelay >= 0 && (
                <div className='stats'>
                    <h2 className='stat-value'>Diagonal delay: {currentPlayer.moveDiagonalDelay}</h2>
                </div>
            )}

        </div>
    );
};

export default GameInfo;
