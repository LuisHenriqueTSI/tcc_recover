import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
    // Verifica a cada 15 segundos
    const interval = setInterval(fetchUnreadCount, 15000);
    
    // Escutar evento customizado de mensagens lidas
    const handleMessagesRead = () => {
      console.log('[useUnreadMessages] Messages read event received, refreshing count');
      fetchUnreadCount();
    };
    window.addEventListener('messages-read', handleMessagesRead);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('messages-read', handleMessagesRead);
    };
  }, []);

  async function fetchUnreadCount() {
    const token = localStorage.getItem('recover_token');
    if (!token) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/chat/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[useUnreadMessages] Unread count:', data.unread_count);
        setUnreadCount(data.unread_count || 0);
      } else {
        console.error('[useUnreadMessages] Failed to fetch:', response.status);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('[useUnreadMessages] Error fetching unread count:', error);
      setUnreadCount(0);
    }
  }

  return { unreadCount, refreshUnreadCount: fetchUnreadCount };
}
