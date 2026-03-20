import type { VercelRequest, VercelResponse } from '@vercel/node';
import { listarPedidos, criarPedido, editarPedido, deletarPedido } from '../../services/pedidos.service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  switch (req.method) {
    case 'GET':
      return await listarPedidos(req, res);
    case 'POST':
      return await criarPedido(req, res);
    case 'PUT':
      return await editarPedido(req, res);
    case 'DELETE':
      return await deletarPedido(req, res);
    default:
      res.setHeader('Allow', 'GET, POST, PUT, DELETE');
      return res.status(405).json({ erro: 'Metodo nao permitido' });
  }
}
