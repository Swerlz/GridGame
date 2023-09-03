import React, { useState, useEffect } from 'react';

const GridBackground = React.memo(({ gridData }) => {
    const [randomNumbers, setRandomNumbers] = useState([]);

    useEffect(() => {
        if (randomNumbers.length === 0 && gridData) {
            const newRandomNumbers = Array.from({ length: gridData.length }, () =>
                Array.from({ length: gridData[0].length }, () => Math.floor(Math.random() * 10) + 1)
            );
            setRandomNumbers(newRandomNumbers);
        }
    }, [gridData]);

    return (
        <>
            {randomNumbers.length > 0 && gridData && (
                <div className="bg-grid">
                    {gridData.map((row, rowIndex) => (
                        <div key={rowIndex} data-key={rowIndex} className={`row ${rowIndex % 2 !== 0 ? 'block-row' : 'square-row'}`} data-row={rowIndex}>
                            {row.map((cell, colIndex) => {
                                let classNames = `bg-cell ${cell}`;

                                if (rowIndex % 2 === 1) {
                                    if (colIndex % 2 === 0) {
                                        classNames += ' bg-block';
                                    } else {
                                        classNames += ' bg-block-mid';
                                    }
                                } else {
                                    if (colIndex % 2 !== 0) {
                                        classNames += ' bg-block-vert';
                                    } else {
                                        classNames += ' bg-square';
                                        const randomNumber = randomNumbers[rowIndex][colIndex];

                                        classNames += ` tile-${randomNumber}`;
                                    }
                                }

                                return (
                                    <div
                                        key={`${rowIndex}-${colIndex}`}
                                        className={classNames}
                                    ></div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
        </>
    )
});

export default GridBackground;
