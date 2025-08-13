-- Atualizar constraint de status dos pedidos para incluir novos status
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'cancelled', 'awaiting_payment', 'paid'));

-- Atualizar constraint de status das mesas
ALTER TABLE tables DROP CONSTRAINT IF EXISTS tables_status_check;
ALTER TABLE tables ADD CONSTRAINT tables_status_check 
CHECK (status IN ('available', 'occupied', 'reserved', 'needs_attention', 'awaiting_payment'));

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_orders_status_table ON orders(status, table_id);
CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status);
