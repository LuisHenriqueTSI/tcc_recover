-- Adiciona campo para rastrear se o item foi devolvido/resolvido
ALTER TABLE items
ADD COLUMN resolved BOOLEAN DEFAULT FALSE,
ADD COLUMN resolved_at TIMESTAMP;

-- Cria índice para melhorar performance das consultas de estatísticas
CREATE INDEX idx_items_resolved ON items(resolved);
CREATE INDEX idx_items_category_resolved ON items(category, resolved);

-- Comentários explicativos
COMMENT ON COLUMN items.resolved IS 'Indica se o item foi devolvido ao dono ou o problema foi resolvido';
COMMENT ON COLUMN items.resolved_at IS 'Data e hora em que o item foi marcado como resolvido';
