import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthError, autenticarRequisicao } from '../api/_lib/auth.js';
import pool from '../api/_lib/db.js';

interface EstoqueInsumoListagem {
	id: string;
	insumo_id: string;
	nome_insumo: string;
	quantidade_disponivel: string;
	quantidade_minima: string;
	ultima_atualizacao: string;
}

export async function listarEstoqueInsumos(req: VercelRequest, res: VercelResponse) {
	try {
		autenticarRequisicao(req);
	} catch (error) {
		if (error instanceof AuthError) {
			return res.status(error.statusCode).json({ erro: error.message });
		}

		return res.status(401).json({ erro: 'Requer autenticacao.' });
	}

	const resultado = await pool.query<EstoqueInsumoListagem>(
		`SELECT
			ei.id,
			ei.insumo_id,
			i.nome AS nome_insumo,
			ei.quantidade_disponivel,
			ei.quantidade_minima,
			ei.ultima_atualizacao
		 FROM estoque_insumos ei
		 INNER JOIN insumos i ON i.id = ei.insumo_id
		 ORDER BY i.nome`,
	);

	return res.status(200).json({
		total: resultado.rowCount ?? 0,
		estoque_insumos: resultado.rows,
	});
}
