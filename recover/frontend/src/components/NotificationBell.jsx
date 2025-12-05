import { useState, useEffect } from 'react';
import { getPendingNotificationItems, markItemAsResolved } from '../services/statistics';
import { useUnreadMessages } from '../hooks/useUnreadMessages';

export default function NotificationBell() {
  const [pendingItems, setPendingItems] = useState([]);
  const [dismissedItems, setDismissedItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { unreadCount } = useUnreadMessages();

  useEffect(() => {
    checkPendingItems();
    // Verifica a cada 30 segundos
    const interval = setInterval(checkPendingItems, 30000);
    return () => clearInterval(interval);
  }, []);

  async function checkPendingItems() {
    const token = localStorage.getItem('recover_token');
    if (!token) return;

    console.log('[NotificationBell] Checking for pending items...');
    const { data, error } = await getPendingNotificationItems(token);
    
    if (error) {
      console.error('[NotificationBell] Error fetching pending items:', error);
      return;
    }
    
    console.log('[NotificationBell] Pending items received:', data);
    
    if (data && Array.isArray(data)) {
      // Filtrar itens que já foram dispensados nesta sessão
      const filtered = data.filter(item => !dismissedItems.includes(item.id));
      console.log('[NotificationBell] Filtered items:', filtered);
      setPendingItems(filtered);
    }
  }

  async function handleYes(item) {
    setLoading(true);
    const token = localStorage.getItem('recover_token');
    const { data, error } = await markItemAsResolved(item.id, token);
    
    if (error) {
      alert(error.message || 'Erro ao marcar item como resolvido');
    } else {
      // Remove o item da lista de pendentes
      setPendingItems(prev => prev.filter(i => i.id !== item.id));
      alert('🎉 Parabéns! Ótimo saber que encontrou seu item!');
      // Fecha o dropdown se não houver mais itens
      if (pendingItems.length === 1) {
        setIsOpen(false);
      }
    }
    setLoading(false);
  }

  function handleNo(item) {
    // Remove da lista e adiciona aos dispensados
    setPendingItems(prev => prev.filter(i => i.id !== item.id));
    setDismissedItems(prev => [...prev, item.id]);
    // Fecha o dropdown se não houver mais itens
    if (pendingItems.length === 1) {
      setIsOpen(false);
    }
  }

  const notificationCount = pendingItems.length + unreadCount;

  return (
    <div className="relative">
      {/* Botão do sino */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white hover:text-blue-400 transition-colors"
        aria-label="Notificações"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        
        {/* Badge com contador */}
        {notificationCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {notificationCount}
          </span>
        )}
      </button>

      {/* Dropdown de notificações */}
      {isOpen && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-20 max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-bold text-lg text-primary">
                Notificações {notificationCount > 0 && `(${notificationCount})`}
              </h3>
            </div>

            {notificationCount === 0 ? (
              <div className="p-6 text-center text-neutral-dark">
                <div className="text-4xl mb-2">🔔</div>
                <p>Nenhuma notificação no momento</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {/* Mensagens não lidas */}
                {unreadCount > 0 && (
                  <div className="p-4 bg-blue-50 hover:bg-blue-100 cursor-pointer" onClick={() => { window.location.href = '/chat'; setIsOpen(false); }}>
                    <div className="flex items-start gap-2">
                      <span className="text-2xl">💬</span>
                      <div className="flex-1">
                        <h4 className="font-bold text-primary mb-1">
                          {unreadCount === 1 ? 'Nova mensagem' : `${unreadCount} novas mensagens`}
                        </h4>
                        <p className="text-sm text-neutral-dark">
                          Clique para ver suas mensagens
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Itens pendentes de resolução */}
                {pendingItems.map(item => (
                  <div key={item.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start gap-2 mb-3">
                      <span className="text-2xl">🔍</span>
                      <div className="flex-1">
                        <h4 className="font-bold text-primary mb-1">
                          Você encontrou seu item?
                        </h4>
                        <p className="text-sm text-neutral-dark">
                          <span className="font-semibold">{item.title}</span>
                          {item.location && (
                            <span className="text-xs block text-gray-500 mt-1">
                              📍 {item.location}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleYes(item)}
                        disabled={loading}
                        className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Salvando...' : 'Sim! 🎉'}
                      </button>
                      <button
                        onClick={() => handleNo(item)}
                        disabled={loading}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-neutral-dark font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50"
                      >
                        Ainda não
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
