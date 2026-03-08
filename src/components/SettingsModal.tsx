import { X, Sun, Moon, Zap } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const SPEED_STEPS = [0.25, 0.5, 1, 2, 4, 6];

export function SettingsModal({ isOpen, onClose }: Props) {
    const { theme, toggleTheme, animationSpeed, setAnimationSpeed } = useTheme();

    if (!isOpen) return null;

    const speedIndex = SPEED_STEPS.indexOf(animationSpeed);
    const safeIndex = speedIndex === -1 ? 2 : speedIndex;

    return (
        <div
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-2xl border shadow-2xl animate-scale-up overflow-hidden
          dark:bg-[#0f172a] dark:border-gray-700 bg-white border-gray-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b dark:border-gray-800 border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg dark:bg-gray-800 bg-gray-100 dark:border-gray-700 border border-gray-200">
                            <Zap size={20} className="text-cyan-500" />
                        </div>
                        <h2 className="text-xl font-bold dark:text-white text-gray-900">Settings</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full transition-colors dark:hover:bg-white/10 hover:bg-gray-100 dark:text-gray-400 text-gray-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* --- Speed Controller --- */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h3 className="font-semibold dark:text-white text-gray-900">Animation Speed</h3>
                                <p className="text-xs dark:text-gray-400 text-gray-500 mt-0.5">Controls how fast visualizations play</p>
                            </div>
                            <span className="px-3 py-1 rounded-full font-bold text-sm bg-cyan-500/10 text-cyan-500 border border-cyan-500/30">
                                {animationSpeed}x
                            </span>
                        </div>

                        {/* Slider */}
                        <div className="relative">
                            <input
                                type="range"
                                min={0}
                                max={SPEED_STEPS.length - 1}
                                step={1}
                                value={safeIndex}
                                onChange={e => setAnimationSpeed(SPEED_STEPS[parseInt(e.target.value)])}
                                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-cyan-500
                  dark:bg-gray-700 bg-gray-200"
                            />
                            {/* Tick labels */}
                            <div className="flex justify-between mt-2 px-0.5">
                                {SPEED_STEPS.map(s => (
                                    <span
                                        key={s}
                                        className={`text-xs font-mono transition-colors ${animationSpeed === s
                                                ? 'text-cyan-500 font-bold'
                                                : 'dark:text-gray-500 text-gray-400'
                                            }`}
                                    >
                                        {s}x
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Speed presets */}
                        <div className="grid grid-cols-6 gap-1.5 mt-4">
                            {SPEED_STEPS.map(s => (
                                <button
                                    key={s}
                                    onClick={() => setAnimationSpeed(s)}
                                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${animationSpeed === s
                                            ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                                            : 'dark:bg-gray-800 bg-gray-100 dark:text-gray-400 text-gray-600 dark:hover:bg-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {s}x
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px dark:bg-gray-800 bg-gray-200" />

                    {/* --- Theme Toggle --- */}
                    <div>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold dark:text-white text-gray-900">Appearance</h3>
                                <p className="text-xs dark:text-gray-400 text-gray-500 mt-0.5">Switch between dark and light theme</p>
                            </div>

                            {/* Toggle pill */}
                            <button
                                onClick={toggleTheme}
                                className={`relative flex items-center w-16 h-8 rounded-full p-1 transition-all duration-300 ${theme === 'light' ? 'bg-amber-400' : 'bg-indigo-600'
                                    }`}
                            >
                                <span className={`absolute flex items-center justify-center w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${theme === 'light' ? 'left-8' : 'left-1'
                                    }`}>
                                    {theme === 'light'
                                        ? <Sun size={14} className="text-amber-500" />
                                        : <Moon size={14} className="text-indigo-600" />
                                    }
                                </span>
                            </button>
                        </div>

                        {/* Mode cards */}
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <button
                                onClick={() => theme === 'light' && toggleTheme()}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${theme === 'dark'
                                        ? 'border-cyan-500 bg-cyan-500/10'
                                        : 'dark:border-gray-700 border-gray-200 dark:bg-gray-800 bg-gray-50 opacity-60'
                                    }`}
                            >
                                <div className="w-10 h-8 rounded bg-[#0f172a] border border-gray-600 flex items-center justify-center">
                                    <Moon size={14} className="text-indigo-400" />
                                </div>
                                <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-cyan-500' : 'dark:text-gray-400 text-gray-500'}`}>
                                    Night Mode
                                </span>
                            </button>

                            <button
                                onClick={() => theme === 'dark' && toggleTheme()}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${theme === 'light'
                                        ? 'border-amber-400 bg-amber-50'
                                        : 'dark:border-gray-700 border-gray-200 dark:bg-gray-800 bg-gray-50 opacity-60'
                                    }`}
                            >
                                <div className="w-10 h-8 rounded bg-white border border-gray-300 flex items-center justify-center">
                                    <Sun size={14} className="text-amber-500" />
                                </div>
                                <span className={`text-xs font-semibold ${theme === 'light' ? 'text-amber-600' : 'dark:text-gray-400 text-gray-500'}`}>
                                    Light Mode
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
