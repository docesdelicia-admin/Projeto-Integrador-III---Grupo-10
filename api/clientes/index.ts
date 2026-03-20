/**
 * Endpoint de clientes
 * Requer autenticacao com JWT Bearer token
 * Admin: criar, editar, deletar clientes
 * Operador: criar, editar clientes
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { listarClientes, criarCliente, editarCliente, deletarCliente } from '../../services/clientes.service';

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
