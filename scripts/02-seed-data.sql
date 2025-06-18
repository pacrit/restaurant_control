-- Inserir dados iniciais

-- Inserir mesas
INSERT INTO tables (table_number, seats) VALUES
(1, 2), (2, 4), (3, 4), (4, 6), (5, 2), (6, 4), (7, 8), (8, 4), (9, 2), (10, 6)
ON CONFLICT (table_number) DO NOTHING;

-- Inserir categorias do menu
INSERT INTO menu_categories (name, description, display_order) VALUES
('Entradas', 'Pratos para começar bem a refeição', 1),
('Pratos Principais', 'Nossos pratos principais deliciosos', 2),
('Sobremesas', 'Doces para finalizar com chave de ouro', 3),
('Bebidas', 'Bebidas refrescantes e saborosas', 4)
ON CONFLICT DO NOTHING;

-- Inserir itens do menu
INSERT INTO menu_items (category_id, name, description, price, preparation_time) VALUES
-- Entradas
(1, 'Bruschetta Italiana', 'Pão italiano tostado com tomate, manjericão e azeite', 18.90, 10),
(1, 'Carpaccio de Salmão', 'Fatias finas de salmão com alcaparras e limão', 32.90, 15),
(1, 'Bolinho de Bacalhau', 'Tradicional bolinho português (6 unidades)', 24.90, 12),

-- Pratos Principais
(2, 'Risotto de Camarão', 'Risotto cremoso com camarões frescos', 48.90, 25),
(2, 'Filé à Parmegiana', 'Filé mignon empanado com molho e queijo', 52.90, 30),
(2, 'Salmão Grelhado', 'Salmão grelhado com legumes e arroz', 45.90, 20),
(2, 'Massa à Carbonara', 'Espaguete com bacon, ovos e queijo parmesão', 38.90, 18),

-- Sobremesas
(3, 'Tiramisu', 'Clássica sobremesa italiana', 16.90, 5),
(3, 'Petit Gateau', 'Bolinho de chocolate com sorvete', 19.90, 8),
(3, 'Cheesecake de Frutas Vermelhas', 'Cheesecake cremoso com calda', 18.90, 5),

-- Bebidas
(4, 'Água Mineral', 'Água mineral sem gás 500ml', 4.90, 2),
(4, 'Refrigerante', 'Coca-Cola, Guaraná ou Sprite', 8.90, 2),
(4, 'Suco Natural', 'Laranja, limão ou maracujá', 12.90, 5),
(4, 'Vinho Tinto', 'Taça de vinho tinto selecionado', 18.90, 3)
ON CONFLICT DO NOTHING;
