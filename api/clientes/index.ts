import type { VercelRequest, VercelResponse } from '@vercel/node';

// TODO: implementar endpoints de clientes
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ mensagem: 'API de clientes em construção' });
}
