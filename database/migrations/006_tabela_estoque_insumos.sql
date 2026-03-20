-- Migracao 006: cria a tabela de estoque de insumos

CREATE TABLE IF NOT EXISTS estoque_insumos (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	insumo_id UUID NOT NULL REFERENCES insumos (id) ON UPDATE CASCADE ON DELETE CASCADE,
	quantidade_disponivel NUMERIC(14, 3) NOT NULL DEFAULT 0 CHECK (quantidade_disponivel >= 0),
	quantidade_minima NUMERIC(14, 3) NOT NULL DEFAULT 0 CHECK (quantidade_minima >= 0),
	ultima_atualizacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT uq_estoque_insumos_insumo UNIQUE (insumo_id)
);

CREATE INDEX IF NOT EXISTS idx_estoque_insumos_insumo_id ON estoque_insumos (insumo_id);

