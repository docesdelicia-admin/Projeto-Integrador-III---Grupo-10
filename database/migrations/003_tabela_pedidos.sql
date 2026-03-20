-- Migracao 003: cria a tabela de pedidos

CREATE TABLE IF NOT EXISTS pedidos (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	cliente_id UUID NOT NULL REFERENCES clientes (id) ON UPDATE CASCADE ON DELETE RESTRICT,
	data_pedido TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	data_entrega TIMESTAMPTZ,
	status VARCHAR(20) NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'em_producao', 'entregue')),
	observacoes TEXT,
	criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT chk_pedidos_data_entrega CHECK (data_entrega IS NULL OR data_entrega >= data_pedido)
);

CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id ON pedidos (cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos (status);

