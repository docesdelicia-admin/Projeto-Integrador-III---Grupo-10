-- Migracao 005: cria a tabela de insumos

CREATE TABLE IF NOT EXISTS insumos (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	nome VARCHAR(160) NOT NULL,
	descricao TEXT,
	unidade_medida VARCHAR(20) NOT NULL,
	criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT uq_insumos_nome UNIQUE (nome)
);

CREATE INDEX IF NOT EXISTS idx_insumos_nome ON insumos (nome);

