# Roteiro de Apresentacao - Projeto Integrador III

Este documento serve como base para a gravacao do video de apresentacao do projeto. A ideia e conduzir a explicacao de forma objetiva, cobrindo o contexto geral, a arquitetura tecnica, as tecnologias utilizadas e o funcionamento funcional do sistema.

## 1. Abertura

**Narração sugerida**

"O nosso projeto integrador e uma aplicacao web desenvolvida para a doceria Doces Delicia. O objetivo foi criar um sistema completo para apoiar a operacao da empresa, reunindo vitrine de produtos, autenticacao, area administrativa e gestao de dados em uma unica plataforma."

**O que mostrar na tela**

- Tela inicial da vitrine.
- Logo, nome do projeto e navegacao principal.
- Breve transicao para o painel administrativo.

## 2. Visao geral do sistema

**Narração sugerida**

"O sistema foi dividido em duas experiencias principais. A area publica apresenta os produtos e permite a navegacao do usuario final. A area logada concentra as operacoes internas, com acesso ao dashboard, gestao de clientes, pedidos, produtos, usuarios e dados da conta."

**Pontos para destacar**

- Area publica para visualizacao e navegação.
- Area administrativa protegida por autenticacao.
- Perfis de acesso diferentes para administrador e operador.

## 3. Tecnologias utilizadas

**Narração sugerida**

"No frontend, utilizamos Angular 21 com TypeScript e SCSS, o que nos permitiu construir componentes reutilizaveis, paginas modulares e uma interface reativa. No backend, usamos Node.js com Vercel Serverless Functions, expondo as rotas da API de forma simples e escalavel. Para persistencia de dados, o banco utilizado foi PostgreSQL. O deploy foi configurado na Vercel, e o controle de versao ficou centralizado no GitHub."

**Resumo tecnico**

- Frontend: Angular 21, TypeScript e SCSS.
- Backend: Node.js com funcoes serverless da Vercel.
- Banco: PostgreSQL.
- Deploy: Vercel.
- Versionamento: GitHub com releases por tag.

## 4. Arquitetura do projeto

**Narração sugerida**

"A arquitetura do projeto segue uma separacao clara entre interface, regras de negocio e acesso aos dados. O frontend consome a API por meio de servicos, a API processa as regras de negocio e conversa com o banco, e os scripts de migracao garantem que a estrutura do banco seja reproduzivel em qualquer ambiente."

**Estrutura tecnica principal**

- `frontend/`: interface do usuario e navegacao.
- `api/`: rotas HTTP, autenticacao e regras de acesso.
- `database/`: migracoes SQL e scripts de manutencao.
- `docs/`: documentacao tecnica do projeto.

## 5. Funcionamento do frontend

**Narração sugerida**

"No frontend, a aplicacao foi organizada em paginas e componentes reutilizaveis. A vitrine mostra os produtos para o usuario final. A area logada utiliza guardas de rota para proteger acessos e exibir apenas os modulos permitidos. Tambem usamos Signals para manter o estado das telas reativo e reduzir chamadas repetidas para a API."

**Detalhes tecnicos importantes**

- Rotas principais para vitrine, login, dashboard, produtos, pedidos, clientes, usuarios e minha conta.
- Guards para proteger rotas autenticadas e area de administrador.
- Componentes reutilizaveis para tabela, filtros, modal, toast, sidebar e confirmacao por senha.
- Cache em memoria para listagens, ajudando na experiencia de uso.

## 6. Funcionalidades do sistema

**Narração sugerida**

"Na pratica, o sistema permite consultar produtos na vitrine, fazer login, acessar a area administrativa, cadastrar e editar registros, acompanhar pedidos e manter os usuarios do sistema. As operacoes sensiveis, como exclusao e alteracao de senha, exigem confirmacao adicional para aumentar a seguranca."

**Fluxos funcionais para apresentar**

- Visualizacao da vitrine e navegacao pela loja.
- Login e validacao de sessao.
- Dashboard com acesso aos modulos administrativos.
- Cadastro, edicao e exclusao de clientes, produtos, pedidos e usuarios.
- Alteracao de senha na area Minha Conta.
- Confirmacao de senha para exclusao ou alteracoes sensiveis.

**Regras de negocio para destacar durante a apresentacao**

- Apenas usuarios autenticados acessam a area administrativa.
- Apenas administradores executam acoes sensiveis como exclusao de registros.
- Exclusoes exigem confirmacao com senha atual para aumentar a seguranca.
- Operadores podem consultar e operar fluxos permitidos, mas nao recebem os mesmos privilegios de administracao.
- A alteracao de senha na area Minha Conta exige validacao da senha atual.

## 7. Backend e API

**Narração sugerida**

"No backend, a API foi dividida por dominio, com rotas especificas para autenticacao, clientes, pedidos, produtos e usuarios. As funcoes serverless recebem as requisicoes, validam permissao, processam a regra de negocio e retornam respostas padronizadas para o frontend."

**Pontos tecnicos**

