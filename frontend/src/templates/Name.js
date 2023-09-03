import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Name = ({ player }) => {
    const [playerName, setPlayerName] = useState(player);

    return (
        <motion.div className='name-filled'
            initial={{ y: -100 }}
            animate={{ y: 0, transition: { duration: .8, delay: .5 } }}
        >
            <div className='glass-box'>
                <h2 className='player-name'>{playerName.name}</h2>
            </div>
        </motion.div>
    );
};

export default Name;
