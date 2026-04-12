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

## Versionamento e releases

O projeto passa a adotar versionamento semantico para entregas publicadas por tag:

- Padrao: SemVer (`MAJOR.MINOR.PATCH`)
- Fase atual: pre-release `1.0.0-rc.0`
- Release alvo: `v1.0.0`
- Pre-release (RC): tags como `v1.0.0-rc.0`, `v1.0.0-rc.1`

Regras praticas:

1. `PATCH`: correcao sem nova funcionalidade
2. `MINOR`: nova funcionalidade sem quebra
3. `MAJOR`: quebra relevante em relacao a versao estavel vigente

Fluxo minimo para publicar versao:

1. Atualizar [CHANGELOG.md](CHANGELOG.md)
2. Garantir testes/build verdes
3. Criar tag anotada
4. Publicar tag no remoto

Exemplo:

```bash
git tag -a v1.0.0-rc.0 -m "release: v1.0.0-rc.0"
git push origin v1.0.0-rc.0
```

Para detalhes completos, consulte [docs/versionamento.md](docs/versionamento.md).

## Planejamento das ultimas alteracoes

Para organizar commits e manter o Trello alinhado com o que foi entregue, consulte a pasta [planejamento](planejamento).

- [ultimas-alteracoes.md](planejamento/ultimas-alteracoes.md): resumo do que foi feito e sugestao de commits
- [documentacao-trello.md](planejamento/documentacao-trello.md): base para registrar os cartoes no Trello
- [sugestoes-trello](planejamento/sugestoes-trello): novas tasks sugeridas com titulo e descricao

O historico das entregas publicadas e registradas em [CHANGELOG.md](CHANGELOG.md).

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

## Busca reutilizavel (status atual)

- O frontend possui componente de busca reutilizavel em `frontend/src/app/components/search`.
- O visual da busca esta padronizado entre area publica e area logada.
- A logica de busca na area logada foi adiada para uma implementacao contextual (ha modulos alem de produtos).
- Existem TODOs no componente para conectar os eventos quando a regra final de busca for definida.

## Confirmacao por senha

- O frontend possui um componente reutilizavel de confirmacao por senha em `frontend/src/app/components/password-confirm-modal`.
- Esse componente e usado tanto na troca de senha da pagina Minha Conta quanto na exclusao de registros no admin.
- A regra de exclusao no backend exige senha de confirmacao do administrador.

## Testes

### API

```bash
DATABASE_URL=postgresql://usuario:senha@localhost:5432/doces_delicia npm --prefix api test
npm --prefix api run type-check
```

Observacao: os testes da API que importam a camada de autenticacao dependem de `DATABASE_URL` definido no ambiente.

### Frontend

```bash
npm --prefix frontend run test -- --watch=false
npm --prefix frontend run build
```

Observacao: a suite do frontend foi atualizada para o fluxo com Signals e leitura de cache em memoria.

## Como executar localmente

### Pré-requisitos

- Node.js >= 22
- npm >= 10

### Desenvolvimento integrado (recomendado)

Na raiz do repositorio:

```bash
npm run install-all
npm run dev
```

O comando `npm run install-all` na raiz executa automaticamente a instalacao de dependencias em:

- raiz do projeto
- `api/`
- `database/`
- `frontend/`

Ordem executada pelo script:

1. raiz
2. `api/`
3. `database/`
4. `frontend/`

O comando `npm run dev` sobe os dois servicos em paralelo:

- Frontend Angular em `http://localhost:4200`
- API local (Vercel dev) em `http://localhost:3000`

As chamadas para `/api/*` feitas pelo frontend em `4200` sao encaminhadas pelo proxy para `3000`.

### Frontend (execucao isolada)

```bash
cd frontend
npm install
npm start
```

Acesse http://localhost:4200.

### Backend (execucao isolada)

```bash
cd api
npm install

# Instalar dependências do banco de dados (scripts de migração)
cd ../database
npm install
cd ../api

# Iniciar servidor local (porta 3000)
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
- `PUT /api/usuarios?id=<id>`: editar usuario; para autoedicao exige `senha_atual`
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
