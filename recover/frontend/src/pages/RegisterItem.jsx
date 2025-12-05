import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import CancelButton from '../components/CancelButton';
import ShareButton from '../components/ShareButton';
import { registerItem, updateItem, analyzeImage, saveItemPhoto } from '../services/items';
import { supabase } from '../supabaseClient';

const ITEM_TYPES = {
  animal: {
    label: 'Animal',
    singular: 'animal',
    icon: '🐾',
    fields: {
      breed: 'Raça',
      color: 'Cor',
      distinguishing_features: 'Características Distintas',
    },
  },
  document: {
    label: 'Documento',
    singular: 'documento',
    icon: '📄',
    fields: {
      document_type: 'Tipo de Documento',
      owner_name: 'Nome do Proprietário',
      document_number: 'Número do Documento',
    },
  },
  object: {
    label: 'Objeto',
    singular: 'objeto',
    icon: '📦',
    fields: {
      brand: 'Marca',
      model: 'Modelo',
      color: 'Cor',
    },
  },
  electronics: {
    label: 'Eletrônico',
    singular: 'eletrônico',
    icon: '📱',
    fields: {
      brand: 'Marca',
      model: 'Modelo',
      color: 'Cor',
      serial_number: 'Número de Série',
    },
  },
  jewelry: {
    label: 'Joia/Acessório',
    singular: 'joia',
    icon: '💍',
    fields: {
      material: 'Material',
      color: 'Cor',
      distinguishing_marks: 'Marcas Distintivas',
    },
  },
  clothing: {
    label: 'Roupa',
    singular: 'roupa',
    icon: '👕',
    fields: {
      size: 'Tamanho',
      color: 'Cor',
      brand: 'Marca',
    },
  },
};

const FIELD_LABELS = {
  breed: 'Raça',
  color: 'Cor',
  distinguishing_features: 'Características Distintas',
  document_type: 'Tipo de Documento',
  owner_name: 'Nome do Proprietário',
  document_number: 'Número do Documento',
  brand: 'Marca',
  model: 'Modelo',
  serial_number: 'Número de Série',
  material: 'Material',
  distinguishing_marks: 'Marcas Distintivas',
  size: 'Tamanho',
};

