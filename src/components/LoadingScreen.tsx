import React, { useState, useEffect } from 'react';
import { Network, Database, Brain, Activity } from 'lucide-react';

interface LoadingScreenProps {
    onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
    const [progress, setProgress] = useState(0);
    const [loadingText, setLoadingText] = useState('Initializing core systems...');

    const stages = [
        { threshold: 0, text: 'Scanning memory stacks...' },
        { threshold: 30, text: 'Loading Knowledge Graph...' },
        { threshold: 60, text: 'Calibrating Data Structures...' },
        { threshold: 85, text: 'Finalizing Big-O Analysis...' },
        { threshold: 100, text: 'Neural Core Ready' },
    ];

    useEffect(() => {
        // Determine current text based on progress
        const currentStage = [...stages].reverse().find(stage => progress >= stage.threshold);
        if (currentStage && currentStage.text !== loadingText) {
            setLoadingText(currentStage.text);
        }

        if (progress < 100) {
            const timer = setTimeout(() => {
                // Random increment between 2 and 8
                const increment = Math.floor(Math.random() * 7) + 2;
                setProgress(prev => Math.min(prev + increment, 100));
            }, 150); // Adjust speed here
            return () => clearTimeout(timer);
        } else {
            // Hold at 100% for a brief moment before completing
            const completionTimer = setTimeout(() => {
                onComplete();
            }, 800);
            return () => clearTimeout(completionTimer);
        }
    }, [progress, onComplete]);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050b14] overflow-hidden selection:bg-transparent cursor-default font-sans">

            {/* Background Grid Pattern */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,1) 1px, transparent 1px)
          `,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Subtle radial glow in the center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] bg-blue-500/5 pointer-events-none" />

            {/* Top Left Header */}
            <div className="absolute top-8 left-8 flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="w-8 h-8 rounded bg-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.4)] overflow-hidden p-1">
                    <img src="/neon-struct-fav.png" alt="Logo" className="w-full h-full object-contain filter invert bright-0" />
                </div>
                <span className="text-white font-bold tracking-[0.2em] text-lg">NEONSTRUCT</span>
            </div>

            {/* Top Right Header */}
            <div className="absolute top-8 right-8 animate-fade-in-up hidden md:block" style={{ animationDelay: '0.2s' }}>
                <span className="text-cyan-500/60 font-mono text-xs tracking-widest uppercase">
                    NEURAL LEARNING PROTOCOL V2.0.0
                </span>
            </div>

            {/* Main Content Container */}
            <div className="relative flex flex-col items-center justify-center w-full max-w-[700px] px-6">

                {/* Central Icon */}
                <div className="relative mb-12 animate-fade-in-up flex items-center justify-center" style={{ animationDelay: '0.3s' }}>
                    <img
                        src="/neon-struct-fav.png"
                        alt="System Core"
                        className="w-48 h-48 object-contain drop-shadow-[0_0_20px_rgba(34,211,238,0.3)] animate-float"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                        }}
                    />
                    <Network size={64} className="text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)] hidden fallback-icon animate-pulse" />
                </div>

                {/* Title & Subtitle */}
                <div className="text-center w-full mb-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                    <h1 className="text-white text-2xl md:text-3xl lg:text-4xl mb-3 tracking-[0.3em] md:tracking-[0.4em] font-light whitespace-nowrap overflow-hidden text-ellipsis">
                        N E O N S T R U C T
                    </h1>
                    <div className="text-cyan-400/80 text-xs md:text-sm tracking-[0.2em] uppercase">
                        INITIALIZING NEURAL CORE...
                    </div>
                </div>

                {/* Progress Box Container */}
                <div className="w-full max-w-xl bg-[#0a1526]/60 border border-slate-800/80 rounded-xl p-6 backdrop-blur-md shadow-2xl relative overflow-hidden animate-fade-in-up mx-auto" style={{ animationDelay: '0.5s' }}>

                    {/* Top subtle highlight */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

                    {/* Info row */}
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <div className="flex items-center gap-2 text-white font-medium text-xs md:text-sm mb-1 tracking-wider">
                                <img src="/neon-struct-fav.png" alt="" className="w-4 h-4 object-contain animate-pulse filter invert bright-0" />
                                OPTIMIZING SEARCH ALGORITHMS
                            </div>
                            <div className="text-cyan-500/60 text-xs tracking-wide font-mono">
                                {loadingText}
                            </div>
                        </div>
                        <div className="text-white font-mono font-bold text-xl drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                            {progress}%
                        </div>
                    </div>

                    {/* Progress Bar Track */}
                    <div className="h-3 w-full bg-[#050b14] rounded-full overflow-hidden border border-slate-800/50 relative shadow-inner mb-6">
                        {/* Fill */}
                        <div
                            className="h-full bg-gradient-to-r from-cyan-400 via-blue-400 to-pink-500 rounded-full relative transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        >
                            {/* Shine effect on fill */}
                            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full" />
                            {/* Glowing tip */}
                            <div className="absolute top-0 bottom-0 right-0 w-4 bg-white/40 blur-[2px] rounded-full" />
                        </div>
                    </div>

                    {/* Bottom Module Indicators */}
                    <div className="flex justify-center gap-6 mt-2">
                        {[
                            { label: 'KNOWLEDGE GRAPH', active: progress > 30 },
                            { label: 'DATA STRUCTURES', active: progress > 60 },
                            { label: 'BIG-O ANALYSIS', active: progress > 85 }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${item.active ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-slate-700'}`} />
                                <span className={`text-[10px] tracking-widest ${item.active ? 'text-slate-300' : 'text-slate-500'}`}>
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>

                </div>

                {/* Bottom floating text */}
                <div className="mt-8 text-cyan-500/80 text-sm italic font-medium animate-pulse">
                    {loadingText}
                </div>

                {/* Loading dots */}
                <div className="flex gap-2 mt-4">
                    <div className="w-8 h-1 bg-cyan-500/80 rounded animate-pulse" style={{ animationDelay: '0s' }} />
                    <div className="w-8 h-1 bg-cyan-500/40 rounded animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="w-8 h-1 bg-cyan-500/20 rounded animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
            </div >

            {/* Footer Meta Info */}
            < div className="absolute bottom-8 left-8 flex gap-6 text-[10px] tracking-widest text-emerald-500/80 uppercase font-mono animate-fade-in-up" style={{ animationDelay: '0.6s' }
            }>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    SERVER: TOKYO-01
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: '1s' }} />
                    LATENCY: 24MS
                </div>
            </div >

            <div className="absolute bottom-8 right-8 text-[10px] tracking-widest text-slate-500 uppercase font-mono animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                V2.0.0 AI EDUCATION BUILD © 2024
            </div>

        </div >
    );
}
