-- Atualizar função para aceitar duração personalizada
CREATE OR REPLACE FUNCTION generate_table_token(
    p_table_id INTEGER,
    p_duration INTERVAL DEFAULT INTERVAL '4 hours'
) RETURNS TEXT AS $$
DECLARE
    v_token TEXT;
    v_expires_at TIMESTAMP;
BEGIN
    -- Gerar token seguro (32 caracteres)
    v_token := encode(gen_random_bytes(24), 'base64');
    v_token := replace(replace(replace(v_token, '+', ''), '/', ''), '=', '');
    v_token := substring(v_token, 1, 32);
    
    -- Calcular expiração
    v_expires_at := NOW() + p_duration;
    
    -- Atualizar mesa com novo token
    UPDATE tables 
    SET access_token = v_token,
        token_expires_at = v_expires_at,
        last_access = NOW()
    WHERE id = p_table_id;
    
    RETURN v_token;
END;
$$ LANGUAGE plpgsql;
