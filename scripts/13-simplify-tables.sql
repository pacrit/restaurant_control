-- Script para simplificar as tabelas removendo colunas desnecessárias
-- Execute este script para limpar o banco de dados

-- Remover colunas relacionadas a tokens se existirem
DO $$ 
BEGIN
    -- Verificar se a coluna token_hash existe antes de tentar removê-la
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tables' AND column_name = 'token_hash') THEN
        ALTER TABLE tables DROP COLUMN token_hash;
    END IF;
    
    -- Verificar se a coluna token_expires_at existe antes de tentar removê-la
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tables' AND column_name = 'token_expires_at') THEN
        ALTER TABLE tables DROP COLUMN token_expires_at;
    END IF;
    
    -- Verificar se a coluna access_token existe antes de tentar removê-la
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tables' AND column_name = 'access_token') THEN
        ALTER TABLE tables DROP COLUMN access_token;
    END IF;
    
    -- Verificar se a coluna last_access existe antes de tentar removê-la
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tables' AND column_name = 'last_access') THEN
        ALTER TABLE tables DROP COLUMN last_access;
    END IF;
END $$;

-- Remover função de geração de tokens se existir
DROP FUNCTION IF EXISTS generate_table_token(INTEGER, INTERVAL);

-- Limpar dados de teste antigos e resetar status das mesas
UPDATE tables SET status = 'available', updated_at = NOW();

-- Manter apenas as colunas essenciais
-- id, table_number, status, seats, created_at, updated_at

-- Comentário: Sistema simplificado sem tokens de segurança
-- Acesso direto via tablet para facilitar uso

-- Verificar estrutura final das tabelas
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('tables', 'orders', 'order_items', 'menu_categories', 'menu_items', 'waiter_calls', 'payments')
ORDER BY table_name, ordinal_position;

-- Mostrar status atual das mesas
SELECT id, table_number, seats, status, updated_at FROM tables ORDER BY table_number;
