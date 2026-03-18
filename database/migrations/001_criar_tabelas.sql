-- Migracao 001: criacao da tabela de usuarios

CREATE TABLE IF NOT EXISTS usuarios (
	id BIGSERIAL PRIMARY KEY,
	nome VARCHAR(150) NOT NULL,
	email VARCHAR(255) NOT NULL UNIQUE,
	senha TEXT NOT NULL,
	tipo_usuario VARCHAR(20) NOT NULL CHECK (tipo_usuario IN ('admin', 'operador')),
	criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios (email);
