

import Card from '../components/Card'
import Button from '../components/Button'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react';
import { getUser } from '../services/supabaseAuth';
import { deleteItem } from '../services/items';

export default function Home() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/publications/')
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(() => setError('Erro ao carregar itens'))
      .finally(() => setLoading(false));
    getUser().then(u => setUser(u));
  }, []);

  async function handleDelete(id) {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    const token = localStorage.getItem('recover_token');
    try {
      await deleteItem(id, token);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      setError(err.message || 'Erro ao deletar item');
    }
  }

  return (
    <div className="min-h-screen bg-neutral-light flex flex-col items-center justify-center p-2 sm:p-4">
      <Card className="w-full max-w-xl text-center">
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-primary mb-4">Recover</h1>
        <p className="text-base sm:text-lg text-neutral-dark mb-6">Sistema web para achados e perdidos de objetos e animais. Encontre, registre e ajude a comunidade!</p>
        {!user && (
          <div className="flex flex-col gap-2 mb-4">
            <Button variant="primary" onClick={() => navigate('/login')}>Entrar</Button>
            <Button variant="accent" onClick={() => navigate('/register')}>Registrar Usuário</Button>
          </div>
        )}
        {/* Seção de estatísticas removida conforme solicitado */}
        {user && (
          <div className="flex flex-col gap-2 mt-4">
            <Button variant="secondary" onClick={() => navigate('/register-item')}>Registrar Item</Button>
          </div>
        )}
      </Card>
      <div className="w-full max-w-3xl mt-6">
        <h2 className="text-xl font-bold text-primary mb-2">Itens Registrados</h2>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-primary"></div>
            <span className="ml-4 text-primary font-semibold">Carregando...</span>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        ) : items.length === 0 ? (
          <p className="text-neutral-dark">Nenhum item registrado ainda.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {items.map((item, idx) => (
              <Card key={item.id} className={`text-left transition-all duration-500 ease-in-out opacity-0 animate-fade-in`} style={{animationDelay: `${idx * 80}ms`} }>
                <div className="flex items-center justify-between mb-1">
                  <div className="font-bold text-primary">{item.title || item.name}</div>
                  <div className={`text-xs font-semibold ${item.status === 'found' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {item.status === 'found' ? 'Encontrado' : 'Perdido'}
                  </div>
                </div>
                <div className="text-neutral-dark text-sm mb-2">{item.description}</div>
                <div className="text-xs text-neutral-dark">{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</div>
                {user && String(user.id) === String(item.owner_id) && (
                  <div className="mt-2 flex items-center gap-3">
                    <button onClick={() => navigate('/register-item', { state: { item } })} className="text-sm text-primary hover:underline">Editar</button>
                    <button onClick={() => handleDelete(item.id)} className="text-sm text-red-600 hover:underline">Excluir</button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
