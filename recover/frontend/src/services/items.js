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

export async function deleteItem(id, token) {
  const response = await fetch(`http://localhost:8000/publications/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Erro ao deletar item');
  }
  return response.json();
}

export async function updateItem(id, item, token) {
  const response = await fetch(`http://localhost:8000/publications/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(item),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Erro ao atualizar item');
  }
  return response.json();
}

export async function analyzeImage(file) {
  const form = new FormData();
  form.append('file', file);
  const response = await fetch('http://localhost:8000/vision/analyze', {
    method: 'POST',
    body: form,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Erro ao analisar imagem');
  }
  return response.json();
}
