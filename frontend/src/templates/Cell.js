import React from 'react';

const Cell = React.memo(({ classNames, rowIndex, colIndex, mouseEv, hasBlock, handleEnter, handleLeave, placeBlock }) => (
  <div
    className={classNames}
    data-key={rowIndex + '-' + colIndex}
    data-row={rowIndex}
    data-col={colIndex}
    onMouseEnter={mouseEv && !hasBlock ? handleEnter : undefined}
    onMouseLeave={mouseEv && !hasBlock ? handleLeave : undefined}
    onClick={mouseEv && !hasBlock ? placeBlock : undefined}
  ></div>
));

export default Cell;
