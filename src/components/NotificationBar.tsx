import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { Notification } from '../hooks/useNotification';

interface Props {
  notification: Notification | null;
  onRemove: () => void;
}

export function NotificationBar({ notification, onRemove }: Props) {
  if (!notification) return null;

  // Distinct Themes
  const themes = {
    success: { 
      // Bright Green Theme
      bg: 'bg-emerald-900/90', 
      border: 'border-emerald-400', 
      text: 'text-emerald-100',
      iconColor: 'text-emerald-400', 
      Icon: CheckCircle 
    },
    error: { 
      // Bright Red Theme
      bg: 'bg-red-900/90', 
      border: 'border-red-500', 
      text: 'text-red-100',
      iconColor: 'text-red-400', 
      Icon: XCircle 
    },
    info: { 
      // Bright Blue Theme
      bg: 'bg-blue-900/90', 
      border: 'border-blue-400', 
      text: 'text-blue-100',
      iconColor: 'text-blue-400', 
      Icon: Info 
    },
  };

  const theme = themes[notification.type || 'info'];
  const IconComponent = theme.Icon;

  return (
    <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] w-full max-w-lg pointer-events-none flex justify-center">
      <div
        key={notification.id}
        className={`
          pointer-events-auto
          flex items-center gap-4 p-5 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)]
          ${theme.bg} border-2 ${theme.border}
          animate-pop-in backdrop-blur-md
        `}
      >
        <div className={`${theme.iconColor} shrink-0 bg-white/10 p-2 rounded-full`}>
          <IconComponent size={28} />
        </div>

        <div className="flex-1 min-w-[240px]">
          <p className={`text-lg font-bold tracking-wide leading-snug ${theme.text}`}>
            {notification.message}
          </p>
        </div>

        <button
          onClick={onRemove}
          className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
