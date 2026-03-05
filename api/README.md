# API — Backend (Node.js + Vercel Functions)

Esta pasta contém o backend do projeto, desenvolvido em **Node.js** e implantado via **Vercel Functions** (serverless).

## Tecnologias

- **Node.js** — ambiente de execução JavaScript no servidor
- **Vercel Functions** — funções serverless para as rotas da API

## Estrutura sugerida

```
api/
├── api/              # Funções serverless (cada arquivo = uma rota)
│   ├── users.js      # Exemplo: GET /api/users
│   └── ...
├── lib/              # Utilitários e helpers compartilhados
├── package.json      # Dependências e scripts do projeto
└── vercel.json       # Configuração de deploy na Vercel
```

## Como executar localmente

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

## Deploy

O deploy é realizado automaticamente pela Vercel ao fazer push para a branch principal.
