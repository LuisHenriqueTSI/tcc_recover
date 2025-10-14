

import Card from '../components/Card'
import Button from '../components/Button'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react';
import { getUser } from '../services/supabaseAuth';

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
          <p className="text-neutral-dark">Carregando...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : items.length === 0 ? (
          <p className="text-neutral-dark">Nenhum item registrado ainda.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {items.map(item => (
              <Card key={item.id} className="text-left">
                <div className="font-bold text-primary mb-1">{item.title || item.name}</div>
                <div className="text-neutral-dark text-sm mb-2">{item.description}</div>
                <div className="text-xs text-neutral-dark">{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
