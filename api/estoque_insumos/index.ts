import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  listarEstoqueInsumos,
  entradaEstoqueHandler,
  saidaEstoqueHandler,
  ajusteEstoqueHandler
} from '../../services/estoque-insumos.service.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = req.url || '';

  try {
    if (req.method === 'GET') {
      return await listarEstoqueInsumos(req, res);
    }

    if (req.method === 'POST' && url.includes('/entrada')) {
      return await entradaEstoqueHandler(req, res);
    }

    if (req.method === 'POST' && url.includes('/saida')) {
      return await saidaEstoqueHandler(req, res);
    }

    if (req.method === 'PATCH' && url.includes('/ajuste')) {
      return await ajusteEstoqueHandler(req, res);
    }

    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method || '')) {
      return res.status(501).json({ erro: 'Funcionalidade ainda nao implementada.' });
    }

    res.setHeader('Allow', 'GET, POST, PATCH');
    return res.status(405).json({ erro: 'Metodo nao permitido' });

  } catch (err: any) {
    return res.status(err.status || 500).json({ erro: err.message });
  }
}
