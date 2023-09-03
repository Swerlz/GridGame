import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import socket from '../socket';

const Login = () => {
  const [tempName, setTempName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const timeoutIdRef = useRef(null);

  const changeName = (newName) => {
    setTempName(newName);

    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    
    setIsLoading(false);

    if (newName.length > 0) {
      timeoutIdRef.current = setTimeout(() => {
        setIsLoading(true);
        
        const newTimeoutId = setTimeout(() => {
          socket.emit('newPlayer', { name: newName });
          setIsLoading(false);
        }, 2800);
        
        timeoutIdRef.current = newTimeoutId;
      }, 300);
    }
  };

  return (
    <motion.div
      className="name"
      initial={{ x: -2000 }}
      animate={{
        x: 0,
        transition: {
          duration: 0.3,
          delay: 2,
          type: "spring",
          stiffness: 200,
          damping: 20,
        },
      }}
      exit={{
        y: -1000,
        transition: {
          duration: 1,
          type: "spring",
          stiffness: 200,
          damping: 20,
        },
      }}
    >
      <div className='glass-box'>
        <div className='login-form'>
          <input
            type="text"
            value={tempName}
            onChange={(e) => changeName(e.target.value)}
            placeholder="Enter player name"
          />
        </div>
      </div>
      {isLoading && (
        <motion.div
          className="loading-bar"
          initial={{ width: 0}}
          animate={{ width: "100%" }}
          transition={{ duration: 2.5, type: "tween" }} // Adjust duration as needed
        ></motion.div>
      )}
    </motion.div >
  );
};

export default Login;
