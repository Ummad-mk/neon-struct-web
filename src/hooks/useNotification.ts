import { useState, useCallback, useRef } from 'react';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export const useNotification = () => {
  // Changed from array to single object | null
  const [notification, setNotification] = useState<Notification | null>(null);
  
  // Ref to hold the active timer so we can cancel it if a new one comes fast
  const timeoutRef = useRef<number | null>(null);

  const addNotification = useCallback((message: string, type: 'success' | 'info' | 'error' = 'info') => {
    // 1. Clear existing timer if any (prevents premature closing of new toast)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 2. Set new notification immediately (replaces old one)
    const id = Date.now().toString();
    const newNotification = { message, id, type };
    setNotification(newNotification);

    // 3. Start new 1.5s timer
    timeoutRef.current = window.setTimeout(() => {
      setNotification((current) => (current?.id === id ? null : current));
    }, 2250);
  }, []);

  const removeNotification = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setNotification(null);
  }, []);

  return {
    notification, // Return single object
    addNotification,
    removeNotification,
  };
};
