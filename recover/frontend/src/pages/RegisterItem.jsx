import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { registerItem, updateItem } from '../services/items';

export default function RegisterItem() {
  const location = useLocation();
  const navigate = useNavigate();
  const editingItem = location.state?.item || null;

  const [title, setTitle] = useState(editingItem?.title || '');
  const [description, setDescription] = useState(editingItem?.description || '');
  const [category, setCategory] = useState(editingItem?.category || '');
  const [place, setPlace] = useState(editingItem?.location || '');
  const [date, setDate] = useState(editingItem?.date || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    const token = localStorage.getItem('recover_token');
    const item = {
      title,
      description,
      category,
      latitude: null,
      longitude: null,
      date,
      location: place,
    };
    try {
      if (editingItem) {
        await updateItem(editingItem.id, item, token);
        setSuccess('Item atualizado com sucesso!');
        // redirect back to home after update
        navigate('/');
      } else {
        await registerItem(item, token);
        setSuccess('Item registrado com sucesso!');
        setTitle(''); setDescription(''); setCategory(''); setPlace(''); setDate('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-light flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <h2 className="text-2xl font-heading font-bold text-primary mb-4">{editingItem ? 'Editar Item' : 'Registrar Item'}</h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input label="Nome do Item" required value={title} onChange={e => setTitle(e.target.value)} />
          <Input label="Descrição" required value={description} onChange={e => setDescription(e.target.value)} />
          <Input label="Categoria" required value={category} onChange={e => setCategory(e.target.value)} />
          <Input label="Localização" required value={place} onChange={e => setPlace(e.target.value)} />
          <Input label="Data" type="date" required value={date} onChange={e => setDate(e.target.value)} />
          <Button variant="primary" type="submit" disabled={loading}>{loading ? (editingItem ? 'Atualizando...' : 'Registrando...') : (editingItem ? 'Atualizar' : 'Registrar')}</Button>
        </form>
        {error && <div className="mt-2 text-red-600 text-sm text-center">{error}</div>}
        {success && <div className="mt-2 text-green-600 text-sm text-center">{success}</div>}
      </Card>
    </div>
  );
}
