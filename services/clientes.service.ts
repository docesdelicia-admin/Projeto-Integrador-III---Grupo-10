import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthError, autenticarRequisicao, extrairIdDaUrl, verificarPermissaoDeletar } from '../api/_lib/auth.js';
import pool from '../api/_lib/db.js';

interface ClienteListagem {
  id: string;
  nome: string;
  telefone: string | null;
  observacoes: string | null;
  criado_em: string;
}

interface Cliente extends ClienteListagem {}

interface CriarClienteBody {
  nome?: string;
  telefone?: string;
  observacoes?: string;
}

interface EditarClienteBody {
  nome?: string;
  telefone?: string;
  observacoes?: string;
}

export async function listarClientes(req: VercelRequest, res: VercelResponse) {
  try {
    autenticarRequisicao(req);
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }

    return res.status(401).json({ erro: 'Requer autenticacao.' });
  }

  const resultado = await pool.query<ClienteListagem>(
    'SELECT id, nome, telefone, observacoes, criado_em FROM clientes ORDER BY criado_em DESC',
  );

  return res.status(200).json({
    total: resultado.rowCount ?? 0,
    clientes: resultado.rows,
  });
}

export async function criarCliente(req: VercelRequest, res: VercelResponse) {
  try {
    autenticarRequisicao(req);
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }
    return res.status(401).json({ erro: 'Requer autenticacao.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body as CriarClienteBody);

    if (typeof body.nome !== 'string' || !body.nome.trim()) {
      return res.status(400).json({ erro: 'Nome do cliente é obrigatorio.' });
    }

    const nome = body.nome.trim();
    const telefone = body.telefone ? String(body.telefone).trim() : null;
    const observacoes = body.observacoes ? String(body.observacoes).trim() : null;

    const resultado = await pool.query<Cliente>(
      'INSERT INTO clientes (nome, telefone, observacoes) VALUES ($1, $2, $3) RETURNING id, nome, telefone, observacoes, criado_em',
      [nome, telefone, observacoes],
    );

    if (resultado.rowCount !== 1) {
      return res.status(500).json({ erro: 'Erro ao criar cliente.' });
    }

    return res.status(201).json({
      mensagem: 'Cliente criado com sucesso.',
      cliente: resultado.rows[0],
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return res.status(400).json({ erro: 'Corpo da requisicao invalido.' });
    }

    return res.status(500).json({ erro: 'Erro interno ao criar cliente.' });
  }
}

export async function editarCliente(req: VercelRequest, res: VercelResponse) {
  let id: string;
  try {
    id = extrairIdDaUrl(req);
    autenticarRequisicao(req);
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }
    return res.status(401).json({ erro: 'Requer autenticacao.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body as EditarClienteBody);

    const campos: { chave: string; valor: unknown }[] = [];

    if (body.nome !== undefined) {
      if (typeof body.nome !== 'string' || !body.nome.trim()) {
        return res.status(400).json({ erro: 'Nome deve ser uma string nao-vazia.' });
      }
      campos.push({ chave: 'nome', valor: body.nome.trim() });
    }

    if (body.telefone !== undefined) {
      const telefone = body.telefone ? String(body.telefone).trim() : null;
      campos.push({ chave: 'telefone', valor: telefone });
    }

    if (body.observacoes !== undefined) {
      const observacoes = body.observacoes ? String(body.observacoes).trim() : null;
      campos.push({ chave: 'observacoes', valor: observacoes });
    }

    if (campos.length === 0) {
      return res.status(400).json({ erro: 'Nenhum campo para atualizar.' });
    }

    const setClauses = campos.map((campo, i) => `${campo.chave} = $${i + 1}`).join(', ');
    const valores = campos.map((campo) => campo.valor);

    const resultado = await pool.query<Cliente>(
      `UPDATE clientes SET ${setClauses} WHERE id = $${campos.length + 1} RETURNING id, nome, telefone, observacoes, criado_em`,
      [...valores, id],
    );

    if (resultado.rowCount !== 1) {
      return res.status(404).json({ erro: 'Cliente nao encontrado.' });
    }

    return res.status(200).json({
      mensagem: 'Cliente atualizado com sucesso.',
      cliente: resultado.rows[0],
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return res.status(400).json({ erro: 'Corpo da requisicao invalido.' });
    }

    return res.status(500).json({ erro: 'Erro interno ao atualizar cliente.' });
  }
}

export async function deletarCliente(req: VercelRequest, res: VercelResponse) {
  let id: string;
  try {
    id = extrairIdDaUrl(req);
    const usuarioLogado = autenticarRequisicao(req);
    await verificarPermissaoDeletar(req, usuarioLogado);
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }
    return res.status(401).json({ erro: 'Requer autenticacao.' });
  }

  try {
    const resultado = await pool.query('DELETE FROM clientes WHERE id = $1', [id]);

    if (resultado.rowCount !== 1) {
      return res.status(404).json({ erro: 'Cliente nao encontrado.' });
    }

    return res.status(200).json({ mensagem: 'Cliente excluido com sucesso.' });
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }

    return res.status(500).json({ erro: 'Erro interno ao excluir cliente.' });
  }
}
