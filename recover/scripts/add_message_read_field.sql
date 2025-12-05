-- Adicionar campos de controle de leitura de mensagens
-- Execute este script no SQL Editor do Supabase Dashboard

-- Adicionar coluna 'read' para indicar se a mensagem foi lida
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;

-- Adicionar coluna 'read_at' para timestamp de quando foi lida
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;

-- Criar índice para melhorar performance de queries de mensagens não lidas
CREATE INDEX IF NOT EXISTS idx_messages_receiver_read 
ON messages(receiver_id, read);

-- Comentários nas colunas
COMMENT ON COLUMN messages.read IS 'Indica se a mensagem foi lida pelo destinatário';
COMMENT ON COLUMN messages.read_at IS 'Timestamp de quando a mensagem foi marcada como lida';
