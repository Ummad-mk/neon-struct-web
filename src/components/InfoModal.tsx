import { X, Copy, Code, FileText, BookOpen } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  type: 'code' | 'pseudo' | 'algorithm' | null;
}

export function InfoModal({ isOpen, onClose, title, content, type }: Props) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'code': return <Code className="text-blue-400" size={24} />;
      case 'pseudo': return <FileText className="text-purple-400" size={24} />;
      case 'algorithm': return <BookOpen className="text-green-400" size={24} />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
      <div 
        className="bg-[#0f172a] border border-gray-700 w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col animate-scale-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-[#1e293b]/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-800 rounded-lg border border-gray-700">
              {getIcon()}
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide">{title}</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto relative bg-[#0b1221] custom-scrollbar">
          {/* Copy Button */}
          <button 
            onClick={() => navigator.clipboard.writeText(content)}
            className="absolute top-4 right-4 p-2 bg-gray-800/80 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition-all z-10"
            title="Copy to Clipboard"
          >
            <Copy size={18} />
          </button>

          <pre className={`p-6 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-mono ${
            type === 'algorithm' ? 'text-gray-300 font-sans' : 'text-blue-100'
          }`}>
            {content || "No information available for this section yet."}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-[#1e293b]/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}