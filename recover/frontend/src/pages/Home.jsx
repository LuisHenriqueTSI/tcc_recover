

import Card from '../components/Card'
import Button from '../components/Button'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react';
import { getUser } from '../services/supabaseAuth';
import { deleteItem } from '../services/items';

export default function Home() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [photosMap, setPhotosMap] = useState({});
  const [mapOpen, setMapOpen] = useState({});
  const [contactModal, setContactModal] = useState({ open: false, item: null, message: '', sending: false, error: '' });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [mineOnly, setMineOnly] = useState(false);

  useEffect(() => {
    fetch('http://localhost:8000/publications/')
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(() => setError('Erro ao carregar itens'))
      .finally(() => setLoading(false));
    getUser().then(u => setUser(u));
  }, []);

  // Atualiza lista de categorias e itens filtrados quando items mudam
  useEffect(() => {
    if (!items) return;
    // extrair categorias únicas
    const cats = Array.from(new Set(items.map(i => i.category).filter(Boolean)));
    setCategories(cats);
    // inicializa filteredItems
    setFilteredItems(items);
  }, [items]);

  // Aplica filtros ao conjunto de itens
  useEffect(() => {
    if (!items) return setFilteredItems([]);
    const s = search.trim().toLowerCase();
    const filtered = items.filter(it => {
      // filtro "meus itens"
      if (mineOnly && user && String(it.owner_id) !== String(user.id)) return false;
      // status
      if (statusFilter !== 'all') {
        if (statusFilter === 'lost' && it.status === 'found') return false;
        if (statusFilter === 'found' && it.status !== 'found') return false;
      }
      // categoria
      if (categoryFilter !== 'all' && (it.category || '') !== categoryFilter) return false;
      // busca por texto em título, descrição e endereço
      if (s) {
        const hay = `${it.title || it.name || ''} ${it.description || ''} ${it.address || ''}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
    setFilteredItems(filtered);
  }, [items, search, statusFilter, categoryFilter, mineOnly, user]);

  // Quando os items forem carregados, busque as fotos (primeira foto) para mostrar nos cards
  useEffect(() => {
    if (!items || items.length === 0) return;
    let mounted = true;
    (async () => {
      try {
        const entries = await Promise.all(items.map(async (it) => {
          try {
            const res = await fetch(`http://localhost:8000/photos/${it.id}`);
            if (!res.ok) return [it.id, null];
            const data = await res.json();
            // data expected to be an array of URLs
            return [it.id, Array.isArray(data) && data.length > 0 ? data[0] : null];
          } catch {
            return [it.id, null];
          }
        }));
        if (!mounted) return;
        const map = Object.fromEntries(entries);
        setPhotosMap(map);
      } catch {
        // ignore photo errors silently
      }
    })();
    return () => { mounted = false; };
  }, [items]);

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

  async function sendContact() {
    if (!contactModal.item) return;
    if (!contactModal.message || contactModal.message.trim() === '') {
      setContactModal(prev => ({ ...prev, error: 'Digite uma mensagem' }));
      return;
    }
    setContactModal(prev => ({ ...prev, sending: true, error: '' }));
    try {
      const payload = {
        sender_id: user?.id,
        receiver_id: contactModal.item.owner_id,
        item_id: contactModal.item.id,
        content: contactModal.message
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
      // success
      setContactModal({ open: false, item: null, message: '', sending: false, error: '' });
      alert('Mensagem enviada ao proprietário.');
    } catch (e) {
      setContactModal(prev => ({ ...prev, sending: false, error: e.message || 'Erro ao enviar' }));
    }
  }

  return (
    <div className="min-h-screen bg-neutral-light flex flex-col items-center justify-center p-2 sm:p-4">
      <Card className="w-full max-w-xl text-center">
        {/* Apenas um botão para registrar item (se usuário logado vai para /register-item, caso contrário para /login) */}
        <div className="flex flex-col gap-2 mb-4">
          <Button variant="primary" onClick={() => navigate(user ? '/register-item' : '/login')}>Registrar Item</Button>
        </div>
      </Card>
      <div className="w-full max-w-3xl mt-6">
        <h2 className="text-xl font-bold text-primary mb-2">Itens Registrados</h2>
        {/* Filters */}
        <div className="mb-4 flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
          <div className="flex gap-2 w-full">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por título, descrição ou endereço" className="w-full px-3 py-2 border rounded" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded">
              <option value="all">Todos</option>
              <option value="lost">Perdidos</option>
              <option value="found">Encontrados</option>
            </select>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 border rounded">
              <option value="all">Todas categorias</option>
              {categories.map(c => (
                <option value={c} key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            {user ? (
              <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={mineOnly} onChange={e => setMineOnly(e.target.checked)} /> Meus itens</label>
            ) : null}
            <button className="px-3 py-2 rounded border" onClick={() => { setSearch(''); setStatusFilter('all'); setCategoryFilter('all'); setMineOnly(false); }}>Limpar</button>
          </div>
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
        ) : filteredItems.length === 0 ? (
          <p className="text-neutral-dark">Nenhum item corresponde aos filtros.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredItems.map((item, idx) => (
              <Card key={item.id} className={`text-left transition-all duration-500 ease-in-out opacity-0 animate-fade-in`} style={{animationDelay: `${idx * 80}ms`} }>
                {/* imagem (se disponível) */}
                {photosMap[item.id] ? (
                  <div className="w-full h-40 mb-2 overflow-hidden rounded">
                    <img src={photosMap[item.id]} alt={item.title || item.name} className="object-cover w-full h-full" />
                  </div>
                ) : (
                  <div className="w-full h-40 mb-2 bg-neutral-100 flex items-center justify-center rounded text-neutral-dark text-sm">Sem foto</div>
                )}
                <div className="flex items-center justify-between mb-1">
                  <div className="font-bold text-primary">{item.title || item.name}</div>
                  <div className={`text-xs font-semibold ${item.status === 'found' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {item.status === 'found' ? 'Encontrado' : 'Perdido'}
                  </div>
                </div>
                <div className="text-neutral-dark text-sm mb-2">{item.description}</div>
                <div className="text-xs text-neutral-dark">{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</div>
                {/* Mostrar endereço (se houver) ou coordenadas; botão para visualizar no mapa */}
                <div className="text-sm text-neutral-dark mt-1 mb-2">
                  {item.address ? (
                    <span>{item.address}</span>
                  ) : item.latitude && item.longitude ? (
                    <span>Local: {Number(item.latitude).toFixed(5)}, {Number(item.longitude).toFixed(5)}</span>
                  ) : null}
                </div>
                {(item.latitude && item.longitude) || item.address ? (
                  <div className="mb-2">
                    <button
                      onClick={async () => {
                        // Se já está aberto, fechar
                        const state = mapOpen[item.id];
                        if (state && state.show) {
                          setMapOpen(prev => ({ ...prev, [item.id]: { ...prev[item.id], show: false } }));
                          return;
                        }

                        // Se já temos coords resolvidas no estado, apenas abrir
                        if (state && (state.lat || state.lon)) {
                          setMapOpen(prev => ({ ...prev, [item.id]: { ...prev[item.id], show: true } }));
                          return;
                        }

                        // Caso item tenha lat/lon, abra diretamente
                        if (item.latitude && item.longitude) {
                          setMapOpen(prev => ({ ...prev, [item.id]: { show: true, lat: item.latitude, lon: item.longitude } }));
                          return;
                        }

                        // Caso só tenha endereço, buscar coords via Nominatim
                        setMapOpen(prev => ({ ...prev, [item.id]: { loading: true } }));
                        try {
                          const q = encodeURIComponent(item.address);
                          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}`);
                          const json = await res.json();
                          if (json && json.length > 0) {
                            const lat = json[0].lat;
                            const lon = json[0].lon;
                            setMapOpen(prev => ({ ...prev, [item.id]: { show: true, lat, lon } }));
                          } else {
                            setMapOpen(prev => ({ ...prev, [item.id]: { loading: false, error: 'Endereço não encontrado' } }));
                          }
                        } catch {
                          setMapOpen(prev => ({ ...prev, [item.id]: { loading: false, error: 'Falha ao buscar coordenadas' } }));
                        }
                      }}
                      className="text-sm text-primary hover:underline"
                    >
                      {mapOpen[item.id] && mapOpen[item.id].show ? 'Ocultar no mapa' : 'Visualizar no mapa'}
                    </button>

                    {/* feedback de loading / erro */}
                    {mapOpen[item.id] && mapOpen[item.id].loading && (
                      <div className="text-sm text-neutral-dark mt-1">Buscando localização...</div>
                    )}
                    {mapOpen[item.id] && mapOpen[item.id].error && (
                      <div className="text-sm text-red-600 mt-1">{mapOpen[item.id].error}</div>
                    )}

                    {/* iframe quando disponível */}
                    {mapOpen[item.id] && mapOpen[item.id].show && (mapOpen[item.id].lat || mapOpen[item.id].lon) && (
                      <div className="mt-2">
                        <div className="w-full h-40 rounded overflow-hidden border">
                          <iframe
                            title={`map-${item.id}`}
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            scrolling="no"
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(mapOpen[item.id].lon) - 0.005},${Number(mapOpen[item.id].lat) - 0.005},${Number(mapOpen[item.id].lon) + 0.005},${Number(mapOpen[item.id].lat) + 0.005}&layer=mapnik&marker=${mapOpen[item.id].lat},${mapOpen[item.id].lon}`}
                          />
                        </div>
                        <div className="text-xs mt-1">
                          <a href={`https://www.openstreetmap.org/?mlat=${mapOpen[item.id].lat}&mlon=${mapOpen[item.id].lon}#map=16/${mapOpen[item.id].lat}/${mapOpen[item.id].lon}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">Abrir no mapa em nova aba</a>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
                {user && String(user.id) === String(item.owner_id) && (
                  <div className="mt-2 flex items-center gap-3">
                    <button onClick={() => navigate('/register-item', { state: { item } })} className="text-sm text-primary hover:underline">Editar</button>
                    <button onClick={() => handleDelete(item.id)} className="text-sm text-red-600 hover:underline">Excluir</button>
                  </div>
                )}
                {user && String(user.id) !== String(item.owner_id) && (
                  <div className="mt-2">
                    <button onClick={() => setContactModal({ open: true, item, message: '', sending: false, error: '' })} className="text-sm text-accent hover:underline">Entrar em contato com o proprietário</button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
      {/* Contact modal */}
      {contactModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow p-4 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">Mensagem ao proprietário</h3>
            <div className="text-sm text-neutral-dark mb-2">Item: {contactModal.item?.title || contactModal.item?.name}</div>
            <textarea value={contactModal.message} onChange={e => setContactModal(prev => ({ ...prev, message: e.target.value }))} className="w-full h-32 border p-2 rounded mb-2" placeholder="Escreva sua mensagem e aguarde resposta"></textarea>
            {contactModal.error && <div className="text-red-600 text-sm mb-2">{contactModal.error}</div>}
            <div className="flex gap-2 justify-end">
              <button className="px-3 py-2 rounded border" onClick={() => setContactModal({ open: false, item: null, message: '', sending: false, error: '' })}>Fechar</button>
              <button className="px-3 py-2 rounded bg-primary text-white" onClick={sendContact} disabled={contactModal.sending}>{contactModal.sending ? 'Enviando...' : 'Enviar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
