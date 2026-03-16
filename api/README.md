# API - Backend (Node.js + Vercel Functions)

Esta pasta contem o backend do projeto, usando funcoes serverless da Vercel.

## Estrutura atual

```text
api/
|- _lib/
|  |- db.ts
|  |- types.ts
|- clientes/
|  |- index.ts    # /api/clientes
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

## Execucao local integrada (frontend + api)

Use o comando abaixo na raiz do repositorio para rodar o ambiente local da Vercel:

```bash
vercel dev
```

As rotas da API ficam disponiveis em /api/*.
