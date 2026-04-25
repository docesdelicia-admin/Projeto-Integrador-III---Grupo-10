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
  try {
    autenticarRequisicao(req);
  } catch (error: any) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }
    return res.status(401).json({ erro: 'Requer autenticacao.' });
  }

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
