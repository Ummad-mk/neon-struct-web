import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Info, Search, Plus, Trash2 } from 'lucide-react';

interface Props {
    data: any;
    operation?: string | null;
    minimapMeta?: any;
    onInsert?: (val: number) => Promise<any>;
    onSearch?: (val: number) => Promise<any>;
    onDelete?: (val: number) => Promise<any>;
    onSetHashMode?: (mode: 'linear' | 'quadratic' | 'double') => Promise<any>;
    onAddRandom?: () => Promise<any>;
    onClear?: () => void;
    isAnimating?: boolean;
}

export function HashTableViz({ data, onInsert, onSearch, onDelete, onSetHashMode, onAddRandom, onClear, isAnimating }: Props) {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const [inputValue, setInputValue] = useState('');

    // Extract metadata directly from the data state reported by backend
    const {
        buckets = Array(7).fill([]),
        size = 7,
        count = 0,
        load_factor = 0,
        memory_map = [],
        probing_mode = 'linear',
        collision_strategy = 'Linear Probing',
        hash_formula = 'h(k, i) = (k + i) mod m'
    } = data || {};

    // Step-level metadata sent down via `state` from Python `to_dict()` logic we mapped
    // Since we injected state directly via add_step, we check current operation zone
    const activeZone = data?.active_zone || 'bucket';
    const targetBucket = data?.target_bucket;
    const highlightBucket = data?.highlight_bucket;
    const currentKey = data?.current_key;
    const foundChainIndex = data?.found_chain_index;
    const visitedChainIndices = data?.visited_chain_indices || [];
    const isZone1Active = activeZone === 'input';
    const isZone2Active = activeZone === 'funnel';
    const isZone3Active = activeZone === 'bucket';
    const hasActiveKey = currentKey !== undefined && currentKey !== null;

    // Theme Colors
    const panelBg = isLight ? 'bg-white' : 'bg-[#1e293b]';
    const borderCol = isLight ? 'border-[#e2e8f0]' : 'border-[#334155]';
    const textPrimary = isLight ? 'text-[#0f172a]' : 'text-gray-100';
    const textMuted = isLight ? 'text-[#64748b]' : 'text-[#94a3b8]';
    const highlightZoneCol = isLight ? 'ring-cyan-400' : 'ring-[#f97316]'; // Match mockup orange border on active

    const loadFactorDisplay = load_factor.toFixed(1);
    const loadPercentage = Math.min(100, (load_factor / 1.0) * 100);
    const probingMode = ['linear', 'quadratic', 'double'].includes(probing_mode) ? probing_mode : 'linear';
    const formulaDisplay = data?.funnel_math || hash_formula;
    const modeButtons: Array<{ key: 'linear' | 'quadratic' | 'double'; label: string }> = [
        { key: 'linear', label: 'Linear' },
        { key: 'quadratic', label: 'Quadratic' },
        { key: 'double', label: 'Double' }
    ];
    const runAction = (action?: (val: number) => Promise<any>) => {
        const val = parseInt(inputValue);
        if (isNaN(val)) return;
        action?.(val);
        setInputValue('');
    };

    return (
        <div className="w-[1200px] min-h-[800px] flex flex-col overflow-visible bg-[#f8fafc] dark:bg-[#0f172a] p-6 font-sans">

            {/* Header section (Dynamic Hash Table title, Load factor bar) */}
            <div className={`w-full ${panelBg} border ${borderCol} rounded-2xl p-6 mb-6 flex items-center justify-between`}>
                <div>
                    <h1 className={`text-2xl font-bold ${textPrimary}`}>
                        Dynamic Hash Table: <span className="text-[#f97316]">Integer Mapping</span>
                    </h1>
                    <p className={`text-sm italic ${textMuted} mt-1`}>Educational Suite v2.4 - Module: Hashing Algorithms</p>
                </div>
                <div className="flex flex-col items-end gap-2 w-[360px]">
                    <div className="w-full flex items-center justify-end gap-1.5">
                        {modeButtons.map(btn => (
                            <button
                                key={btn.key}
                                disabled={isAnimating}
                                onClick={() => onSetHashMode?.(btn.key)}
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-colors ${probingMode === btn.key
                                    ? 'text-cyan-300 border-cyan-500/60 bg-cyan-500/15'
                                    : isLight ? 'text-gray-600 border-gray-300 bg-white hover:bg-gray-50' : 'text-gray-400 border-gray-600 bg-gray-800/40 hover:bg-gray-700/40'
                                    } ${isAnimating ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                    <div className="w-full flex justify-between text-xs font-bold tracking-widest uppercase">
                        <span className={textMuted}>Load Factor</span>
                        <span className="text-green-500">{loadFactorDisplay} / 1.0</span>
                    </div>
                    <div className={`w-full h-2 rounded-full ${isLight ? 'bg-gray-200' : 'bg-gray-800'} overflow-hidden`}>
                        <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${loadPercentage}%` }} />
                    </div>
                    <span className={`text-[9px] uppercase tracking-wider ${textMuted}`}>Optimal Capacity Range</span>
                </div>
            </div>

            {/* Middle Dashboard 3 Zones */}
            <div className="flex w-full gap-4 h-[400px] mb-4">

                {/* ZONE 1: KEY INPUT */}
                <div className={`basis-[22%] shrink-0 ${panelBg} border ${borderCol} rounded-2xl p-4 flex flex-col relative transition-all duration-300 ${isZone1Active ? `ring-2 ${highlightZoneCol} shadow-[0_0_40px_rgba(249,115,22,0.2)]` : ''
                    }`}>
                    <h2 className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${isZone1Active ? 'text-[#f97316]' : textMuted}`}>
                        <span className="opacity-80">⇄</span> ZONE 1: KEY INPUT
                    </h2>

                    {/* Key Display Box */}
                    <div className={`h-24 flex items-center justify-center rounded-xl border transition-all duration-500 ${isLight ? 'bg-orange-50/50 border-orange-200' : 'bg-[#f97316]/5 border-[#f97316]/20'} ${isZone1Active ? 'scale-[1.02]' : ''}`}>
                        <span className={`font-black transition-all duration-500 ${hasActiveKey
                            ? `${isZone1Active ? 'text-[#f97316] animate-pulse drop-shadow-[0_0_18px_rgba(249,115,22,0.7)]' : 'text-[#f97316]'} text-6xl`
                            : `${isLight ? 'text-gray-300' : 'text-gray-500'} text-4xl`
                            }`}>
                            {hasActiveKey ? currentKey : '--'}
                        </span>
                    </div>

                    {/* Input Field */}
                    <input
                        type="number"
                        placeholder="Enter key"
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && runAction(onInsert)}
                        disabled={isAnimating}
                        className={`mt-3 w-full px-3 py-2 rounded-lg text-sm font-mono font-bold text-center border focus:outline-none transition-colors ${isLight 
                            ? 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-cyan-400' 
                            : 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-cyan-500'
                        } ${isAnimating ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />

                    {/* Plain English Breakdown */}
                    <div className={`mt-3 p-3 rounded-xl text-sm border flex items-start gap-3 ${isLight ? 'bg-cyan-50 border-cyan-200' : 'bg-[rgba(6,182,212,0.08)] border-cyan-500/30'}`}>
                        <Info size={16} className="text-cyan-500 shrink-0 mt-0.5" />
                        <div className={isLight ? 'text-gray-700 font-mono' : 'text-cyan-100 font-mono'}>
                            {hasActiveKey ? (
                                <>
                                    Key <span className="text-[#f97316] font-bold">{currentKey}</span> using {collision_strategy} <br />
                                    → Probe Target: <span className="text-cyan-400 font-bold">{targetBucket ?? '?'}</span>
                                </>
                            ) : (
                                <span className="opacity-80">Awaiting input key...</span>
                            )}
                        </div>
                    </div>

                    {/* Algorithm Meta Section */}
                    <div className={`mt-2 p-3 rounded-lg text-[10px] font-mono ${isLight ? 'bg-gray-50 border border-gray-200' : 'bg-[#0f172a]/50 border border-gray-700'}`}>
                        <div className="mb-2">
                            <span className={textMuted}>Hash Function:</span> <span className={textPrimary}>{hash_formula}</span>
                        </div>
                        <div className="mb-2">
                            <span className={textMuted}>Collision Strategy:</span> <span className={textPrimary}>{collision_strategy}</span>
                        </div>
                        <div>
                            <span className={textMuted}>Table Size (m):</span> <span className={textPrimary}>{size}</span>
                        </div>
                    </div>
                </div>

                {/* ZONE 2: HASHING CORE FUNNEL */}
                <div className={`basis-[46%] shrink-0 ${panelBg} border ${borderCol} rounded-2xl p-5 flex flex-col relative transition-all duration-300 ${isZone2Active ? `ring-2 ring-cyan-500/50 shadow-[0_0_35px_rgba(6,182,212,0.2)]` : ''
                    }`}>
                    <h2 className={`text-xs font-bold uppercase tracking-widest mb-4 text-center ${isZone2Active ? 'text-cyan-400' : textMuted}`}>
                        ZONE 2: HASHING CORE FUNNEL
                    </h2>

                    {/* Dotted Grid Background */}
                    <div className="absolute inset-0 m-12 pointer-events-none opacity-20"
                        style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                    <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                        {/* SVG Funnel Shape with Key Animation */}
                        <div className="relative w-64 h-56 flex flex-col items-center">
                            {/* Input Arrow from Zone 1 */}
                            {isZone1Active && hasActiveKey && (
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce">
                                    <div className="w-12 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                        {currentKey}
                                    </div>
                                    <div className="w-0 h-4 border-l-2 border-orange-500 border-dashed"></div>
                                </div>
                            )}

                            <svg width="100%" height="100%" viewBox="0 0 200 200" className="absolute top-0 left-0" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="funnelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor={isLight ? '#94a3b8' : '#475569'} />
                                        <stop offset="100%" stopColor={isLight ? '#64748b' : '#1e293b'} />
                                    </linearGradient>
                                </defs>
                                <polygon points="10,0 190,0 120,120 120,200 80,200 80,120"
                                    fill="url(#funnelGradient)"
                                    className={`transition-all duration-300 ${isZone2Active ? 'opacity-90' : 'opacity-50'}`} />
                                {/* Funnel rim highlight */}
                                <line x1="10" y1="0" x2="190" y2="0" stroke={isLight ? '#cbd5e1' : '#64748b'} strokeWidth="3" className="opacity-60" />
                            </svg>

                            {/* Formula Block inside Funnel */}
                            <div className={`absolute top-16 px-6 py-2 rounded-lg font-mono font-bold text-2xl tracking-widest border transition-all duration-500 ${isZone2Active
                                ? 'bg-[#0f172a] border-cyan-500 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] animate-pulse'
                                : isLight ? 'bg-gray-100 border-gray-300 text-gray-500' : 'bg-gray-800 border-gray-600 text-gray-400'
                                }`}>
                                {currentKey !== null && currentKey !== undefined ? formulaDisplay : '?'}
                            </div>

                            {/* Output Result Pill */}
                            <div className={`absolute bottom-6 w-14 h-14 rounded-full flex items-center justify-center font-bold text-2xl border-4 transition-all duration-500 ${isZone2Active && targetBucket !== null
                                ? 'bg-cyan-500 border-cyan-200 text-white shadow-[0_0_30px_rgba(6,182,212,0.8)] animate-bounce'
                                : isLight ? 'bg-gray-200 border-gray-300 text-gray-400' : 'bg-gray-700 border-gray-600 text-gray-500'
                                }`}>
                                {targetBucket !== undefined && targetBucket !== null ? targetBucket : '-'}
                            </div>

                            {isZone2Active && targetBucket !== null && (
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
                                    <div className="w-0 h-6 border-l-2 border-cyan-400 border-dashed"></div>
                                    <div className="text-cyan-400 animate-pulse text-xl">▼</div>
                                    <div className={`mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${isLight ? 'bg-cyan-100 text-cyan-700' : 'bg-cyan-500/20 text-cyan-400'}`}>
                                        Bucket {targetBucket}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <p className={`text-[10px] text-center uppercase tracking-widest px-10 leading-relaxed ${textMuted}`}>
                        The computation unit processes the input key through the modulo operator to determine its index in the array.
                    </p>
                </div>

                {/* ZONE 3: BUCKET ARRAY */}
                <div className={`basis-[28%] shrink-0 ${panelBg} border ${borderCol} rounded-2xl p-4 flex flex-col relative overflow-hidden transition-all duration-300 ${isZone3Active ? 'ring-2 ring-cyan-500/50 shadow-[0_0_35px_rgba(6,182,212,0.2)]' : ''
                    }`}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className={`text-xs font-bold uppercase tracking-widest ${isZone3Active ? 'text-cyan-400' : textMuted}`}>
                            ZONE 3: BUCKET ARRAY
                        </h2>
                        <div className="flex items-center gap-3 text-[9px] font-bold tracking-widest uppercase">
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Occupied</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-500" /> Empty</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                        {buckets.map((chain: number[], idx: number) => {
                            const isTargetRow = targetBucket === idx || highlightBucket === idx;

                            return (
                                <div key={idx} className="flex items-center gap-3">
                                    <span className={`text-xs font-mono font-bold w-4 text-center ${isTargetRow ? (isLight ? 'text-cyan-600' : 'text-cyan-400') : textMuted}`}>
                                        {idx}
                                    </span>
                                    <div className={`flex-1 flex gap-2 overflow-x-auto items-center p-2 rounded-lg border min-h-[44px] transition-all duration-300 ${isTargetRow
                                        ? isLight ? 'bg-cyan-50 border-cyan-300' : 'bg-cyan-500/10 border-cyan-500/40'
                                        : isLight ? 'border-gray-200' : 'border-gray-800'
                                        } ${isTargetRow ? 'shadow-[0_0_18px_rgba(6,182,212,0.18)]' : ''}`}>

                                        {chain.length === 0 ? (
                                            <span className={`w-2 h-2 rounded-full mx-2 ${isLight ? 'bg-gray-300' : 'bg-gray-700'}`} />
                                        ) : (
                                            chain.map((val, chainIdx) => {
                                                // Chaining visual logic
                                                const isVisited = isTargetRow && visitedChainIndices.includes(chainIdx);
                                                const isFound = isTargetRow && foundChainIndex === chainIdx;

                                                let pillStyles = isLight
                                                    ? 'bg-green-50 text-green-700 border-green-200'
                                                    : 'bg-green-500/10 text-green-400 border-green-500/30';
                                                let dotColor = 'bg-green-500';

                                                if (isFound) {
                                                    pillStyles = 'bg-orange-500 text-white border-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.5)]';
                                                    dotColor = 'bg-white';
                                                } else if (isTargetRow && val === currentKey) {
                                                    pillStyles = 'bg-orange-500/20 text-orange-400 border-orange-500/50';
                                                    dotColor = 'bg-orange-500';
                                                } else if (isVisited) {
                                                    pillStyles = 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50';
                                                    dotColor = 'bg-cyan-500';
                                                }

                                                return (
                                                    <React.Fragment key={`${idx}-${chainIdx}`}>
                                                        {chainIdx > 0 && <span className={isLight ? 'text-cyan-500' : 'text-cyan-800'}>→</span>}
                                                        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-md border text-xs font-mono font-bold transition-all ${pillStyles} ${isFound ? 'animate-pulse scale-105' : ''}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                                                            K:{val}
                                                        </div>
                                                    </React.Fragment>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className={`w-full ${panelBg} border ${borderCol} rounded-2xl px-5 py-3 mb-6`}>
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={() => runAction(onInsert)}
                        disabled={isAnimating || !inputValue}
                        className={`min-w-[110px] py-2 rounded-lg font-bold transition-colors flex justify-center gap-2 items-center text-sm border ${isAnimating || !inputValue
                            ? 'bg-gray-500/20 text-gray-500 border-gray-600 cursor-not-allowed opacity-50'
                            : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/20'
                            }`}
                    >
                        <Plus size={15} /> Insert
                    </button>
                    <button
                        onClick={() => runAction(onSearch)}
                        disabled={isAnimating || !inputValue}
                        className={`min-w-[110px] py-2 rounded-lg font-bold transition-colors flex justify-center gap-2 items-center text-sm border ${isAnimating || !inputValue
                            ? 'bg-gray-500/20 text-gray-500 border-gray-600 cursor-not-allowed opacity-50'
                            : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/20'
                            }`}
                    >
                        <Search size={15} /> Search
                    </button>
                    <button
                        onClick={onAddRandom}
                        disabled={isAnimating}
                        className={`min-w-[110px] py-2 rounded-lg font-bold transition-colors text-sm border ${isAnimating
                            ? 'bg-gray-500/20 text-gray-500 border-gray-600 cursor-not-allowed opacity-50'
                            : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/30'
                            }`}
                    >
                        Random
                    </button>
                    <button
                        onClick={onClear}
                        disabled={isAnimating}
                        className={`min-w-[110px] py-2 rounded-lg font-bold transition-colors text-sm border ${isAnimating
                            ? 'bg-gray-500/20 text-gray-500 border-gray-600 cursor-not-allowed opacity-50'
                            : 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
                            }`}
                    >
                        Clear
                    </button>
                    <button
                        onClick={() => runAction(onDelete)}
                        disabled={isAnimating || !inputValue}
                        className={`w-10 h-10 rounded-lg transition-colors border flex items-center justify-center ${isAnimating || !inputValue
                            ? 'bg-gray-500/20 text-gray-500 border-gray-600 cursor-not-allowed opacity-50'
                            : 'bg-red-500/10 text-red-300 border-red-500/40 hover:bg-red-500/20'
                            }`}
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>

            {/* Memory Map Table */}
            <div className={`w-full ${panelBg} border ${borderCol} rounded-2xl overflow-hidden flex flex-col`}>
                <div className={`px-6 py-4 border-b ${borderCol} flex items-center justify-between`}>
                    <h2 className={`font-bold flex items-center gap-2 ${textPrimary}`}>
                        <span className="text-[#f97316]">☰</span> Memory Map Table
                    </h2>
                    <div className="flex gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${borderCol} ${textMuted}`}>
                            Entries: <span className={textPrimary}>{count}</span>
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${borderCol} ${textMuted}`}>
                            Size: <span className={textPrimary}>{size}</span>
                        </span>
                    </div>
                </div>

                <div className="w-full">
                    <div className={`grid grid-cols-4 px-6 py-3 border-b ${borderCol} text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>
                        <div>Index</div>
                        <div>Key</div>
                        <div>Value (Hash)</div>
                        <div>Status</div>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        {memory_map.map((row: any, i: number) => {
                            const isHighlightRow = highlightBucket === i || targetBucket === i;
                            return (
                                <div key={i} className={`grid grid-cols-4 px-6 py-3.5 border-b last:border-0 ${borderCol} text-sm font-mono ${isHighlightRow
                                    ? isLight ? 'bg-cyan-50 text-cyan-800 font-bold' : 'bg-cyan-500/10 text-cyan-300 font-bold'
                                    : textMuted
                                    }`}>
                                    <div className={isHighlightRow ? 'text-cyan-500' : ''}>{row.index}</div>
                                    <div className={textPrimary}>{row.key}</div>
                                    <div>{row.value_hash}</div>
                                    <div>
                                        {row.status === 'Empty' ? (
                                            <span className="italic opacity-50">Empty</span>
                                        ) : row.status === 'Occupied' ? (
                                            <span className="text-green-500 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Occupied
                                            </span>
                                        ) : row.status === 'Deleted' ? (
                                            <span className="text-yellow-500 font-bold">Deleted</span>
                                        ) : row.status === 'Collision Chain' ? (
                                            <span className="text-[#f97316] font-bold animate-pulse">{row.status}</span>
                                        ) : (
                                            <span className="text-[#f97316] font-bold">{row.status}</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

        </div>
    );
}
