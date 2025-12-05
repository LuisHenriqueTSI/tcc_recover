-- Script para adicionar campos de redes sociais à tabela profiles
-- Execute este script no Supabase SQL Editor

-- Adicionar colunas de redes sociais e contato à tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS twitter VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS facebook VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Criar índices para melhor performance em buscas
CREATE INDEX IF NOT EXISTS idx_profiles_instagram ON profiles(instagram);
CREATE INDEX IF NOT EXISTS idx_profiles_twitter ON profiles(twitter);
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp ON profiles(whatsapp);