- Rota de autenticacao para login e validacao de sessao.
- Rotas protegidas por permissao e tipo de usuario.
- Operacoes CRUD organizadas por dominio.
- Respostas com mensagens de erro tratadas no frontend.

## 8. Seguranca e controle de acesso

**Narração sugerida**

"Um ponto importante do projeto e o controle de acesso. O sistema diferencia usuario administrador e operador, restringindo acoes conforme o perfil. Alem disso, operacoes de exclusao usam confirmacao por senha atual, o que adiciona uma camada extra de seguranca para evitar acoes indevidas."

**Tecnicas utilizadas**

- Autenticacao baseada em sessao/token.
- Protecao de rotas no frontend.
- Validacao de permissao no backend.
- Confirmacao por senha para operacoes criticas.

## 9. Banco de dados e migracoes

**Narração sugerida**

"O banco de dados foi modelado em PostgreSQL e organizado com migracoes SQL, o que permite recriar a estrutura de forma consistente em diferentes ambientes. Isso tambem facilita manutencao, evolucao do schema e reproducao do projeto em desenvolvimento ou producao."

**O que vale mencionar**

- Migrations versionadas em SQL.
- Estrutura preparada para usuarios, clientes, produtos, pedidos e itens de pedido.
- Scripts de apoio para migracao e carga inicial.

## 10. Tecnicas de desenvolvimento adotadas

**Narração sugerida**

"Durante o desenvolvimento, aplicamos tecnicas para organizar melhor o codigo e facilitar manutencao. Entre elas estao a separacao por modulos, reutilizacao de componentes, tratamento centralizado de erros, cache local de listagens e padronizacao de rotas e servicos."

**Resumo das tecnicas**

- Separacao por camadas e dominios.
- Componentizacao.
- Reutilizacao de servicos.
- Cache em memoria para reduzir requisições.
- Tratamento consistente de erros e feedback visual.
- Guardas de rota e controle por perfil.

## 11. Trello e organizacao do trabalho

**Narração sugerida**

"Durante o desenvolvimento, o time acompanhou as entregas no Trello. O narrador deve mostrar o quadro e explicar como os cards foram organizados por etapas, desde planejamento e desenvolvimento ate testes, validacao e conclusao. Isso ajuda a demonstrar a gestao do projeto e a evolucao das tarefas ao longo do tempo."

**O que mostrar na tela**

- O quadro principal do Trello.
- Colunas com cards em progresso, concluido e pendente.
- Exemplo de card relacionado a funcionalidade, teste ou documentacao.
- A relacao entre os cards e as entregas do projeto.

## 12. CI/CD e validacao antes do deploy

**Narração sugerida**

"O projeto possui um fluxo de integracao continua que valida automaticamente o codigo antes da entrega. A pipeline executa build e testes no frontend, e testes mais type-check na API. Assim, o deploy fica condicionado a uma base validada, reduzindo o risco de publicar falhas para producao."

**Pontos tecnicos para mencionar**

- O workflow roda em `push` e `pull_request` para `main` e `develop`.
- O frontend executa build e testes automatizados.
- A API executa testes e verificacao de tipos.
- O deploy de producao segue o fluxo aprovado de branches e validacao.
- Esse processo funciona como uma barra de qualidade antes da publicacao.

## 13. Deploy e execucao local

**Narração sugerida**

"O projeto foi preparado para execucao local e tambem para deploy na Vercel. Em desenvolvimento, o frontend roda em paralelo com a API, e as requisicoes para `/api` sao redirecionadas corretamente. Na producao, o build do Angular gera os arquivos estaticos e a Vercel publica a aplicacao junto com as funcoes serverless."

**Pontos a citar**

- Ambiente local com frontend e API integrados.
- Proxy para chamadas `/api`.
- Deploy automatizado via configuracao da Vercel.

## 14. Encerramento

**Narração sugerida**

"Com isso, o projeto entrega uma solucao funcional e organizada para a Doces Delicia, unindo interface moderna, backend escalavel, seguranca e manutencao facilitada. O resultado e um sistema pronto para apoiar a operacao e servir como base para evolucoes futuras."

**Fechamento visual**

- Mostrar tela final do dashboard ou da vitrine.
- Exibir nome do projeto e equipe.
- Encerrar com a mensagem final do video.

## 15. Ordem sugerida para gravacao

1. Abertura com apresentacao do projeto.
2. Visao geral das areas publica e administrativa.
3. Explicacao das tecnologias.
4. Mostrar o Trello e explicar a organizacao dos cards.
5. Demonstracao do frontend e das rotas principais.
6. Demonstracao da autenticacao, das regras de negocio e do controle de acesso.
7. Explicacao do backend, da API, do banco e do CI/CD.
8. Fechamento com beneficios e resultados.

## 16. Observacoes para a equipe

- Manter a fala objetiva e evitar excesso de detalhes de implementacao no video.
- Mostrar a tela enquanto explica cada funcionalidade.
- Priorizar o fluxo real de uso, do login ate as operacoes administrativas.
- Se necessario, adaptar a duracao de cada bloco conforme o tempo total do video.
