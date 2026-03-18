# API - Backend (Node.js + Vercel Functions)

Esta pasta contem o backend do projeto, usando funcoes serverless da Vercel.

## Estrutura atual

```text
api/
|- _lib/
|  |- auth.ts      # JWT, autenticacao, autorizacao
|  |- db.ts        # connection pool PostgreSQL
|  |- password.ts  # bcryptjs utilities
|  |- types.ts     # TypeScript interfaces
|- auth/
|  |- login.ts     # POST /api/auth/login
|  |- me.ts        # GET /api/auth/me
|- usuarios/
|  |- index.ts     # GET /api/usuarios (lista)
|  |- [id].ts      # GET /api/usuarios/:id (buscar)
|  |- criar.ts     # POST /api/usuarios/criar
|  |- editar/
|  |  |- [id].ts   # PUT /api/usuarios/editar/:id
|  |- deletar/
|  |  |- [id].ts   # DELETE /api/usuarios/deletar/:id
|- clientes/
|  |- index.ts     # /api/clientes (protegido)
|- package.json
|- tsconfig.json
```

## Como validar localmente

```bash
# instalar dependencias da API
npm install --prefix api

# validar tipos TypeScript
npx tsc --noEmit -p api/tsconfig.json
```

## Variaveis de ambiente (Neon)

Use o arquivo `api/.env.development` para desenvolvimento local (ignorado no Git por segurança).

Variaveis obrigatorias:

- `DATABASE_URL` (connection string do Neon com `sslmode=require`)
- `JWT_SECRET`

Variaveis opcionais de pool:

- `DB_POOL_MAX` (padrao: `10`)
- `DB_IDLE_TIMEOUT_MS` (padrao: `30000`)
- `DB_CONNECT_TIMEOUT_MS` (padrao: `10000`)
- `JWT_EXPIRES_IN` (padrao: `8h`)
- `BCRYPT_SALT_ROUNDS` (padrao: `12`)

## Rotas de autenticacao

- `POST /api/auth/login` -> retorna token JWT Bearer
- `GET /api/auth/me` -> valida token e retorna dados do usuario logado

## Rotas de usuarios

### Listagem (requer admin)

- `GET /api/usuarios` -> lista todos os usuarios (requer autenticacao + admin)

### Criar (requer admin)

- `POST /api/usuarios/criar` -> cria um novo usuario (requer autenticacao + admin)

### Buscar (requer autenticacao)

- `GET /api/usuarios/:id` -> busca um usuario por ID
  - Admin pode buscar qualquer usuario
  - Operador pode buscar apenas a si mesmo

### Editar (requer autenticacao)

- `PUT /api/usuarios/editar/:id` -> edita dados de um usuario
  - Admin pode editar qualquer usuario (todos os campos)
  - Operador pode editar apenas a si mesmo (exceto tipo_usuario)

### Deletar (requer admin)

- `DELETE /api/usuarios/deletar/:id` -> exclui um usuario (requer autenticacao + admin)

## Observacao de acesso publico

- Atualmente, todas as rotas de negocio exigem autenticacao JWT.
- A unica rota publica da API continua sendo `POST /api/auth/login` por necessidade tecnica (obter token).
- A visualizacao publica de produtos sera adicionada futuramente em rota especifica de produtos.

## Execucao local integrada (frontend + api)

Use o comando abaixo na raiz do repositorio para rodar o ambiente local da Vercel:

```bash
vercel dev
```

As rotas da API ficam disponiveis em /api/*.
