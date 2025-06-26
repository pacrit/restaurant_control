-- Inserir alguns pedidos de teste para demonstrar o sistema

-- Pedido 1 - Mesa 1 (Entregue)
INSERT INTO orders (table_id, status, total_amount, notes, created_at, updated_at) VALUES
(1, 'delivered', 67.80, 'Sem cebola no risotto', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour');

-- Itens do Pedido 1
INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, notes) VALUES
(1, 4, 1, 48.90, 'Sem cebola'),  -- Risotto de Camarão
(1, 12, 2, 8.90, NULL),          -- Refrigerante
(1, 8, 1, 16.90, NULL);          -- Tiramisu

-- Pedido 2 - Mesa 2 (Preparando)
INSERT INTO orders (table_id, status, total_amount, notes, created_at, updated_at) VALUES
(2, 'preparing', 91.80, NULL, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '15 minutes');

-- Itens do Pedido 2
INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, notes) VALUES
(2, 5, 1, 52.90, 'Ponto da carne bem passado'), -- Filé à Parmegiana
(2, 7, 1, 38.90, NULL),          -- Massa à Carbonara
(2, 11, 2, 4.90, NULL);          -- Água Mineral

-- Pedido 3 - Mesa 3 (Pronto)
INSERT INTO orders (table_id, status, total_amount, notes, created_at, updated_at) VALUES
(3, 'ready', 45.90, NULL, NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '5 minutes');

-- Itens do Pedido 3
INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, notes) VALUES
(3, 6, 1, 45.90, 'Legumes no vapor'); -- Salmão Grelhado

-- Pedido 4 - Mesa 1 (Pendente) - Novo pedido da mesa 1
INSERT INTO orders (table_id, status, total_amount, notes, created_at, updated_at) VALUES
(1, 'pending', 43.70, 'Mesa próxima à janela', NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '10 minutes');

-- Itens do Pedido 4
INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, notes) VALUES
(4, 1, 2, 18.90, NULL),          -- Bruschetta Italiana
(4, 13, 1, 12.90, 'Suco de laranja'), -- Suco Natural
(4, 9, 1, 19.90, 'Sorvete à parte');  -- Petit Gateau

-- Pedido 5 - Mesa 4 (Entregue) - Ontem
INSERT INTO orders (table_id, status, total_amount, notes, created_at, updated_at) VALUES
(4, 'delivered', 156.60, 'Aniversário - mesa decorada', NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours');

-- Itens do Pedido 5
INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, notes) VALUES
(5, 2, 1, 32.90, NULL),          -- Carpaccio de Salmão
(5, 4, 2, 48.90, NULL),          -- Risotto de Camarão
(5, 8, 2, 16.90, NULL),          -- Tiramisu
(5, 14, 2, 18.90, NULL);         -- Vinho Tinto
