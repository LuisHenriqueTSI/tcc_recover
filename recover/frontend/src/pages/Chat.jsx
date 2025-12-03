import Card from '../components/Card'
import Button from '../components/Button'
import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'

export default function Chat() {
  const { user } = useAuth();
  const [inbox, setInbox] = useState([]);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [inboxError, setInboxError] = useState('');

  const [message, setMessage] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [itemId, setItemId] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function loadInbox() {
      setLoadingInbox(true);
      setInboxError('');
      try {
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

  async function handleSend(e) {
    e.preventDefault();
    if (!message || !receiverId) return alert('Preencha o destinatário e a mensagem');
    setSending(true);
    try {
      const payload = {
        sender_id: user?.id,
        receiver_id: receiverId,
        item_id: itemId || null,
        content: message
      };
      const res = await fetch('http://localhost:8000/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Erro ao enviar mensagem');
      }
      setMessage('');
      setReceiverId('');
      setItemId('');
      // refresh inbox
      const token = localStorage.getItem('recover_token');
      if (token) {
        const r2 = await fetch('http://localhost:8000/chat/inbox', { headers: { Authorization: `Bearer ${token}` } });
        if (r2.ok) {
          const j = await r2.json();
          setInbox(j || []);
        }
      }
    } catch (e) {
      alert(e.message || 'Erro ao enviar');
    } finally {
      setSending(false);
    }
  }

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
      <Card className="max-w-lg w-full">
        <h2 className="text-2xl font-heading font-bold text-primary mb-4">Chat de Mensagens</h2>

        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Mensagens recebidas</h3>
          {loadingInbox ? (
            <div>Carregando mensagens...</div>
          ) : inboxError ? (
            <div className="text-red-600">{inboxError}</div>
          ) : inbox.length === 0 ? (
            <div className="text-neutral-dark">Nenhuma mensagem recebida.</div>
          ) : (
            <ul className="space-y-2 h-48 overflow-y-auto p-1">
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

        <form className="flex gap-2 mt-4" onSubmit={handleSend}>
          <input value={receiverId} onChange={e => setReceiverId(e.target.value)} className="w-28 px-3 py-2 border rounded" placeholder="Destinatário ID" />
          <input value={itemId} onChange={e => setItemId(e.target.value)} className="w-24 px-3 py-2 border rounded" placeholder="Item ID (opcional)" />
          <input value={message} onChange={e => setMessage(e.target.value)} className="flex-1 px-3 py-2 border border-neutral-light rounded focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Digite sua mensagem..." />
          <Button variant="primary" type="submit" disabled={sending}>{sending ? 'Enviando...' : 'Enviar'}</Button>
        </form>
      </Card>
    </div>
  )
}
