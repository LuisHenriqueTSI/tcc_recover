import Card from '../components/Card';
import Button from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';

// Mostra mensagens recebidas (inbox)
async function fetchInbox(token) {
  const res = await fetch('http://localhost:8000/chat/inbox', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Erro ao buscar inbox');
  return res.json();
}

export default function Profile() {
  const { user } = useAuth();
  const [inbox, setInbox] = useState([]);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [inboxError, setInboxError] = useState('');

  useEffect(() => {
    async function loadInbox(){
      setLoadingInbox(true);
      setInboxError('');
      try{
        const token = localStorage.getItem('recover_token');
        if (!token) throw new Error('Usuário não autenticado');
        const res = await fetch('http://localhost:8000/chat/inbox', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || 'Erro ao buscar mensagens');
        }
        const json = await res.json();
        setInbox(json || []);
      } catch (e) {
        setInboxError(e.message || 'Erro');
      } finally {
        setLoadingInbox(false);
      }
    }
    if (user) loadInbox();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <div className="text-red-600 font-bold mb-2">Usuário não autenticado</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-light flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <h2 className="text-2xl font-heading font-bold text-primary mb-4">Meu Perfil</h2>
        <div className="mb-4">
          <div className="w-20 h-20 rounded-full bg-neutral-light border mx-auto mb-2" />
          <div className="text-lg font-bold text-neutral-dark">{user.name}</div>
          <div className="text-sm text-neutral-dark">{user.email}</div>
        </div>
        <Button variant="secondary">Editar Perfil</Button>
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Mensagens recebidas</h3>
          {loadingInbox ? (
            <div>Carregando mensagens...</div>
          ) : inboxError ? (
            <div className="text-red-600">{inboxError}</div>
          ) : inbox.length === 0 ? (
            <div className="text-neutral-dark">Nenhuma mensagem recebida.</div>
          ) : (
            <ul className="space-y-2">
              {inbox.map(m => (
                <li key={m.id} className="border rounded p-2 bg-white">
                  <div className="text-sm text-neutral-dark mb-1"><strong>De:</strong> {m.sender_id}</div>
                  <div className="text-sm mb-1">{m.content}</div>
                  <div className="text-xs text-neutral-dark">Relacionado ao item: {m.item_id}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}
