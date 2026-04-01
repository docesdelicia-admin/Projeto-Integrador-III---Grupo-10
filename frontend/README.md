# Frontend - Doces Delicia

Aplicacao frontend do projeto, desenvolvida em Angular 21.

## Versao do frontend

- Versao atual: `1.0.0-rc.0` (ver `frontend/package.json`)
- Releases oficiais sao controladas por tags no repositorio raiz (ex.: `v1.0.0-rc.0`)

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

## Qualidade

Rodar testes locais:

```bash
npm test
```

## Minha Conta - Troca de senha

Fluxo implementado na area logada:

- Usuario informa a nova senha e a confirmacao.
- Ao clicar em salvar, abre modal solicitando a senha atual.
- A confirmacao envia `PUT /api/usuarios?id=<id>` com `senha_atual` e os dados alterados.

## Busca no header (componente reutilizavel)

- O header usa o componente `app-search` para manter o mesmo visual na area publica e na area logada.
- A logica de busca da area logada foi intencionalmente adiada porque o contexto inclui diferentes modulos (nao apenas produtos).
- O componente contem TODOs para a futura conexao de eventos de busca contextual.

## Referencias

- Guia de versionamento: [docs/versionamento.md](../docs/versionamento.md)
- Changelog do projeto: [CHANGELOG.md](../CHANGELOG.md)
