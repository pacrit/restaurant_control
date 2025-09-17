-- Criar tabela para pagamentos
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  table_id INTEGER REFERENCES tables(id),
  order_ids INTEGER[] NOT NULL, -- Array de IDs dos pedidos
  payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'pix', 'card')),
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- Dados específicos do PIX
  pix_key VARCHAR(255), -- Chave PIX do restaurante
  pix_qr_code TEXT, -- QR Code do PIX
  pix_copy_paste TEXT, -- Código copia e cola
  pix_transaction_id VARCHAR(255), -- ID da transação PIX
  pix_end_to_end_id VARCHAR(255), -- ID end-to-end do PIX
  
  -- Dados da API de pagamento (para integração futura)
  external_payment_id VARCHAR(255), -- ID do pagamento na API externa
  webhook_data JSONB, -- Dados recebidos via webhook
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP, -- Expiração do PIX (geralmente 30 minutos)
  paid_at TIMESTAMP -- Quando foi confirmado o pagamento
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_payments_table_id ON payments(table_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_external_id ON payments(external_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_pix_transaction ON payments(pix_transaction_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_payments_updated_at();

-- Função para limpar pagamentos expirados
CREATE OR REPLACE FUNCTION cleanup_expired_payments()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    UPDATE payments 
    SET status = 'cancelled'
    WHERE status = 'pending' 
      AND expires_at < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;
