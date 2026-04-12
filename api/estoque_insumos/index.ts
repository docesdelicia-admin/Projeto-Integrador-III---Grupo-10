import type { VercelRequest, VercelResponse } from '@vercel/node';
import { listarEstoqueInsumos } from '../../services/insumos.service.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  switch (req.method) {
    case 'GET':
      return await listarEstoqueInsumos(req, res);
    case 'POST':
    case 'PUT':
    case 'DELETE':
      return res.status(501).json({ erro: 'Funcionalidade ainda nao implementada.' });
    default:
      res.setHeader('Allow', 'GET, POST, PUT, DELETE');
      return res.status(405).json({ erro: 'Metodo nao permitido' });
  }
}
