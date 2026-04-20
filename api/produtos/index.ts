import type { VercelRequest, VercelResponse } from '@vercel/node';
import { listarProdutos, criarProduto, editarProduto, deletarProduto } from '../../services/produtos.service.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  switch (req.method) {
    case 'GET':
      return await listarProdutos(req, res);
    case 'POST':
      return await criarProduto(req, res);
    case 'PUT':
      return await editarProduto(req, res);
    case 'DELETE':
      return await deletarProduto(req, res);
    default:
      res.setHeader('Allow', 'GET, POST, PUT, DELETE');
      return res.status(405).json({ erro: 'Metodo nao permitido' });
  }
}
