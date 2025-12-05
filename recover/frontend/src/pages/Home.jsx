

import Card from '../components/Card'
import Button from '../components/Button'
import ShareButton from '../components/ShareButton'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react';
import { deleteItem } from '../services/items';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [photosMap, setPhotosMap] = useState({});
  const [mapOpen, setMapOpen] = useState({});
  const [contactModal, setContactModal] = useState({ open: false, item: null, message: '', sending: false, error: '' });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [mineOnly, setMineOnly] = useState(false);
  const [ownerSocialMedia, setOwnerSocialMedia] = useState({});
  const [expandedCards, setExpandedCards] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/publications/')
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(() => setError('Erro ao carregar itens'))
      .finally(() => setLoading(false));
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

  // Buscar redes sociais do proprietário do item
  async function loadOwnerSocialMedia(userId) {
    if (ownerSocialMedia[userId]) return; // já foi carregado
    try {
      const res = await fetch(`http://localhost:8000/auth/users/${userId}/social-media`);
      if (res.ok) {
        const data = await res.json();
        setOwnerSocialMedia(prev => ({ ...prev, [userId]: data }));
      }
    } catch (err) {
      console.debug('Erro ao buscar redes sociais do proprietário:', err);
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
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="cursor-pointer"
              >
                <Card className={`text-left transition-all duration-500 ease-in-out opacity-0 animate-fade-in flex flex-col h-96 hover:shadow-lg`} style={{animationDelay: `${idx * 80}ms`} }>
                  {/* imagem (se disponível) com botão compartilhar */}
                  <div className="relative flex-shrink-0">
                    {photosMap[item.id] ? (
                      <div className="w-full h-40 mb-2 overflow-hidden rounded">
                        <img src={photosMap[item.id]} alt={item.title || item.name} className="object-cover w-full h-full" />
                      </div>
                    ) : (
                      <div className="w-full h-40 mb-2 bg-neutral-100 flex items-center justify-center rounded text-neutral-dark text-sm">Sem foto</div>
                    )}
                    {/* Botão compartilhar no canto superior direito */}
                    <div className="absolute top-2 right-2" onClick={e => e.stopPropagation()}>
                      <ShareButton item={item} />
                  </div>
                </div>
                
                {/* Conteúdo com altura fixa e scroll */}
                <div className="flex-grow overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between mb-1 flex-shrink-0">
                    <div className="font-bold text-primary truncate">{item.title || item.name}</div>
                    <div className={`text-xs font-semibold flex-shrink-0 ml-2 ${item.status === 'found' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {item.status === 'found' ? 'Encontrado' : 'Perdido'}
                    </div>
                  </div>
                  
                  {/* Descrição com "Ver mais" */}
                  <div className={`text-neutral-dark text-sm mb-2 ${!expandedCards[item.id] ? 'line-clamp-2' : ''}`}>
                    {item.description}
                  </div>
                  
                  {item.description && item.description.split('\n').length > 2 && (
                    <button
                      onClick={() => setExpandedCards(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                      className="text-xs text-primary hover:underline mb-2 font-semibold"
                    >
                      {expandedCards[item.id] ? 'Ver menos' : 'Ver mais'}
                    </button>
                  )}
                  
                  <div className="text-xs text-neutral-dark mb-1 flex-shrink-0">{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</div>
                  <div className="text-xs text-neutral-dark mb-2 flex-shrink-0 truncate">
                    {item.address ? (
                      <span>{item.address}</span>
                    ) : item.latitude && item.longitude ? (
                      <span>Local: {Number(item.latitude).toFixed(5)}, {Number(item.longitude).toFixed(5)}</span>
                    ) : null}
                  </div>
                  
                  {/* Mapa e botões no final */}
                  <div className="flex-grow" />
                </div>
                
                {(item.latitude && item.longitude) || item.address ? (
                  <div className="mb-2 flex-shrink-0">
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
                  <div className="mt-4 flex gap-2 flex-wrap items-center">
                    <button onClick={() => navigate('/register-item', { state: { item } })} className="inline-flex items-center gap-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium text-sm transition shadow-md hover:shadow-lg">
                      <span>✏️</span>
                      <span>Editar</span>
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="inline-flex items-center gap-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition shadow-md hover:shadow-lg">
                      <span>🗑️</span>
                      <span>Excluir</span>
                    </button>
                  </div>
                )}
                {user && String(user.id) !== String(item.owner_id) && (
                  <div className="mt-4 flex gap-2 flex-wrap">
                    <button 
                      onClick={() => {
                        loadOwnerSocialMedia(item.owner_id);
                        setContactModal({ open: true, item, message: '', sending: false, error: '' });
                      }} 
                      className="inline-flex items-center gap-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium text-sm transition shadow-md hover:shadow-lg"
                    >
                      <span>💬</span>
                      <span>Contato</span>
                    </button>
                  </div>
                )}
                {!user && (
                  <div className="mt-4 flex gap-2 flex-wrap">
                    <button 
                      onClick={() => navigate('/login')} 
                      className="inline-flex items-center gap-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium text-sm transition shadow-md hover:shadow-lg"
                    >
                      <span>💬</span>
                      <span>Entrar para Contatar</span>
                    </button>
                  </div>
                )}
              </Card>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Modal de detalhes do item */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={() => setSelectedItem(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-screen overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="mb-6 pb-4 border-b-2 border-neutral-light">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-primary">{selectedItem.title || selectedItem.name}</h2>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-2xl hover:text-red-500 transition"
                >
                  ✕
                </button>
              </div>
              <div className={`text-sm font-semibold ${selectedItem.status === 'found' ? 'text-green-600' : 'text-yellow-600'}`}>
                {selectedItem.status === 'found' ? '✅ Encontrado' : '🔍 Perdido'}
              </div>
            </div>

            {/* Foto */}
            {photosMap[selectedItem.id] && (
              <div className="mb-4 rounded overflow-hidden">
                <img src={photosMap[selectedItem.id]} alt={selectedItem.title} className="w-full object-cover max-h-96" />
              </div>
            )}

            {/* Conteúdo */}
            <div className="space-y-4 mb-6">
              <div>
                <h3 className="font-semibold text-neutral-dark mb-1">Descrição</h3>
                <p className="text-neutral-dark whitespace-pre-wrap">{selectedItem.description || 'Sem descrição'}</p>
              </div>

              {selectedItem.address && (
                <div>
                  <h3 className="font-semibold text-neutral-dark mb-1">Endereço</h3>
                  <p className="text-neutral-dark">{selectedItem.address}</p>
                </div>
              )}

              {selectedItem.category && (
                <div>
                  <h3 className="font-semibold text-neutral-dark mb-1">Categoria</h3>
                  <p className="text-neutral-dark">{selectedItem.category}</p>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-neutral-dark mb-1">Data de Registro</h3>
                <p className="text-neutral-dark">{selectedItem.created_at ? new Date(selectedItem.created_at).toLocaleDateString('pt-BR') : 'Não informada'}</p>
              </div>

              {(selectedItem.latitude && selectedItem.longitude) || selectedItem.address ? (
                <div>
                  <button
                    onClick={async () => {
                      const state = mapOpen[selectedItem.id];
                      if (state && state.show) {
                        setMapOpen(prev => ({ ...prev, [selectedItem.id]: { ...prev[selectedItem.id], show: false } }));
                        return;
                      }

                      if (selectedItem.latitude && selectedItem.longitude) {
                        setMapOpen(prev => ({ ...prev, [selectedItem.id]: { show: true, lat: selectedItem.latitude, lon: selectedItem.longitude } }));
                        return;
                      }

                      setMapOpen(prev => ({ ...prev, [selectedItem.id]: { loading: true } }));
                      try {
                        const q = encodeURIComponent(selectedItem.address);
                        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}`);
                        const json = await res.json();
                        if (json && json.length > 0) {
                          const lat = json[0].lat;
                          const lon = json[0].lon;
                          setMapOpen(prev => ({ ...prev, [selectedItem.id]: { show: true, lat, lon } }));
                        }
                      } catch {
                        console.error('Erro ao buscar localização');
                      }
                    }}
                    className="text-primary hover:underline font-semibold"
                  >
                    {mapOpen[selectedItem.id] && mapOpen[selectedItem.id].show ? 'Ocultar Mapa' : 'Visualizar no Mapa'}
                  </button>

                  {mapOpen[selectedItem.id] && mapOpen[selectedItem.id].show && (mapOpen[selectedItem.id].lat || mapOpen[selectedItem.id].lon) && (
                    <div className="mt-3">
                      <div className="w-full h-64 rounded overflow-hidden border">
                        <iframe
                          title={`map-detail-${selectedItem.id}`}
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          scrolling="no"
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(mapOpen[selectedItem.id].lon) - 0.01},${Number(mapOpen[selectedItem.id].lat) - 0.01},${Number(mapOpen[selectedItem.id].lon) + 0.01},${Number(mapOpen[selectedItem.id].lat) + 0.01}&layer=mapnik&marker=${mapOpen[selectedItem.id].lat},${mapOpen[selectedItem.id].lon}`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Ações */}
            {user && String(user.id) === String(selectedItem.owner_id) && (
              <div className="flex gap-2 flex-wrap border-t pt-4">
                <button
                  onClick={() => {
                    setSelectedItem(null);
                    navigate('/register-item', { state: { item: selectedItem } });
                  }}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium text-sm transition shadow-md hover:shadow-lg"
                >
                  <span>✏️</span>
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm('Tem certeza que deseja excluir este item?')) {
                      handleDelete(selectedItem.id);
                      setSelectedItem(null);
                    }
                  }}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition shadow-md hover:shadow-lg"
                >
                  <span>🗑️</span>
                  <span>Excluir</span>
                </button>
              </div>
            )}

            {user && String(user.id) !== String(selectedItem.owner_id) && (
              <div className="flex gap-2 flex-wrap border-t pt-4">
                <button
                  onClick={() => {
                    loadOwnerSocialMedia(selectedItem.owner_id);
                    setContactModal({ open: true, item: selectedItem, message: '', sending: false, error: '' });
                  }}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium text-sm transition shadow-md hover:shadow-lg"
                >
                  <span>💬</span>
                  <span>Contato</span>
                </button>
              </div>
            )}

            {!user && (
              <div className="flex gap-2 flex-wrap border-t pt-4">
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium text-sm transition shadow-md hover:shadow-lg"
                >
                  <span>💬</span>
                  <span>Entrar para Contatar</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contact modal */}
      {contactModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
            {/* Header */}
            <div className="mb-6 pb-4 border-b-2 border-neutral-light">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-bold text-primary">Contato com o Proprietário</h3>
                <button
                  onClick={() => setContactModal({ open: false, item: null, message: '', sending: false, error: '' })}
                  className="text-2xl hover:text-red-500 transition"
                >
                  ✕
                </button>
              </div>
              <div className="text-sm text-neutral-dark">
                <span className="inline-block bg-accent/10 text-accent px-3 py-1 rounded-full">
                  📦 {contactModal.item?.title || contactModal.item?.name}
                </span>
              </div>
            </div>

            {/* Redes Sociais do Proprietário */}
            {ownerSocialMedia[contactModal.item?.owner_id] && (
              <div className="mb-6 p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl border-2 border-primary/20">
                <div className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                  <span>📱</span>
                  <span>Formas de Contato Direto</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {ownerSocialMedia[contactModal.item?.owner_id].whatsapp && (
                    <a
                      href={`https://wa.me/${ownerSocialMedia[contactModal.item?.owner_id].whatsapp}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      <span className="text-lg">💬</span>
                      <span className="text-xs font-semibold">WhatsApp</span>
                    </a>
                  )}
                  
                  {ownerSocialMedia[contactModal.item?.owner_id].instagram && (
                    <a
                      href={`https://instagram.com/${ownerSocialMedia[contactModal.item?.owner_id].instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 p-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-lg transition shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      <span className="text-lg">📷</span>
                      <span className="text-xs font-semibold">Instagram</span>
                    </a>
                  )}
                  
                  {ownerSocialMedia[contactModal.item?.owner_id].facebook && (
                    <a
                      href={`https://facebook.com/${ownerSocialMedia[contactModal.item?.owner_id].facebook}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      <span className="text-lg">👍</span>
                      <span className="text-xs font-semibold">Facebook</span>
                    </a>
                  )}
                  
                  {ownerSocialMedia[contactModal.item?.owner_id].twitter && (
                    <a
                      href={`https://twitter.com/${ownerSocialMedia[contactModal.item?.owner_id].twitter.replace('@', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 p-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      <span className="text-lg">𝕏</span>
                      <span className="text-xs font-semibold">Twitter</span>
                    </a>
                  )}
                  
                  {ownerSocialMedia[contactModal.item?.owner_id].phone && (
                    <a
                      href={`tel:${ownerSocialMedia[contactModal.item?.owner_id].phone}`}
                      className="flex items-center gap-2 p-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      <span className="text-lg">☎️</span>
                      <span className="text-xs font-semibold">Ligação</span>
                    </a>
                  )}
                  
                  {ownerSocialMedia[contactModal.item?.owner_id].linkedin && (
                    <a
                      href={`https://linkedin.com/in/${ownerSocialMedia[contactModal.item?.owner_id].linkedin}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 p-3 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      <span className="text-lg">🔗</span>
                      <span className="text-xs font-semibold">LinkedIn</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Separador */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-neutral-light"></div>
              <span className="text-xs text-neutral-light font-semibold">OU</span>
              <div className="flex-1 h-px bg-neutral-light"></div>
            </div>

            {/* Chat do Sistema */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-primary mb-2">
                📧 Enviar Mensagem via Chat do Sistema
              </label>
              <textarea
                value={contactModal.message}
                onChange={e => setContactModal(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Escreva sua mensagem aqui... (máximo 500 caracteres)"
                maxLength="500"
                className="w-full h-32 border-2 border-neutral-light p-3 rounded-lg focus:border-primary focus:outline-none resize-none text-sm"
              />
              <div className="text-xs text-neutral-light text-right mt-1">
                {contactModal.message.length}/500 caracteres
              </div>
            </div>

            {contactModal.error && (
              <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg text-red-700 text-sm font-semibold flex items-center gap-2">
                <span>❌</span>
                {contactModal.error}
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setContactModal({ open: false, item: null, message: '', sending: false, error: '' })}
                className="px-6 py-3 rounded-lg border-2 border-neutral-light hover:bg-neutral-light text-neutral-dark font-semibold transition"
              >
                Cancelar
              </button>
              <button
                onClick={sendContact}
                disabled={contactModal.sending || !contactModal.message.trim()}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition shadow-md hover:shadow-lg transform hover:scale-105"
              >
                {contactModal.sending ? '⏳ Enviando...' : '✉️ Enviar Mensagem'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
