/**
 * Endpoint de clientes
 * Requer autenticacao com JWT Bearer token
 * Admin: criar, editar, deletar clientes
 * Operador: criar, editar clientes
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { listarClientes, criarCliente, editarCliente, deletarCliente } from '../../services/clientes.service.js';
import { autenticarRequisicao, AuthError } from '../../api/_lib/auth.js';


export default async function handler(req: VercelRequest, res: VercelResponse) {
  switch (req.method) {
    case 'GET':
      return await listarClientes(req, res);
    case 'POST':
      return await criarCliente(req, res);
    case 'PUT':
      return await editarCliente(req, res);
    case 'DELETE':
      return await deletarCliente(req, res);
    default:
      res.setHeader('Allow', 'GET, POST, PUT, DELETE');
      return res.status(405).json({ erro: 'Metodo nao permitido' });
  }
}
export async function handleGetClientes(req: VercelRequest, res: VercelResponse) {
  try {
    autenticarRequisicao(req,res);
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }
    return res.status(401).json({ erro: 'Requer autenticacao.' });
  }

  try {
    const { q } = req.query;

    const resultado = await listarClientes({ 
      q: q ? String(q) : undefined 
    });

    return res.status(200).json(resultado);

  } catch (error) {
    console.error('Erro ao processar listagem de clientes:', error);
    return res.status(500).json({ erro: 'Erro interno ao buscar clientes.' });
  }
}
