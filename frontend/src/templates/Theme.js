import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const Theme = (({ updateTheme }) => {
    const themes = [
        { theme: 'theme-grid', light: 'rgb(29, 215, 45)', dark: 'rgb(3, 53, 7)' },
        { theme: 'theme-sand', light: 'rgb(148, 99, 60)', dark: 'rgb(245, 203, 149)' },
        { theme: 'theme-ice', light: 'rgb(15, 86, 125)', dark: 'rgb(195, 234, 255)' },
        { theme: 'theme-fire', light: 'rgb(51 6 1)', dark: 'rgb(255 122 93)' },
        { theme: 'theme-marble', light: 'rgb(84, 80, 69)', dark: 'rgb(217, 217, 217)' },
    ];
    const [theme, setTheme] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const refColor = useRef(null);

    useEffect(() => {
        const cookieTheme = localStorage.getItem('theme');
        let currentTheme = cookieTheme ? getTheme(cookieTheme) : themes[0];

        document.querySelector('body').classList.add(currentTheme.theme);
        document.documentElement.style.setProperty('--color-light', currentTheme.light);
        document.documentElement.style.setProperty('--color-dark', currentTheme.dark);

        setTheme(currentTheme.theme);
        setSelectedColor(currentTheme.light);
        updateTheme(currentTheme.theme.split('-')[1]);
    }, []);

    const getTheme = (themeName) => {
        const theme = themes.find(theme => theme.theme === themeName);
        return theme;
    };

    const themeChange = (newTheme) => {

        const bodyElement = document.querySelector('body');
        const jsTheme = document.querySelector('.js-theme');
        const foundTheme = getTheme(newTheme);
        const nTheme = newTheme.split('-')[1];

        if (jsTheme) {
            const currTheme = jsTheme.getAttribute('data-theme');

            jsTheme.classList.remove(`game-bg-${currTheme}`);
            jsTheme.classList.add(`game-bg-${nTheme}`);
            jsTheme.setAttribute('data-theme', nTheme);
        }

        bodyElement.classList.remove(theme);
        bodyElement.classList.add(newTheme);

        document.documentElement.style.setProperty('--color-light', foundTheme.light);
        document.documentElement.style.setProperty('--color-dark', foundTheme.dark);

        localStorage.setItem('theme', newTheme);

        setTheme(newTheme);
        setSelectedColor(foundTheme.light);
        updateTheme(nTheme);
    }

    const themeColor = (e) => {
        setSelectedColor(e.target.value);
        document.documentElement.style.setProperty('--color-light', e.target.value);
    }

    const initial = { opacity: 0, x: -400, scale: 0.4 };
    const animate = [
        { opacity: 1, x: 0, scale: 0.6, transition: { type: 'spring', stiffness: 200, damping: 20 } },
        {
            scale: 1,
            transition: { delay: 0.5, type: 'spring', stiffness: 200, damping: 20 },
        },
    ];

    return (
        <>
            <motion.div className='area logo'
                initial={initial}
                animate={animate}
            >
                <h1 className='logo-title'>Griddi
                    <span className='anim-rotate' onClick={() => refColor.current.click()}>O</span>
                    <input
                        type='color'
                        className='color-select'
                        ref={refColor}
                        value={selectedColor}
                        onChange={themeColor}
                    />
                </h1>
            </motion.div>

            <motion.div className='area themes'
                initial={{ x: -400 }}
                animate={{ x: 0, transition: { delay: 0.6, ease: 'linear', duration: .3 } }}
            >
                <div className='glass-box theme-box'>
                    {themes.map((v, index) => (
                        <motion.div
                            initial={{ opacity: 0, x: -400 }}
                            animate={{ opacity: 1, x: 0, transition: { delay: 0.6 + index * 0.2, ease: 'linear', duration: 0.3 } }}
                            key={v.theme}
                            onClick={theme !== v.theme ? () => themeChange(v.theme) : null}
                            className={`theme ${v.theme} ${theme === v.theme ? 'theme-active' : 'theme-inactive'}`} />
                    ))}
                </div>
            </motion.div>
        </>
    );
});

export default Theme;
