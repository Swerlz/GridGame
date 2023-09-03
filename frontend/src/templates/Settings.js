import React, { useState, useEffect } from 'react';
import socket from '../socket';

const Settings = ({ roomID, roomSettings, isAdmin, newAlert }) => {
    const [settings, setSettings] = useState(roomSettings);

    useEffect(() => {
        socket.on('settingsUpdate', (updatedSettings) => {
            setSettings(updatedSettings.settings);
            newAlert('Settings updated!', 'success');
        });

        return () => {
            socket.off('settingsUpdate');
        };
    }, [settings]);

    const gridOptions = [13, 17, 21, 25];

    if (!roomSettings || roomSettings.length === 0) {
        return <div>Loading...</div>;
    }

    const saveSettings = () => {
        const newSettings = {...settings, defaultSettings: false};
        socket.emit('updateSettings', roomID, newSettings);
    }

    return (
        <>
            <div className=''>
                <div className='glass-box'>
                    <div className='settings'>
                        <div>
                            <h5 className='setting-line'>Grid Size</h5>
                            <span className='inline-flex'>
                                {gridOptions.map((option) => (
                                    <p
                                        key={option}
                                        onClick={isAdmin ? (prev) => setSettings({ ...settings, gridSize: option }) : null}
                                        className={`grid-select ${settings.gridSize === option ? 'grid-select-active' : 'grid-select-inactive'}`}
                                        >
                                        {option}
                                    </p>
                                ))}
                            </span>
                        </div>

                        <div>
                            <h5 className='setting-line'>Wall Jump</h5>
                            <input type='checkbox'
                                id="jump"
                                name="jump"
                                checked={settings.wallJump}
                                onChange={isAdmin ? () => setSettings({ ...settings, wallJump: !settings.wallJump }) : undefined}
                            />
                        </div>

                        {settings.wallJump && (
                            <div>
                                <h5 className='setting-line'>Wall Jump Delay</h5>
                                <input
                                    type="number"
                                    value={settings.wallJumpDelay}
                                    onChange={isAdmin ? (e) => setSettings({ ...settings, wallJumpDelay: parseInt(e.target.value, 10) }) : undefined}
                                />
                            </div>
                        )}

                        <div>
                            <h5 className='setting-line'>Double Jump</h5>
                            <input type='checkbox'
                                id="jump"
                                name="jump"
                                checked={settings.doubleJump}
                                onChange={isAdmin ? () => setSettings({ ...settings, doubleJump: !settings.doubleJump }) : undefined}
                            />
                        </div>

                        {settings.doubleJump && (
                            <div>
                                <h5 className='setting-line'>Double Jump Delay</h5>
                                <input
                                    type="number"
                                    value={settings.doubleJumpDelay}
                                    onChange={isAdmin ? (e) => setSettings({ ...settings, doubleJumpDelay: parseInt(e.target.value, 10) }) : undefined}
                                />
                            </div>
                        )}

                        <div>
                            <h5 className='setting-line'>Move Diagonal</h5>
                            <input type='checkbox'
                                id="jump"
                                name="jump"
                                checked={settings.moveDiagonal}
                                onChange={isAdmin ? () => setSettings({ ...settings, moveDiagonal: !settings.moveDiagonal }) : undefined}
                            />
                        </div>

                        {settings.moveDiagonal && (
                            <div>
                                <h5 className='setting-line'>Move Diagonal delay</h5>
                                <input
                                    type="number"
                                    value={settings.moveDiagonalDelay}
                                    onChange={isAdmin ? (e) => setSettings({ ...settings, moveDiagonalDelay: parseInt(e.target.value, 10) }) : undefined}
                                />
                            </div>
                        )}

                        <div>
                            <h5 className='setting-line'>Random Start Position</h5>
                            <input type='checkbox'
                                id="jump"
                                name="jump"
                                checked={settings.randomStart}
                                onChange={isAdmin ? () => setSettings({ ...settings, randomStart: !settings.randomStart }) : undefined}
                            />
                        </div>

                        <div>
                            <h5 className='setting-line'>Max. Wall Blocks</h5>
                            <input
                                type="number"
                                value={settings.maxBlocks}
                                onChange={isAdmin ? (e) => setSettings({ ...settings, maxBlocks: parseInt(e.target.value) }) : undefined}
                            />
                        </div>


                        <div>
                            <h5 className='setting-line'>Random Walls</h5>
                            <input
                                type="number"
                                value={settings.randomBlocks}
                                onChange={isAdmin ? (e) => setSettings({ ...settings, randomBlocks: parseInt(e.target.value, 10) }) : undefined}
                            />
                        </div>

                        <div>
                            <h5 className='setting-line'>Random Player Blocks</h5>
                            <input
                                type="number"
                                value={settings.randomPlayerBlocks}
                                onChange={isAdmin ? (e) => setSettings({ ...settings, randomPlayerBlocks: parseInt(e.target.value, 10) }) : undefined}
                            />
                        </div>
                    </div>

                    {isAdmin && <button onClick={saveSettings} className='mt-1'>Save Settings</button>}
                </div>
            </div>
        </>
    );
};

export default Settings;