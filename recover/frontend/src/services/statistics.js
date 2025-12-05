// Serviço para buscar estatísticas de itens resolvidos
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function getResolvedStatistics() {
  try {
    const response = await fetch(`${API_URL}/publications/stats/resolved`);
    if (!response.ok) {
      throw new Error('Erro ao buscar estatísticas');
    }
    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return { data: null, error };
  }
}

export async function markItemAsResolved(itemId, token) {
  try {
    const response = await fetch(`${API_URL}/publications/${itemId}/resolve`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erro ao marcar item como resolvido');
    }
    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error('Error marking item as resolved:', error);
    return { data: null, error };
  }
}

export async function getPendingNotificationItems(token) {
  try {
    const response = await fetch(`${API_URL}/publications/pending-notification`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Erro ao buscar itens pendentes');
    }
    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching pending items:', error);
    return { data: null, error };
  }
}