export default function RegisterItem() {
  const location = useLocation();
  const navigate = useNavigate();
  const editingItem = location.state?.item || null;

  // Primeiro step: selecionar tipo de item
  const [itemType, setItemType] = useState(editingItem?.item_type || null);

  // Form fields
  const [title, setTitle] = useState(editingItem?.title || '');
  const [description, setDescription] = useState(editingItem?.description || '');
  const [category, setCategory] = useState(editingItem?.category || '');
  const [place, setPlace] = useState(editingItem?.location || '');
  const [status, setStatus] = useState(editingItem?.status || 'lost');
  const [date, setDate] = useState(editingItem?.date ? editingItem.date.split('T')[0] : '');
  const [imageFile, setImageFile] = useState(null);

  // Extra fields based on item type
  const [extraFields, setExtraFields] = useState(editingItem?.extra_fields || {});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createdItem, setCreatedItem] = useState(null);

  // Se editando, pula direto para o tipo (sem permitir mudar)
  const showTypeSelection = !editingItem && !itemType;

  function handleSelectType(type) {
    setItemType(type);
    setError('');
  }

  function handleChangeExtraField(fieldName, value) {
    setExtraFields(prev => ({ ...prev, [fieldName]: value }));
  }

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
      status,
      item_type: itemType,
      extra_fields: extraFields,
    };
    if (place && place !== '') item.location = place;
    if (date && date !== '') {
      item.date = `${date}T00:00:00Z`;
    }

    try {
      if (editingItem) {
        await updateItem(editingItem.id, item, token);
        setSuccess('Alterado com sucesso!');
        navigate('/home');
      } else {
        const created = await registerItem(item, token);
        setCreatedItem(created);
        if (imageFile && created && created.id) {
          const form = new FormData();
          form.append('file', imageFile);
          const resp = await fetch(`http://localhost:8000/photos/upload-and-save/${created.id}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: form,
          });
          if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            throw new Error(err.detail || 'Erro ao enviar imagem para o servidor');
          }
        }
        setSuccess('Registrado com sucesso! Compartilhe agora...');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (showTypeSelection) {
    return (
      <div className="min-h-screen bg-neutral-light flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <h2 className="text-2xl font-heading font-bold text-primary mb-6 text-center">Que tipo de item você quer registrar?</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 gap-4">
            {Object.entries(ITEM_TYPES).map(([key, type]) => (
              <button
                key={key}
                onClick={() => handleSelectType(key)}
                className="p-4 border-2 border-neutral-light rounded-lg hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center gap-2 text-center"
              >
                <span className="text-3xl">{type.icon}</span>
                <span className="text-sm font-semibold text-neutral-dark">{type.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-6">
            <CancelButton />
          </div>
        </Card>
      </div>
    );
  }

  const currentType = ITEM_TYPES[itemType];
  const typeLabel = currentType?.label || 'Item';
  const singularLabel = currentType?.singular || 'item';

  return (
    <div className="min-h-screen bg-neutral-light flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-2xl font-heading font-bold text-primary">
            {editingItem ? `Editar ${typeLabel}` : `Registrar ${typeLabel}`}
          </h2>
          <span className="text-2xl">{currentType?.icon}</span>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input label={`Nome do ${typeLabel}`} required value={title} onChange={e => setTitle(e.target.value)} />
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

          <Input
            label="Data (dd/mm/aaaa)"
            type="date"
            required
            value={date}
            onChange={e => setDate(e.target.value)}
          />

          {/* Extra fields based on item type */}
          {currentType?.fields && Object.keys(currentType.fields).length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-neutral-dark mb-3">Informações adicionais</h3>
              {Object.entries(currentType.fields).map(([fieldKey, fieldLabel]) => (
                <Input
                  key={fieldKey}
                  label={fieldLabel}
                  value={extraFields[fieldKey] || ''}
                  onChange={e => handleChangeExtraField(fieldKey, e.target.value)}
                  placeholder={`Digite a ${fieldLabel.toLowerCase()}`}
                />
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-dark">Foto (opcional)</label>
            <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="mt-1" />
            <div className="mt-2">
              <button
                type="button"
                onClick={async () => {
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
                }}
                className="text-sm text-primary hover:underline"
              >
                Analisar foto (Gemini)
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (editingItem ? 'Atualizar' : 'Registrar')}
            </Button>
            <CancelButton />
          </div>
        </form>
        {error && <div className="mt-2 text-red-600 text-sm text-center">{error}</div>}
        {success && !createdItem && <div className="mt-2 text-green-600 text-sm text-center">{success}</div>}
        
        {/* Sucesso com compartilhamento */}
        {success && createdItem && (
          <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl">✅</span>
              <div>
                <div className="text-green-700 font-bold text-lg">Item Registrado com Sucesso!</div>
                <div className="text-sm text-green-600">Compartilhe agora e maximize suas chances de encontrar!</div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg mb-4 border border-green-200">
              <div className="text-sm font-semibold text-neutral-dark mb-2">📋 Seu Item:</div>
              <div className="text-base font-bold text-primary">{createdItem.title}</div>
              <div className="text-xs text-neutral-light mt-1">{createdItem.description}</div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <ShareButton item={createdItem} />
              <Button 
                variant="primary" 
                onClick={() => {
                  setSuccess('');
                  setCreatedItem(null);
                  setTitle('');
                  setDescription('');
                  setCategory('');
                  setPlace('');
                  setStatus('lost');
                  setDate('');
                  setImageFile(null);
                  setExtraFields({});
                  navigate('/home');
                }}
              >
                🏠 Ir para Home
              </Button>
              <button 
                onClick={() => {
                  setSuccess('');
                  setCreatedItem(null);
                  setTitle('');
                  setDescription('');
                  setCategory('');
                  setPlace('');
                  setStatus('lost');
                  setDate('');
                  setImageFile(null);
                  setExtraFields({});
                }}
                className="px-4 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold transition"
              >
                ➕ Registrar Outro Item
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

