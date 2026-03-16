# Frontend - Doces Delicia

Aplicacao frontend do projeto, desenvolvida em Angular 21.

## Scripts principais

```bash
# desenvolvimento local
npm start

# build de producao
npm run build

# testes
npm test
```

## Estrutura principal

```text
frontend/
|- src/
|  |- app/
|  |- index.html
|  |- main.ts
|- public/
|- angular.json
|- package.json
```

## Build para Vercel

O deploy usa o build gerado em:

```text
frontend/dist/doces-delicia/browser
```

Essa saida ja esta integrada no `vercel.json` da raiz do repositorio.
