# Doces Delicia

Aplicacao web desenvolvida como Projeto Integrador III - UNIVESP, Grupo 10.

## Tecnologias

| Camada       | Tecnologia                          |
|--------------|-------------------------------------|
| Frontend | Angular 21 + TypeScript + SCSS |
| Backend | Node.js + Vercel Serverless Functions |
| Banco de dados | PostgreSQL |
| Deploy | Vercel |
| Controle de versao | GitHub |

## Estrutura do repositório

```
/
├── api/          # Vercel Serverless Functions (camada HTTP)
├── services/     # Regras de negócio compartilhadas entre rotas
├── database/     # Migrações SQL e scripts de banco
├── frontend/     # Aplicação Angular
├── docs/         # Documentação do projeto
└── vercel.json   # Configuração de build e roteamento
```

## Como executar localmente

### Pré-requisitos

- Node.js >= 22
- npm >= 10

### Frontend (Angular)

```bash
cd frontend
npm install
npm start
```

Acesse http://localhost:4200.

### Backend (Vercel Functions)

```bash
cd api
npm install

# Instalar dependências do banco de dados (scripts de migração)
cd ../database
npm install
cd ../api

# Iniciar servidor local
vercel dev
```

As funcoes ficam disponiveis em http://localhost:3000/api/*.

### Qualidade da API

```bash
cd api
npm test
npm run type-check
```

### Banco de dados (migrations)

```bash
cd api
# aplica migrations pendentes em desenvolvimento
npm run db:migrate:dev

# aplica migrations pendentes em produção
npm run db:migrate:prod

# cria/atualiza usuário base
npm run db:user:dev -- --email "email-oficial@seudominio.com" --password "SENHA_FORTE_DEV"
```

**Importante:** As dependências do banco (`pg`, `dotenv`) já estão declaradas em `database/package.json` e serão instaladas automaticamente quando você rodar `npm install` na pasta `database`.

## Deploy na Vercel

O arquivo `vercel.json` na raiz ja define o fluxo de deploy para o monorepo:

- instala dependencias de `frontend` e `api`
- faz build do Angular em `frontend`
- publica os arquivos estaticos de `frontend/dist/doces-delicia/browser`
- expoe apenas os endpoints de API mapeados explicitamente (`/api/auth`, `/api/clientes`, `/api/insumos`, `/api/estoque_insumos`, `/api/pedidos`, `/api/produtos`, `/api/usuarios`)

## Rotas de API

- `POST /api/auth`: login
- `GET /api/auth`: validar sessao/token (rota única de auth)
- `GET /api/clientes`: endpoint protegido
- `GET /api/insumos`: listar insumos
- `GET /api/estoque_insumos`: listar estoque de insumos
- `GET /api/pedidos`: listar pedidos
- `GET /api/produtos`: listar produtos
- `GET /api/usuarios`: listar usuarios
- `POST /api/usuarios`: criar usuario
- `PUT /api/usuarios?id=<id>`: editar usuario
- `DELETE /api/usuarios?id=<id>`: remover usuario

No painel da Vercel, configure o projeto com:

- Root Directory: `.`
- Framework Preset: `Other`
- Build and Output Settings: usar os valores do `vercel.json`

Variaveis de ambiente obrigatorias para producao:

- `DATABASE_URL`
- `JWT_SECRET`

## Variáveis de ambiente

### Desenvolvimento

Crie um arquivo `.env.development` na raiz do projeto:

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/doces_delicia
JWT_SECRET=sua-chave-secreta-dev
JWT_EXPIRES_IN=8h
BCRYPT_SALT_ROUNDS=12
```

### Produção

Crie um arquivo `.env.production` na raiz do projeto:

```env
DATABASE_URL=postgresql://usuario:senha@seu-host-db:5432/doces_delicia
JWT_SECRET=sua-chave-secreta-prod-forte
JWT_EXPIRES_IN=8h
BCRYPT_SALT_ROUNDS=12
```

**Importante:**
- Estes arquivos devem estar na **raiz do projeto** (não dentro de `api/`)
- O script de migração procura por `.env.development` e `.env.production` na raiz
- Nunca commit os arquivos `.env.development` ou `.env.production` no git

## Equipe

Projeto Integrador III — UNIVESP | Grupo 10
