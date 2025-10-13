// Serviço para registro de itens
export async function registerItem(item, token) {
  const response = await fetch('http://localhost:8000/publications/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(item),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Erro ao registrar item');
  }
  return response.json();
}
