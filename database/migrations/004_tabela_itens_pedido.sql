-- Migracao 004: cria a tabela de itens de pedido

CREATE TABLE IF NOT EXISTS itens_pedido (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	pedido_id UUID NOT NULL REFERENCES pedidos (id) ON UPDATE CASCADE ON DELETE CASCADE,
	produto_id UUID NOT NULL,
	quantidade NUMERIC(12, 3) NOT NULL CHECK (quantidade > 0),
	preco_unitario NUMERIC(12, 2) NOT NULL CHECK (preco_unitario >= 0),
	criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT uq_itens_pedido_item UNIQUE (pedido_id, produto_id)
);

CREATE INDEX IF NOT EXISTS idx_itens_pedido_pedido_id ON itens_pedido (pedido_id);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_produto_id ON itens_pedido (produto_id);

