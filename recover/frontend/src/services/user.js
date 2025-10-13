// Serviço para obter dados do usuário autenticado
export async function getUser(token) {
  const response = await fetch('http://localhost:8000/auth/me', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Não foi possível obter os dados do usuário');
  }
  return response.json();
}
