import Card from '../components/Card'
import Button from '../components/Button'
import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'

export default function Chat() {
  const { user } = useAuth();
  const [inbox, setInbox] = useState([]);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [inboxError, setInboxError] = useState('');
  const [nameMap, setNameMap] = useState({}); // cache sender_id -> name

  const [message, setMessage] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [itemId, setItemId] = useState('');
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState(null); // { id, sender_id, content }

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
        const msgs = json || [];
        setInbox(msgs);
        // fetch sender names for unique sender_ids
        const ids = Array.from(new Set(msgs.map(m => String(m.sender_id)).filter(Boolean)));
        const missing = ids.filter(id => !nameMap[id]);
        if (missing.length > 0) {
          // fetch names in parallel (one request per id)
          const fetches = missing.map(id => fetch(`http://localhost:8000/auth/users/${encodeURIComponent(id)}`)
            .then(r => r.ok ? r.json() : null)
            .catch(() => null)
          );
          const results = await Promise.all(fetches);
          const newMap = {};
          results.forEach(r => {
            if (r && r.id) newMap[String(r.id)] = r.name || String(r.id);
          });
          if (Object.keys(newMap).length > 0) setNameMap(prev => ({ ...prev, ...newMap }));
        }
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
    // if replying, receiverId comes from replyTo unless explicitly provided
    const to = replyTo ? replyTo.sender_id : receiverId;
    if (!message || !to) return alert('Preencha o destinatário e a mensagem');
    setSending(true);
    try {
      const payload = {
        sender_id: user?.id,
        receiver_id: to,
        // if user didn't fill itemId but this is a reply, inherit item_id from replied message
        item_id: itemId || (replyTo && replyTo.item_id) || null,
        content: message,
        reply_to_id: replyTo ? replyTo.id : null
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
      setReplyTo(null);
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
                  <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm text-neutral-dark mb-1"><strong>De:</strong> {m.sender_name || nameMap[String(m.sender_id)] || m.sender_id}</div>
                            <div className="text-sm mb-1">{m.content}</div>
                            <div className="text-xs text-neutral-dark">Relacionado ao item: {m.item_title ? m.item_title : (m.item_id || '—')}</div>
                          </div>
                    <div className="flex-shrink-0">
                      <button
                        className="text-sm text-primary hover:underline"
                        onClick={() => setReplyTo({ id: m.id, sender_id: m.sender_id, content: m.content, item_id: m.item_id, item_title: m.item_title })}
                      >Responder</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form className="flex flex-col gap-2 mt-4" onSubmit={handleSend}>
          {replyTo && (
            <div className="flex items-center justify-between bg-neutral-100 border p-2 rounded">
              <div className="text-sm text-neutral-dark">Respondendo a <strong>{replyTo.item_title ? (replyTo.item_title) : (nameMap[String(replyTo.sender_id)] || replyTo.sender_id)}</strong>: "{replyTo.content.length > 80 ? replyTo.content.slice(0,80) + '...' : replyTo.content}"</div>
              <button type="button" className="text-sm text-red-600 hover:underline" onClick={() => setReplyTo(null)}>Cancelar</button>
            </div>
          )}

          <div className="flex gap-2">
            {!replyTo && (
              <input value={receiverId} onChange={e => setReceiverId(e.target.value)} className="w-28 px-3 py-2 border rounded" placeholder="Destinatário ID" />
            )}
            <input value={itemId} onChange={e => setItemId(e.target.value)} className="w-24 px-3 py-2 border rounded" placeholder="Item ID (opcional)" />
            <input value={message} onChange={e => setMessage(e.target.value)} className="flex-1 px-3 py-2 border border-neutral-light rounded focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Digite sua mensagem..." />
            <Button variant="primary" type="submit" disabled={sending}>{sending ? 'Enviando...' : 'Enviar'}</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
