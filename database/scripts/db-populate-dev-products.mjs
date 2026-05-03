import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs(argv) {
  const args = {
    envFile: path.join(__dirname, '..', '..', '.env.development'),
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === '--env' && argv[i + 1]) {
      args.envFile = argv[i + 1];
      i += 1;
    }
  }

  return args;
}

function loadEnvFile(envFilePath) {
  if (!envFilePath) {
    return;
  }

  const absolutePath = path.isAbsolute(envFilePath)
    ? envFilePath
    : path.resolve(process.cwd(), envFilePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Arquivo .env nao encontrado: ${absolutePath}`);
  }

  const content = fs.readFileSync(absolutePath, 'utf8');
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const idx = line.indexOf('=');
    if (idx < 1) {
      continue;
    }

    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function getDevProducts() {
  return [
    {
      nome: 'Bolo de Ninho com Morango',
      categoria: 'Bolos personalizados',
      descricao: 'Massa fofinha com recheio cremoso e decoracao artesanal para aniversarios e eventos.',
      preco: 179.9,
    },
    {
      nome: 'Kit festa completo',
      categoria: 'Kit festa',
      descricao: 'Combinacao completa para celebrar com praticidade e identidade visual personalizada.',
      preco: 249.9,
    },
    {
      nome: 'Mini doces escolares',
      categoria: 'Festa na escola',
      descricao: 'Opcoes porcionadas e seguras para comemorar com os colegas na escola.',
      preco: 159.9,
    },
    {
      nome: 'Pote brigadeiro gourmet',
      categoria: 'Doces no pote',
      descricao: 'Camadas cremosas e sabores intensos em versoes individuais para qualquer ocasiao.',
      preco: 19.9,
    },
    {
      nome: 'Bolo caseiro de cenoura',
      categoria: 'Bolo caseiro',
      descricao: 'Receitas afetivas de massa fofinha, ideais para o cafe da tarde.',
      preco: 49.9,
    },
    {
      nome: 'Selecao de salgados',
      categoria: 'Salgados',
      descricao: 'Linha de salgados assados e fritos para compor festas e reunioes.',
      preco: 89.9,
    },
  ];
}

async function run() {
  const args = parseArgs(process.argv);
  loadEnvFile(args.envFile);

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL nao definido. Passe --env ou exporte a variavel no shell.');
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  const products = getDevProducts();

  try {
    await client.connect();
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    await client.query(`
      ALTER TABLE produtos
        ADD COLUMN IF NOT EXISTS categoria VARCHAR(120)
    `);

    const colunas = await client.query(`
      SELECT
        EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'produtos'
            AND column_name = 'secao'
        ) AS secao_exists,
        EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'produtos'
            AND column_name = 'categoria'
        ) AS categoria_exists
    `);

    if (colunas.rows[0]?.secao_exists && colunas.rows[0]?.categoria_exists) {
      await client.query(`
        UPDATE produtos
        SET categoria = COALESCE(categoria, secao)
        WHERE categoria IS NULL AND secao IS NOT NULL
      `);
    }

    for (const product of products) {
      await client.query(
        `
          INSERT INTO produtos (nome, categoria, descricao, preco, fotos, ativo)
          VALUES ($1, $2, $3, $4, $5, TRUE)
          ON CONFLICT (nome)
          DO UPDATE SET
            categoria = EXCLUDED.categoria,
            descricao = EXCLUDED.descricao,
            preco = EXCLUDED.preco,
            fotos = EXCLUDED.fotos,
            ativo = EXCLUDED.ativo,
            atualizado_em = NOW()
        `,
        [product.nome, product.categoria, product.descricao, String(product.preco), []],
      );
    }

    console.log(`Carga inicial aplicada com sucesso. Produtos inseridos/atualizados: ${products.length}`);
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error('Falha ao aplicar carga inicial de produtos no banco de desenvolvimento.');
  console.error(error);
  process.exit(1);
});
