import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { registerItem, updateItem, analyzeImage } from '../services/items';

export default function RegisterItem() {
  const location = useLocation();
  const navigate = useNavigate();
  const editingItem = location.state?.item || null;

  const [title, setTitle] = useState(editingItem?.title || '');
  const [description, setDescription] = useState(editingItem?.description || '');
  const [category, setCategory] = useState(editingItem?.category || '');
  const [place, setPlace] = useState(editingItem?.location || '');
  const [status, setStatus] = useState(editingItem?.status || 'lost');
  const [date, setDate] = useState(editingItem?.date || '');
  const [imageFile, setImageFile] = useState(null);
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
      status,
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
          <div>
            <label className="block text-sm font-medium text-neutral-dark">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="mt-1 block w-full rounded border p-2">
              <option value="lost">Perdido</option>
              <option value="found">Encontrado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-dark">Imagem (opcional)</label>
            <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="mt-1" />
            <div className="mt-2">
              <button type="button" onClick={async () => {
                if (!imageFile) return setError('Selecione uma imagem primeiro');
                try {
                  setError('');
                  const analysis = await analyzeImage(imageFile);
                  if (analysis.title) setTitle(analysis.title);
                  if (analysis.description) setDescription(analysis.description);
                  if (analysis.category) setCategory(analysis.category);
                  if (analysis.status) setStatus(analysis.status);
                  if (analysis.attributes && analysis.attributes.color) {
                    setDescription(prev => (prev ? prev + '\n' : '') + 'Cores: ' + analysis.attributes.color.join(', '));
                  }
                } catch (err) {
                  setError(err.message || 'Erro na análise');
                }
              }} className="text-sm text-primary hover:underline">Analisar imagem (Gemini)</button>
            </div>
          </div>
          <Input label="Data" type="date" required value={date} onChange={e => setDate(e.target.value)} />
          <Button variant="primary" type="submit" disabled={loading}>{loading ? (editingItem ? 'Atualizando...' : 'Registrando...') : (editingItem ? 'Atualizar' : 'Registrar')}</Button>
        </form>
        {error && <div className="mt-2 text-red-600 text-sm text-center">{error}</div>}
        {success && <div className="mt-2 text-green-600 text-sm text-center">{success}</div>}
      </Card>
    </div>
  );
}
