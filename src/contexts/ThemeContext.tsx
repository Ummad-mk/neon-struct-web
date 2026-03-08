import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
    theme: 'dark' | 'light';
    toggleTheme: () => void;
    animationSpeed: number;
    setAnimationSpeed: (s: number) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'dark',
    toggleTheme: () => { },
    animationSpeed: 1,
    setAnimationSpeed: () => { },
});

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        return (localStorage.getItem('ns-theme') as 'dark' | 'light') || 'dark';
    });
    const [animationSpeed, setAnimationSpeedState] = useState<number>(() => {
        return parseFloat(localStorage.getItem('ns-speed') || '1');
    });

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'light') {
            root.classList.add('light');
            root.classList.remove('dark');
        } else {
            root.classList.add('dark');
            root.classList.remove('light');
        }
        localStorage.setItem('ns-theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

    const setAnimationSpeed = (s: number) => {
        setAnimationSpeedState(s);
        localStorage.setItem('ns-speed', String(s));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, animationSpeed, setAnimationSpeed }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
