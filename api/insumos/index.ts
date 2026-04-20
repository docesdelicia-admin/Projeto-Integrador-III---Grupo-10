import type { VercelRequest, VercelResponse } from '@vercel/node';
import { listarInsumos, criarInsumo, editarInsumo, deletarInsumo } from '../../services/insumos.service.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  switch (req.method) {
    case 'GET':
      return await listarInsumos(req, res);
    case 'POST':
      return await criarInsumo(req, res);
    case 'PUT':
      return await editarInsumo(req, res);
    case 'DELETE':
      return await deletarInsumo(req, res);
    default:
      res.setHeader('Allow', 'GET, POST, PUT, DELETE');
      return res.status(405).json({ erro: 'Metodo nao permitido' });
  }
}
