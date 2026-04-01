# API - Backend (Node.js + Vercel Functions)

Esta pasta contem o backend do projeto, usando funcoes serverless da Vercel.

## Versao da API

- Versao atual do pacote: `1.0.0-rc.0` (ver `api/package.json`)
- Versionamento de release do produto: tags no repositorio raiz (ex.: `v1.0.0-rc.0`)

Antes de release, registre mudancas de API em [CHANGELOG.md](../CHANGELOG.md).

## Estrutura atual

```text
api/
|- _lib/
|  |- auth.ts      # JWT, autenticacao, autorizacao
|  |- db.ts        # connection pool PostgreSQL
|  |- password.ts  # bcryptjs utilities
|  |- types.ts     # TypeScript interfaces
|- auth/
|  |- index.ts     # /api/auth (POST login, GET sessao)
|- clientes/
|  |- index.ts     # /api/clientes (GET protegido)
|- insumos/
|  |- index.ts     # /api/insumos (GET)
|- estoque_insumos/
|  |- index.ts     # /api/estoque_insumos (GET)
|- pedidos/
|  |- index.ts     # /api/pedidos (GET)
|- produtos/
|  |- index.ts     # /api/produtos (GET)
|- usuarios/
|  |- index.ts     # /api/usuarios (GET, POST, PUT, DELETE)
|- tests/
|  |- *.test.ts    # testes de suporte
|- package.json
|- tsconfig.json
```

## Rotas principais

- `POST /api/auth`: autentica usuario (login)
- `GET /api/auth`: valida token e retorna sessao
- `GET /api/usuarios`: lista usuarios (admin)
- `POST /api/usuarios`: cria usuario (admin)
- `PUT /api/usuarios?id=<id>`: edita usuario; autoedicao exige `senha_atual`
- `DELETE /api/usuarios?id=<id>`: remove usuario (admin)
- `GET /api/clientes`: lista clientes (autenticado)
- `POST /api/clientes`: cria cliente (admin)
- `PUT /api/clientes?id=<id>`: edita cliente (autenticado)
- `DELETE /api/clientes?id=<id>`: deleta cliente (admin)
- `GET /api/insumos`: lista insumos (autenticado)
- `POST /api/insumos`: cria insumo (admin)
- `PUT /api/insumos?id=<id>`: edita insumo (autenticado)
- `DELETE /api/insumos?id=<id>`: deleta insumo (admin)
- `GET /api/estoque_insumos`: lista estoque (autenticado)
- `GET /api/pedidos`: lista pedidos (autenticado)
- `POST /api/pedidos`: cria pedido (autenticado)
- `PUT /api/pedidos?id=<id>`: edita pedido (autenticado)
- `DELETE /api/pedidos?id=<id>`: deleta pedido (admin)
- `GET /api/produtos`: lista produtos (autenticado)
- `POST /api/produtos`: cria produto (admin)
- `PUT /api/produtos?id=<id>`: edita produto (autenticado)
- `DELETE /api/produtos?id=<id>`: deleta produto (admin)

## JWT e sessao

- O token JWT usa o claim padrao `sub` para identificar o usuario.
- O payload de sessao retornado pela API expõe `id`, `nome`, `email` e `tipo_usuario`.
- O campo `sub` permanece interno ao token e nao e retornado no objeto de sessao.

## Controle de Acesso (RBAC)

### Admin (tipo_usuario = "admin")
- ✅ Criar, editar e **excluir** r usuários
- ✅ Criar, editar e **excluir** produtos
- ✅ Criar, editar e **excluir** insumos
- ✅ Criar, editar e **excluir** clientes
- ✅ Criar, editar e **excluir** pedidos
- ✅ Listar/consultar todas as rotas

### Operador (tipo_usuario = "operador")
- ❌ Não pode criar, editar ou excluir usuários
- ✅ Criar e editar produtos (mas não pode excluir → 403)
- ✅ Criar e editar insumos (mas não pode excluir → 403)
- ✅ Criar e editar clientes (mas não pode excluir → 403)
- ✅ Criar e editar pedidos (alterando status para `cancelado` para "deletar", mas não pode deletar → 403)
- ✅ Consultar/listar todas as rotas
- ❌ Não pode acessar dados de outro usuário em GET /api/usuarios/:id

### Respostas de Autorização

| Cenário | Status | Resposta |
|---------|--------|----------|
| Sem token | 401 | `{"erro": "Token nao enviado."}` |
| Token inválido | 401 | `{"erro": "Token invalido ou expirado."}` |
| Operador tenta deletar (produtos/insumos/clientes) | 403 | `{"erro": "Apenas administradores podem deletar dados."}` |
| Operador tenta deletar pedido | 403 | `{"erro": "Apenas administradores podem deletar pedidos."}` |
| Operador tenta editar outro usuário | 403 | `{"erro": "Acesso Restrito a Administradores."}` |
| Método não suportado | 405 | `{"erro": "Metodo nao permitido"}` |

## Como validar localmente

```bash
# instalar dependencias da API
npm install --prefix api

# validar tipos TypeScript
npx tsc --noEmit -p api/tsconfig.json
```

## Comandos de banco (migrations)

Comandos executados a partir da raiz do repositorio:

```bash
# aplica migrations pendentes em Development
npm run db:migrate:dev --prefix api

# aplica migrations pendentes em Production
npm run db:migrate:prod --prefix api

# cria/atualiza usuario base em Development
npm run db:user:dev --prefix api -- --email "admin@example.com" --password "SENHA_FORTE"

# cria/atualiza usuario base em Production
npm run db:user:prod --prefix api -- --email "admin@example.com" --password "SENHA_FORTE"
```

### Troubleshooting de Migrations

Se ao rodar `npm run db:migrate:dev` você receber erro `DATABASE_URL not defined`:

1. Certifique-se que possui arquivo `.env.development` na raiz do repositorio
2. Arquivo deve conter: `DATABASE_URL=postgresql://user:password@host:port/database`
3. Tente novamente: `npm run db:migrate:dev --prefix api`

Observacao: Para criar novas tabelas/colunas, adicione um novo arquivo SQL em `database/migrations/` com prefixo numerico (exemplo: `008_nova_tabela.sql`) e rode `npm run db:migrate:dev --prefix api`.

## Execucao local integrada (frontend + api)

Use o comando abaixo na raiz do repositorio para rodar o ambiente local da Vercel:

```bash
vercel dev
```

As rotas da API ficam disponiveis em /api/*.

## Referencias

- Guia de versionamento: [docs/versionamento.md](../docs/versionamento.md)
- Changelog do projeto: [CHANGELOG.md](../CHANGELOG.md)
