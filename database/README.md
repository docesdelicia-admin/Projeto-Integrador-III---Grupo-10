# Database - Banco de Dados

Esta pasta guarda as migrations SQL versionadas do projeto.

## Versionamento do banco

O banco usa dois niveis de versionamento:

1. Versionamento estrutural por migration SQL (`NNN_nome.sql`)
2. Versionamento de release do produto por tags Git (ex.: `v1.0.0-rc.0`)

Regra: toda mudanca de schema relevante para release deve estar registrada em migration e no [CHANGELOG.md](../CHANGELOG.md).

## Estrutura atual

```
database/
|- migrations/
|  |- 001_tabela_usuarios.sql
|  |- 002_tabela_clientes.sql
|  |- 003_tabela_pedidos.sql
|  |- 004_tabela_itens_pedido.sql
|  |- 005_tabela_insumos.sql
|  |- 006_tabela_estoque_insumos.sql
|  |- 007_tabela_produtos.sql
|- scripts/
|  |- db-migrate-all.mjs
|  |- db-run-sql.mjs
|  |- db-upsert-base-user.mjs
|  |- db-populate-dev-products.mjs
|- README.md
```

## Objetivo

Facilitar criacao e alteracao de tabelas em Development e Production com os mesmos comandos.

## Fluxo recomendado

1. Criar uma nova migration em `database/migrations` com prefixo numerico.
2. Rodar `db:migrate:dev` para aplicar todas as migrations pendentes no Development.
3. Validar no ambiente de desenvolvimento.
4. Rodar `db:migrate:prod` para aplicar as mesmas migrations pendentes no Production.

Exemplo de nome de migration:

- `002_adicionar_coluna_telefone_usuarios.sql`

## Comandos

A partir da raiz do repositorio:

```bash
npm install --prefix api

# Aplica pendencias em Development
npm run db:migrate:dev --prefix api

# Aplica pendencias em Production
npm run db:migrate:prod --prefix api

# Cria/atualiza usuario base por email
npm run db:user:dev --prefix api -- --email "email-oficial@seudominio.com" --password "SENHA_FORTE_DEV"
npm run db:user:prod --prefix api -- --email "email-oficial@seudominio.com" --password "SENHA_FORTE_PROD"
```

## Como funciona internamente

- O script de migration aplica apenas arquivos pendentes que seguem o padrao `NNN_nome.sql`.
- O historico de execucao fica salvo na tabela `schema_migrations`.
- O script utilitario `db:run-sql` continua disponivel para executar um arquivo SQL especifico.

## Scripts de suporte

- `database/scripts/db-migrate-all.mjs`
- `database/scripts/db-run-sql.mjs`
- `database/scripts/db-upsert-base-user.mjs`
- `database/scripts/db-populate-dev-products.mjs`

## Carga inicial de produtos no desenvolvimento

O script abaixo insere ou atualiza o primeiro produto de cada categoria no banco de desenvolvimento, mantendo as fotos vazias por enquanto:

```bash
npm run db:populate:dev-products --prefix database
```

Por padrao, ele usa o arquivo `.env.development` na raiz do repositório.

## Estrutura inicial das tabelas

### usuarios

Responsavel por armazenar os usuarios que terao acesso ao sistema.

- id (PK)
- nome
- email
- senha_hash
- tipo_usuario (admin / operador)
- criado_em

### clientes

Tabela opcional no MVP, utilizada para registrar clientes e facilitar controle de pedidos ou acoes futuras de marketing.

- id (PK)
- nome
- telefone
- observacoes
- criado_em

### produtos

Armazena os produtos disponiveis para venda (ex: bolo no pote, brigadeiro, torta, etc.).

- id (PK)
- nome
- descricao
- preco
- fotos
- ativo
- criado_em

### insumos

Tabela responsavel por armazenar os ingredientes ou materiais utilizados na producao dos produtos.

Exemplos de insumos: farinha, leite condensado, chocolate, embalagens, acucar, ovos.

- id (PK)
- nome
- descricao
- unidade_medida (kg, g, unidade, ml, etc)
- criado_em

### estoque_insumos

Tabela responsavel por controlar a quantidade disponivel de cada insumo.

- id (PK)
- insumo_id (FK insumos)
- quantidade_disponivel
- quantidade_minima
- ultima_atualizacao

Essa tabela permite acompanhar o estoque de ingredientes utilizados na producao.

### pedidos

Registra cada pedido realizado.

- id (PK)
- cliente_id (FK clientes)
- data_pedido
- data_entrega
- status (novo / em_producao / entregue)
- observacoes
- criado_em

### itens_pedido

Relaciona os produtos dentro de um pedido.

- id (PK)
- pedido_id (FK pedidos)
- produto_id (FK produtos)
- quantidade
- preco_unitario

Obs:

- PK (Primary Key) - chave primaria
- FK (Foreign Key) - chave estrangeira

## Relacionamentos

- clientes -> pedidos
- pedidos -> itens_pedido
- produtos -> itens_pedido
- insumos -> estoque_insumos

## Referencias

- Guia de versionamento: [docs/versionamento.md](../docs/versionamento.md)
- Changelog do projeto: [CHANGELOG.md](../CHANGELOG.md)
