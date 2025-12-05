import { useState, useEffect } from 'react';
import SimpleSidebar from '../components/SimpleSidebar';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [publishedItems, setPublishedItems] = useState([]);
  const [resolvedItems, setResolvedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserItems();
    }
  }, [user]);

  useEffect(() => {
    // Recarregar itens toda vez que a página é visitada
    return () => {
      // Cleanup
    };
  }, []);

  async function fetchUserItems() {
    try {
      const token = localStorage.getItem('recover_token');
      console.clear();
      console.log('[Profile] ===== FETCHING USER ITEMS =====');
      console.log('[Profile] Fetching user items with token:', token ? 'present' : 'missing');
      
      if (!token) {
        console.error('[Profile] Token não disponível');
        setLoading(false);
        return;
      }

      // Usar o novo endpoint /my-items que requer autenticação
      const url = 'http://localhost:8000/publications/my-items';
      console.log('[Profile] URL:', url);
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('[Profile] Response status:', response.status);
      
      if (response.ok) {
        const userItems = await response.json();
        console.log('[Profile] User items received:', userItems);
        console.log('[Profile] Total items:', userItems.length);
        
        // Separar em publicados (ativos) e resolvidos
        const published = userItems.filter(item => !item.resolved);
        const resolved = userItems.filter(item => item.resolved);
        
        console.log('[Profile] Published:', published.length, 'Resolved:', resolved.length);
        
        setPublishedItems(published);
        setResolvedItems(resolved);
      } else {
        console.error('[Profile] Response not OK:', response.status);
        const errorText = await response.text();
        console.error('[Profile] Error:', errorText);
      }
    } catch (error) {
      console.error('[Profile] Erro ao buscar itens:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface-dark rounded-xl p-6 text-center border border-white/10">
          <div className="text-red-400 font-bold mb-2">Usuário não autenticado</div>
        </div>
      </div>
    );
  }

  // Função para abrir redes sociais
  const openSocialMedia = (type, value) => {
    let url = '';
    if (!value) return;

    switch(type) {
      case 'instagram':
        url = `https://instagram.com/${value.replace('@', '')}`;
        break;
      case 'twitter':
        url = `https://twitter.com/${value.replace('@', '')}`;
        break;
      case 'facebook':
        url = `https://facebook.com/${value}`;
        break;
      case 'linkedin':
        url = `https://linkedin.com/in/${value}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/${value}`;
        break;
      case 'phone':
        url = `tel:${value}`;
        break;
      default:
        return;
    }
    
    window.open(url, '_blank');
  };

  const hasSocialMedia = user.instagram || user.twitter || user.facebook || user.linkedin || user.whatsapp || user.phone;

  return (
    <div className="min-h-screen bg-background-dark">
      <SimpleSidebar onCollapseChange={setSidebarCollapsed} />
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-80'}`}>
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Card Principal do Perfil */}
          <div className="bg-surface-dark rounded-2xl overflow-hidden border border-white/10 mb-6">
            {/* Seção do Avatar e Informações */}
            <div className="bg-gradient-to-br from-primary/20 to-secondary/20 p-8 text-center">
              <div className="relative inline-block mb-4">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8962e] flex items-center justify-center shadow-2xl ring-4 ring-primary/30">
                  <span className="text-6xl text-white">👤</span>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-text-primary-dark mb-2">{user.name}</h2>
              <p className="text-text-secondary-dark mb-1">Membro</p>
              <div className="flex items-center justify-center gap-4 text-sm text-text-secondary-dark mb-6">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">call</span>
                  {user.phone || '+55 11 99999-8888'}
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">chat</span>
                  WhatsApp
                </div>
              </div>
              <button 
                onClick={() => navigate('/profile/edit')}
                className="px-8 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium transition-colors shadow-lg"
              >
                Editar Perfil
              </button>
            </div>

            {/* Seção de Redes Sociais */}
            <div className="p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => openSocialMedia('instagram', user.instagram || 'recover')}
                  className="flex flex-col items-center justify-center p-6 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3 group-hover:bg-white/20 transition-colors">
                    <span className="material-symbols-outlined text-2xl text-text-primary-dark">language</span>
                  </div>
                  <span className="text-sm text-text-primary-dark font-medium">Website</span>
                </button>

                <button
                  onClick={() => openSocialMedia('twitter', user.twitter || 'recover')}
                  className="flex flex-col items-center justify-center p-6 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3 group-hover:bg-white/20 transition-colors">
                    <span className="material-symbols-outlined text-2xl text-text-primary-dark">alternate_email</span>
                  </div>
                  <span className="text-sm text-text-primary-dark font-medium">Twitter</span>
                </button>

                <button
                  onClick={() => openSocialMedia('instagram', user.instagram || 'recover')}
                  className="flex flex-col items-center justify-center p-6 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3 group-hover:bg-white/20 transition-colors">
                    <span className="material-symbols-outlined text-2xl text-text-primary-dark">photo_camera</span>
                  </div>
                  <span className="text-sm text-text-primary-dark font-medium">Instagram</span>
                </button>

                <button
                  onClick={() => openSocialMedia('linkedin', user.linkedin || 'recover')}
                  className="flex flex-col items-center justify-center p-6 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3 group-hover:bg-white/20 transition-colors">
                    <span className="material-symbols-outlined text-2xl text-text-primary-dark">work</span>
                  </div>
                  <span className="text-sm text-text-primary-dark font-medium">LinkedIn</span>
                </button>
              </div>
            </div>
          </div>

          {/* Seção de Itens Publicados e Resolvidos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-surface-dark rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-bold text-text-primary-dark mb-4">
                Itens Publicados ({publishedItems.length})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {loading ? (
                  <p className="text-sm text-text-secondary-dark text-center py-8">Carregando...</p>
                ) : publishedItems.length === 0 ? (
                  <p className="text-sm text-text-secondary-dark text-center py-8">Nenhum item publicado ainda</p>
                ) : (
                  publishedItems.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => navigate(`/item/${item.id}`)}
                      className="p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all group"
                    >
                      <div className="flex gap-3">
                        {item.photo_urls && item.photo_urls.length > 0 && (
                          <img 
                            src={item.photo_urls[0]} 
                            alt={item.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-text-primary-dark truncate group-hover:text-primary transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-xs text-text-secondary-dark truncate mt-1">
                            {item.item_type === 'lost' ? '🔍 Perdido' : '✅ Encontrado'}
                          </p>
                          {item.location && (
                            <p className="text-xs text-text-secondary-dark truncate mt-1">
                              📍 {item.location}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-surface-dark rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-bold text-text-primary-dark mb-4">
                Itens Resolvidos ({resolvedItems.length})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {loading ? (
                  <p className="text-sm text-text-secondary-dark text-center py-8">Carregando...</p>
                ) : resolvedItems.length === 0 ? (
                  <p className="text-sm text-text-secondary-dark text-center py-8">Nenhum item resolvido ainda</p>
                ) : (
                  resolvedItems.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => navigate(`/item/${item.id}`)}
                      className="p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all group"
                    >
                      <div className="flex gap-3">
                        {item.photo_urls && item.photo_urls.length > 0 && (
                          <img 
                            src={item.photo_urls[0]} 
                            alt={item.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-text-primary-dark truncate group-hover:text-primary transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-xs text-green-400 truncate mt-1">
                            ✨ Resolvido
                          </p>
                          {item.location && (
                            <p className="text-xs text-text-secondary-dark truncate mt-1">
                              📍 {item.location}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}