// Serviço para obter dados do usuário autenticado
export async function getUser(token) {
  const response = await fetch('http://localhost:8000/auth/me', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    let body = null;
    try {
      body = await response.text();
    } catch (e) {
      body = '<no body>';
    }
    console.debug('[getUser] non-ok response', response.status, body);
    throw new Error('Não foi possível obter os dados do usuário');
  }
  const json = await response.json();
  console.debug('[getUser] profile fetched', json);
  return json;
}
