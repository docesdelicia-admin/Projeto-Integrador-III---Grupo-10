# Changelog

Todas as mudancas relevantes deste projeto serao registradas neste arquivo.

Este formato segue Keep a Changelog e Semantic Versioning.

## [Unreleased]

## [1.0.0-rc.0] - 2026-04-01

### Added
- Pagina "Minha Conta" com fluxo completo de autoedicao e confirmacao de senha atual por modal para troca de senha.
- Componente de busca reutilizavel (`app-search`) integrado ao header para reaproveitamento entre area publica e area logada.
- Exibicao de descricao longa na tabela com acao dedicada e modal de leitura.
- Saudacao dinamica na sidebar com nome e perfil do usuario autenticado.
- Listagem publica de produtos na API (`GET /api/produtos?publico=1`), preservando o fluxo autenticado do admin.
- Vitrine consumindo produtos reais da API publica, substituindo dependencia de dados mockados.
- Util compartilhado para geracao de slides SVG de fallback na vitrine.
- Arquivos de execucao local para ambiente integrado: `frontend/proxy.conf.json` e `vercel.api.local.json`.
- Script de build da API garantindo criacao da pasta `api/public` para compatibilidade do runtime local.
- Arquivo raiz `package.json` com orquestracao de monorepo (`install-all`, `dev`, `dev:api`, `dev:web`).
- Documento `task.md` para replicar a arquitetura e o fluxo operacional em projeto similar.

### Changed
- Correcao de build Angular (NG5002): acoes de tabela das paginas internas agora usam handlers declarados no componente, sem arrow functions no template.
- A troca de dados da propria conta foi consolidada no `PUT /api/usuarios?id=<id>`, sem rota dedicada `/senha`.
- Frontend de produtos atualizado para separar cache publico e privado, com persistencia em `localStorage` e reidratacao para retorno de navegacao.
- Header administrativo ajustado para comportamento por rota (acao de dashboard + logout) e melhoria visual do campo de busca.
- Tela de "Minha Conta" recebeu ajuste de estilo no botao principal para manter consistencia com o design da aplicacao.
- Busca da area logada mantida sem logica definitiva (somente TODOs) para futura implementacao contextual alem de produtos.
- Versionamento dos pacotes do monorepo alinhado para `1.0.0-rc.0` (raiz, frontend, api, database).
- READMEs da raiz, API, frontend, database e docs atualizados para refletir fluxo de desenvolvimento local, release e versionamento.

### Fixed
- Erro de TypeScript na pagina "Minha Conta" relacionado ao reset de formulario de senha.
- Inconsistencia visual na busca da area logada, alinhando o modo de exibicao com a experiencia da vitrine.
- Regressao de exibicao de descricao na tabela, com fallback para valores curtos e vazios.

## [0.0.1] - 2026-03-31

### Added
- Estrutura inicial do monorepo (api, frontend, database, docs).
- Rotas principais da API e autenticacao JWT.
- Fluxo de migrations para banco PostgreSQL.
- Frontend Angular com paginas iniciais e area administrativa.
- Suite de testes frontend em funcionamento.
