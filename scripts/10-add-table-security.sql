-- Adicionar sistema de tokens de segurança para mesas
ALTER TABLE tables ADD COLUMN IF NOT EXISTS access_token VARCHAR(255);
ALTER TABLE tables ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP;
ALTER TABLE tables ADD COLUMN IF NOT EXISTS last_access TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_tables_access_token ON tables(access_token);
CREATE INDEX IF NOT EXISTS idx_tables_token_expires ON tables(token_expires_at);

-- Função para gerar token seguro
CREATE OR REPLACE FUNCTION generate_table_token(table_id INTEGER)
RETURNS VARCHAR(255) AS $$
DECLARE
    token VARCHAR(255);
BEGIN
    -- Gerar token único baseado em timestamp + table_id + random
    token := encode(digest(CURRENT_TIMESTAMP::text || table_id::text || random()::text, 'sha256'), 'hex');
    
    -- Atualizar mesa com novo token (válido por 4 horas)
    UPDATE tables 
    SET access_token = token,
        token_expires_at = CURRENT_TIMESTAMP + INTERVAL '4 hours',
        last_access = CURRENT_TIMESTAMP
    WHERE id = table_id;
    
    RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Limpar tokens expirados (executar periodicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    UPDATE tables 
    SET access_token = NULL,
        token_expires_at = NULL
    WHERE token_expires_at < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;
