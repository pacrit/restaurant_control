-- Criar tabela para chamadas de garçom
CREATE TABLE IF NOT EXISTS waiter_calls (
  id SERIAL PRIMARY KEY,
  table_id INTEGER REFERENCES tables(id),
  reason VARCHAR(200) DEFAULT 'Solicitação geral',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'attending', 'resolved')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL
);

-- Atualizar enum de status das mesas para incluir 'needs_attention'
ALTER TABLE tables DROP CONSTRAINT IF EXISTS tables_status_check;
ALTER TABLE tables ADD CONSTRAINT tables_status_check 
CHECK (status IN ('available', 'occupied', 'reserved', 'needs_attention'));

-- Índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_waiter_calls_table_id ON waiter_calls(table_id);
CREATE INDEX IF NOT EXISTS idx_waiter_calls_status ON waiter_calls(status);
