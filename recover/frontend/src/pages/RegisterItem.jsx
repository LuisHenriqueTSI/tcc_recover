
import { useState } from 'react';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { registerItem } from '../services/items';

export default function RegisterItem() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
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
      location,
    };
    try {
      await registerItem(item, token);
      setSuccess('Item registrado com sucesso!');
      setTitle(''); setDescription(''); setCategory(''); setLocation(''); setDate('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-light flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <h2 className="text-2xl font-heading font-bold text-primary mb-4">Registrar Item</h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input label="Nome do Item" required value={title} onChange={e => setTitle(e.target.value)} />
          <Input label="Descrição" required value={description} onChange={e => setDescription(e.target.value)} />
          <Input label="Categoria" required value={category} onChange={e => setCategory(e.target.value)} />
          <Input label="Localização" required value={location} onChange={e => setLocation(e.target.value)} />
          <Input label="Data" type="date" required value={date} onChange={e => setDate(e.target.value)} />
          {/* Foto: implementar upload real depois */}
          <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Registrando...' : 'Registrar'}</Button>
        </form>
        {error && <div className="mt-2 text-red-600 text-sm text-center">{error}</div>}
        {success && <div className="mt-2 text-green-600 text-sm text-center">{success}</div>}
      </Card>
    </div>
  );
}
