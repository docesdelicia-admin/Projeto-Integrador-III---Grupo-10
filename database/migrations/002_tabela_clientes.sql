-- Migracao 002: cria a tabela de clientes

CREATE TABLE IF NOT EXISTS clientes (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	nome VARCHAR(160) NOT NULL,
	telefone VARCHAR(30),
	observacoes TEXT,
	criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes (nome);

