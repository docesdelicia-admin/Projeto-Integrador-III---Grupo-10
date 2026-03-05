# Frontend — Aplicação Angular

Esta pasta contém o frontend do projeto, desenvolvido com o framework **Angular**.

## Tecnologias

- **Angular** — framework para desenvolvimento de aplicações web SPA (Single Page Application)
- **TypeScript** — linguagem principal para o desenvolvimento dos componentes
- **HTML / SCSS** — estrutura e estilização das interfaces

## Estrutura sugerida

```
frontend/
├── src/
│   ├── app/          # Módulos, componentes, serviços e rotas
│   ├── assets/       # Imagens, fontes e outros recursos estáticos
│   └── environments/ # Configurações de ambiente (dev/prod)
├── angular.json      # Configuração do projeto Angular
├── package.json      # Dependências e scripts
└── tsconfig.json     # Configuração do TypeScript
```

## Como executar localmente

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (http://localhost:4200)
ng serve
```

## Build para produção

```bash
ng build --configuration production
```
