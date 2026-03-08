import { Brain, Play, Compass, BookOpen, TrendingUp } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface DashboardProps {
  onStart: () => void;
}

export function Dashboard({ onStart }: DashboardProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className={`flex-1 flex flex-col overflow-y-auto ${isLight ? 'bg-[#f8faff]' : 'bg-[#050b14]'}`}>

      {/* Top Nav Bar */}
      <nav className={`flex items-center justify-between px-8 py-4 border-b ${isLight ? 'bg-white/80 border-gray-200 backdrop-blur-md' : 'bg-[#050b14]/80 border-gray-800/50 backdrop-blur-md'
        } sticky top-0 z-20`}>
        <div className="flex items-center gap-2">
          <img src="/neon-struct-fav.png" alt="Neon Struct Logo" className="w-6 h-6 object-contain" />
          <span className={`font-bold text-lg tracking-tight italic ${isLight ? 'text-gray-900' : 'text-white'}`}>
            NEONSTRUCT
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'Curriculum', 'Pricing'].map(item => (
            <a key={item} href="#" className={`text-sm font-medium transition-colors hover:text-cyan-500 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
              {item}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${isLight ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-300 hover:bg-gray-800'
            }`}>
            Log in
          </button>
          <button
            onClick={onStart}
            className="text-sm font-semibold px-4 py-2 rounded-lg bg-cyan-500 text-white hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/25"
          >
            Get Started Free
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-20 pb-10 relative">

        {/* Background Grid */}
        <div className={`absolute inset-0 pointer-events-none ${isLight
          ? 'bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem]'
          : 'bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem]'
          } opacity-40`} />

        <div className="text-center max-w-3xl z-10 animate-slide-up">
          {/* Status Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-10 border ${isLight
            ? 'bg-cyan-50 border-cyan-200 text-cyan-700'
            : 'bg-cyan-950/30 border-cyan-900/50 text-cyan-400'
            }`}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            System Online. AI Engine Ready.
          </div>

          {/* Hero Title */}
          <h1 className={`text-6xl md:text-7xl font-black tracking-tight leading-none mb-3 uppercase ${isLight ? 'text-gray-900' : 'text-white'
            }`}>
            Elevate Your
          </h1>
          <h1 className="text-6xl md:text-7xl font-black tracking-tight leading-none mb-8 uppercase bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 text-transparent bg-clip-text">
            Logic With AI DSA
          </h1>

          <p className={`text-lg mb-12 max-w-2xl mx-auto leading-relaxed ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
            A next-generation data structure visualizer designed for students and developers.
            Experience code logic powered by adaptive AI and modern aesthetics.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onStart}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-cyan-500 text-white font-bold rounded-xl hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:-translate-y-0.5"
            >
              <Play size={18} fill="white" /> Start Visualizing
            </button>
            <button className={`flex items-center justify-center gap-2 px-8 py-4 font-bold rounded-xl transition-all border hover:-translate-y-0.5 ${isLight
              ? 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50 shadow-sm'
              : 'border-gray-700 text-gray-300 bg-gray-800/50 hover:bg-gray-800'
              }`}>
              <Compass size={18} /> Explore Curriculum
            </button>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className={`px-8 pb-16 ${isLight ? '' : ''}`}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <FeatureCard
            icon={<Brain className="text-purple-500" size={24} />}
            iconBg={isLight ? 'bg-purple-50 border-purple-100' : 'bg-purple-500/10 border-purple-500/20'}
            title="AI-Driven Explanations"
            desc="Get real-time, context-aware explanations as you build and traverse complex data structures."
            isLight={isLight}
          />
          <FeatureCard
            icon={<TrendingUp className="text-pink-500" size={24} />}
            iconBg={isLight ? 'bg-pink-50 border-pink-100' : 'bg-pink-500/10 border-pink-500/20'}
            title="Adaptive Learning Paths"
            desc="The platform analyzes your performance and dynamically adjusts difficulty of problems."
            isLight={isLight}
          />
          <FeatureCard
            icon={<Play className="text-cyan-500" size={24} />}
            iconBg={isLight ? 'bg-cyan-50 border-cyan-100' : 'bg-cyan-500/10 border-cyan-500/20'}
            title="Interactive Execution"
            desc="Watch algorithms execute step-by-step with smooth animations and real complexity tracking."
            isLight={isLight}
          />
          <FeatureCard
            icon={<BookOpen className="text-green-500" size={24} />}
            iconBg={isLight ? 'bg-green-50 border-green-100' : 'bg-green-500/10 border-green-500/20'}
            title="Cloud Workspace"
            desc="Persist your data structure configurations and learning progress. Pick up from any device."
            isLight={isLight}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className={`border-t px-8 py-5 flex items-center justify-between text-xs ${isLight ? 'border-gray-200 text-gray-400 bg-white' : 'border-gray-800 text-gray-600 bg-[#040910]'
        }`}>
        <span>© 2025 NeonStruct. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-cyan-500 transition-colors">Privacy</a>
          <a href="#" className="hover:text-cyan-500 transition-colors">Terms</a>
          <span className="font-mono text-cyan-600">v2.0.0 AI Build</span>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, iconBg, title, desc, isLight }: {
  icon: any; iconBg: string; title: string; desc: string; isLight: boolean;
}) {
  return (
    <div className={`p-6 rounded-2xl border transition-all hover:-translate-y-1 ${isLight
      ? 'bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200'
      : 'bg-gray-900/40 border-gray-800 hover:border-gray-700'
      }`}>
      <div className={`mb-4 p-3 rounded-xl w-fit border ${iconBg}`}>{icon}</div>
      <h3 className={`text-base font-bold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>{title}</h3>
      <p className={`text-sm leading-relaxed ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>{desc}</p>
    </div>
  );
}