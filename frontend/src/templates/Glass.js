import React from 'react';
import '../css/glass.scss';

const Glass = ({ children }) => {
  return (
    <div className='glass-box'>
      {children}
    </div>
  );
}

export default Glass;
