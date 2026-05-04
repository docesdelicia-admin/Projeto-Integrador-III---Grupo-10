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


function validarQuantidade(valor: any) {
	if (typeof valor !== 'number' || valor <= 0) {
		throw { status: 400, message: 'Quantidade deve ser maior que 0' };
	}
}

function validarNaoNegativo(valor: any, campo: string) {
	if (valor !== undefined && (typeof valor !== 'number' || valor < 0)) {
		throw { status: 400, message: `${campo} deve ser >= 0` };
	}
}

function autenticar(req: VercelRequest, res: VercelResponse) {
	try {
		autenticarRequisicao(req);
	} catch (error) {
		if (error instanceof AuthError) {
			res.status(error.statusCode).json({ erro: error.message });
			return false;
		}
		res.status(401).json({ erro: 'Requer autenticacao.' });
		return false;
	}
	return true;
}


export async function listarEstoqueInsumos(req: VercelRequest, res: VercelResponse) {
	if (!autenticar(req, res)) return;

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


export async function entradaEstoqueHandler(req: VercelRequest, res: VercelResponse) {
	if (!autenticar(req, res)) return;

	try {
		const { insumo_id, quantidade } = req.body;

		if (!insumo_id) {
			return res.status(400).json({ erro: 'insumo_id é obrigatório' });
		}

		validarQuantidade(quantidade);

		const estoque = await pool.query(
			'SELECT quantidade_disponivel FROM estoque_insumos WHERE insumo_id = $1',
			[insumo_id],
		);

		if (estoque.rowCount === 0) {
			return res.status(404).json({ erro: 'Insumo não encontrado' });
		}

		const novaQuantidade =
			Number(estoque.rows[0].quantidade_disponivel) + quantidade;

		await pool.query(
			`UPDATE estoque_insumos
			 SET quantidade_disponivel = $1,
			     ultima_atualizacao = NOW()
			 WHERE insumo_id = $2`,
			[novaQuantidade, insumo_id],
		);

		return res.status(200).json({ sucesso: true });
	} catch (err: any) {
		return res.status(err.status || 500).json({ erro: err.message });
	}
}


export async function saidaEstoqueHandler(req: VercelRequest, res: VercelResponse) {
	if (!autenticar(req, res)) return;

	try {
		const { insumo_id, quantidade } = req.body;

		if (!insumo_id) {
			return res.status(400).json({ erro: 'insumo_id é obrigatório' });
		}

		validarQuantidade(quantidade);

		const estoque = await pool.query(
			'SELECT quantidade_disponivel FROM estoque_insumos WHERE insumo_id = $1',
			[insumo_id],
		);

		if (estoque.rowCount === 0) {
			return res.status(404).json({ erro: 'Insumo não encontrado' });
		}

		const atual = Number(estoque.rows[0].quantidade_disponivel);

		if (quantidade > atual) {
			return res.status(400).json({ erro: 'Estoque insuficiente' });
		}

		const novaQuantidade = atual - quantidade;

		await pool.query(
			`UPDATE estoque_insumos
			 SET quantidade_disponivel = $1,
			     ultima_atualizacao = NOW()
			 WHERE insumo_id = $2`,
			[novaQuantidade, insumo_id],
		);

		return res.status(200).json({ sucesso: true });
	} catch (err: any) {
		return res.status(err.status || 500).json({ erro: err.message });
	}
}


export async function ajusteEstoqueHandler(req: VercelRequest, res: VercelResponse) {
	if (!autenticar(req, res)) return;

	try {
		const { insumo_id, quantidade_disponivel, quantidade_minima } = req.body;

		if (!insumo_id) {
			return res.status(400).json({ erro: 'insumo_id é obrigatório' });
		}

		validarNaoNegativo(quantidade_disponivel, 'quantidade_disponivel');
		validarNaoNegativo(quantidade_minima, 'quantidade_minima');

		const estoque = await pool.query(
			'SELECT id FROM estoque_insumos WHERE insumo_id = $1',
			[insumo_id],
		);

		if (estoque.rowCount === 0) {
			return res.status(404).json({ erro: 'Insumo não encontrado' });
		}

		const campos: string[] = [];
		const valores: any[] = [];
		let index = 1;

		if (quantidade_disponivel !== undefined) {
			campos.push(`quantidade_disponivel = $${index++}`);
			valores.push(quantidade_disponivel);
		}

		if (quantidade_minima !== undefined) {
			campos.push(`quantidade_minima = $${index++}`);
			valores.push(quantidade_minima);
		}

		campos.push(`ultima_atualizacao = NOW()`);

		valores.push(insumo_id);

		await pool.query(
			`UPDATE estoque_insumos
			 SET ${campos.join(', ')}
			 WHERE insumo_id = $${index}`,
			valores,
		);

		return res.status(200).json({ sucesso: true });
	} catch (err: any) {
		return res.status(err.status || 500).json({ erro: err.message });
	}
}
