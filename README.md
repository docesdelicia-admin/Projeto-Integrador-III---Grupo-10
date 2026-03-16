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
├── api/          # Vercel Serverless Functions (rotas do backend)
├── frontend/     # Aplicação Angular
├── database/     # Migrações SQL
├── docs/         # Documentação do projeto
└── vercel.json   # Configuração de build e roteamento
```

## Como executar localmente

### Pré-requisitos

- Node.js >= 24
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
npm install -g vercel
vercel dev
```

As funcoes ficam disponiveis em http://localhost:3000/api/*.

## Deploy na Vercel

O arquivo `vercel.json` na raiz ja define o fluxo de deploy para o monorepo:

- instala dependencias de `frontend` e `api`
- faz build do Angular em `frontend`
- publica os arquivos estaticos de `frontend/dist/doces-delicia/browser`
- expoe as funcoes serverless em `api/**/*.ts`

No painel da Vercel, configure o projeto com:

- Root Directory: `.`
- Framework Preset: `Other`
- Build and Output Settings: usar os valores do `vercel.json`

Variaveis de ambiente obrigatorias para producao:

- `DATABASE_URL`
- `JWT_SECRET`

## Variáveis de ambiente

Crie um arquivo `.env` na raiz com base no `.env.example`:

```env
DATABASE_URL=
JWT_SECRET=
```

## Equipe

Projeto Integrador III — UNIVESP | Grupo 10
