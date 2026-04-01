-- Migracao 007: cria a tabela de produtos e vincula itens_pedido ao produto

CREATE TABLE IF NOT EXISTS produtos (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	nome VARCHAR(160) NOT NULL,
	categoria VARCHAR(120),
	descricao TEXT,
	preco NUMERIC(12, 2) NOT NULL CHECK (preco >= 0),
	fotos TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
	ativo BOOLEAN NOT NULL DEFAULT TRUE,
	criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT uq_produtos_nome UNIQUE (nome)
);

ALTER TABLE IF EXISTS produtos
	ADD COLUMN IF NOT EXISTS categoria VARCHAR(120);

CREATE INDEX IF NOT EXISTS idx_produtos_nome ON produtos (nome);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos (categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos (ativo);

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'fk_itens_pedido_produto'
	) THEN
		ALTER TABLE itens_pedido
			ADD CONSTRAINT fk_itens_pedido_produto
			FOREIGN KEY (produto_id)
			REFERENCES produtos (id)
			ON UPDATE CASCADE
			ON DELETE RESTRICT;
	END IF;
END $$;