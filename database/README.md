# Database — Banco de Dados

Esta pasta contém todos os arquivos relacionados ao banco de dados do projeto.

## Conteúdo esperado

- **Scripts SQL** — scripts de criação e configuração das tabelas e demais objetos do banco.
- **Migrations** — arquivos de migração para versionamento do esquema do banco de dados.
- **Seeds** — dados iniciais (fixtures) para popular o banco em ambiente de desenvolvimento e testes.
- **Configurações** — arquivos de configuração de conexão e variáveis de ambiente relacionadas ao banco.

## Estrutura sugerida

```
database/
├── migrations/       # Scripts de migração (versionados)
├── seeds/            # Dados iniciais para desenvolvimento/testes
├── scripts/          # Scripts SQL utilitários (backup, limpeza, etc.)
└── config/           # Configurações de conexão com o banco
```

## Tecnologias

O banco de dados utilizado será definido pela equipe. Exemplos comuns: **PostgreSQL**, **MySQL** ou **SQLite**.
