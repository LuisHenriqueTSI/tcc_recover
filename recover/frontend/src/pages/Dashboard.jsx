
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { getUser } from '../services/supabaseAuth';
import { markItemAsResolved } from '../services/statistics';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [itemsCount, setItemsCount] = useState(0);
  const [messagesCount, setMessagesCount] = useState(0);
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resolvingItemId, setResolvingItemId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getUser()
      .then(setUser)
      .catch(() => setError('Não foi possível carregar os dados do usuário'))
      .finally(() => setLoading(false));
  }, []);

  // Fetch counts once user is available
  useEffect(() => {
    async function loadCounts() {
      if (!user) return;
      try {
        // Fetch all publications and count those owned by the current user
        const resp = await fetch('http://localhost:8000/publications/');
        if (resp.ok) {
          const all = await resp.json();
          // owner_id may be string or number; normalize
          const uid = String(user.id);
          const mine = (all || []).filter(i => String(i.owner_id) === uid);
          setItemsCount(mine.length);
          // keep up to 6 recent items for history
          setRecentItems(mine.slice(0, 6));
        }
      } catch (e) {
        console.debug('Failed to fetch publications for dashboard', e);
      }

      try {
        // Fetch inbox messages for the authenticated user
        const token = localStorage.getItem('recover_token');
        if (token) {
          const r = await fetch('http://localhost:8000/chat/inbox', { headers: { Authorization: `Bearer ${token}` } });
          if (r.ok) {
            const j = await r.json();
            setMessagesCount((j || []).length);
          }
        }
      } catch (e) {
        console.debug('Failed to fetch inbox count', e);
      }
    }
    loadCounts();
  }, [user]);

  async function handleResolveItem(itemId) {
    if (!confirm('Confirma que este item foi devolvido/resolvido?')) {
      return;
    }

    setResolvingItemId(itemId);
    const token = localStorage.getItem('recover_token');
    const { data, error } = await markItemAsResolved(itemId, token);
    
    if (error) {
      alert(error.message || 'Erro ao marcar item como resolvido');
    } else {
      alert('Item marcado como resolvido com sucesso! 🎉');
      // Recarregar a lista de itens
      window.location.reload();
    }
    setResolvingItemId(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 flex flex-col items-center p-2 sm:p-4 md:p-6">
      <Card className="w-full max-w-2xl mb-8 shadow-lg border border-primary/20">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-primary drop-shadow">Meu Painel</h2>
        </div>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-primary"></div>
            <span className="ml-4 text-primary font-semibold">Carregando...</span>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        ) : user ? (
          <div className="mb-6 flex flex-col items-center animate-fade-in">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white text-2xl sm:text-3xl font-bold mb-2 shadow">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="text-lg sm:text-xl font-bold text-neutral-dark">{user.name || user.email}</div>
            <div className="text-xs sm:text-sm text-neutral-dark">{user.email}</div>
            <div className="mt-3">
              <Button variant="secondary" onClick={() => navigate('/profile')}>Editar Perfil</Button>
            </div>
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 mb-6">
          <Card className="bg-primary/10 border border-primary/20">
            <div className="text-base sm:text-lg font-bold text-primary mb-2">Itens Registrados</div>
            <div className="text-2xl sm:text-3xl font-heading text-primary">{itemsCount}</div>
          </Card>
          <Card className="bg-secondary/10 border border-secondary/20">
            <div className="text-base sm:text-lg font-bold text-secondary mb-2">Mensagens</div>
            <div className="text-2xl sm:text-3xl font-heading text-secondary">{messagesCount}</div>
          </Card>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
          <Button variant="primary" onClick={() => navigate('/register-item')}>Registrar Item</Button>
          <Button variant="secondary" onClick={() => navigate('/chat')}>Ver Mensagens</Button>
        </div>
      </Card>
      <Card className="w-full max-w-2xl shadow border border-accent/20">
        <h3 className="text-lg sm:text-xl font-bold text-accent mb-2">Histórico de Itens</h3>
        {recentItems && recentItems.length > 0 ? (
          <ul className="space-y-2">
            {recentItems.map(it => (
              <li key={it.id} className="border rounded p-3 bg-white">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="font-semibold">{it.title || it.name || `Item ${it.id}`}</div>
                    <div className="text-xs text-neutral-dark">{it.location || it.place || ''}</div>
                    <div className="text-sm text-neutral-dark mt-1">
                      {it.resolved ? (
                        <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                          ✓ Resolvido
                        </span>
                      ) : (
                        <span className="text-orange-600">{it.status || 'Pendente'}</span>
                      )}
                    </div>
                  </div>
                  {!it.resolved && (
                    <Button
                      variant="secondary"
                      onClick={() => handleResolveItem(it.id)}
                      disabled={resolvingItemId === it.id}
                      className="text-xs py-1 px-3 whitespace-nowrap"
                    >
                      {resolvingItemId === it.id ? 'Marcando...' : 'Marcar como Resolvido'}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-neutral-dark">Nenhum item registrado ainda.</p>
        )}
      </Card>
    </div>
  );
}
