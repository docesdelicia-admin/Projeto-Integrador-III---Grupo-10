import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthError, autenticarRequisicao, extrairIdDaUrl, verificarPermissaoDeletar } from '../api/_lib/auth.js';
import pool from '../api/_lib/db.js';

interface InsumoListagem {
	id: string;
	nome: string;
	descricao: string | null;
	unidade_medida: string;
	criado_em: string;
}

interface Insumo extends InsumoListagem {}

interface CriarInsumoBody {
	nome?: string;
	descricao?: string;
	unidade_medida?: string;
}

interface EditarInsumoBody {
	nome?: string;
	descricao?: string;
	unidade_medida?: string;
}

export async function listarInsumos(req: VercelRequest, res: VercelResponse) {
	try {
		autenticarRequisicao(req);
	} catch (error) {
		if (error instanceof AuthError) {
			return res.status(error.statusCode).json({ erro: error.message });
		}

		return res.status(401).json({ erro: 'Requer autenticacao.' });
	}

	const resultado = await pool.query<InsumoListagem>(
		'SELECT id, nome, descricao, unidade_medida, criado_em FROM insumos ORDER BY criado_em DESC',
	);

	res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');

	return res.status(200).json({
		total: resultado.rowCount ?? 0,
		insumos: resultado.rows,
	});
}

export async function criarInsumo(req: VercelRequest, res: VercelResponse) {
	try {
		autenticarRequisicao(req);
	} catch (error) {
		if (error instanceof AuthError) {
			return res.status(error.statusCode).json({ erro: error.message });
		}
		return res.status(401).json({ erro: 'Requer autenticacao.' });
	}

	try {
		const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body as CriarInsumoBody);

		if (typeof body.nome !== 'string' || !body.nome.trim()) {
			return res.status(400).json({ erro: 'Nome do insumo é obrigatorio.' });
		}

		if (typeof body.unidade_medida !== 'string' || !body.unidade_medida.trim()) {
			return res.status(400).json({ erro: 'Unidade de medida éobrigatoria.' });
		}

		const nome = body.nome.trim();
		const descricao = body.descricao ? String(body.descricao).trim() : null;
		const unidadeMedida = body.unidade_medida.trim();

		const resultado = await pool.query<Insumo>(
			'INSERT INTO insumos (nome, descricao, unidade_medida) VALUES ($1, $2, $3) RETURNING id, nome, descricao, unidade_medida, criado_em',
			[nome, descricao, unidadeMedida],
		);

		if (resultado.rowCount !== 1) {
			return res.status(500).json({ erro: 'Erro ao criar insumo.' });
		}

		return res.status(201).json({
			mensagem: 'Insumo criado com sucesso.',
			insumo: resultado.rows[0],
		});
	} catch (error) {
		if (error instanceof SyntaxError) {
			return res.status(400).json({ erro: 'Corpo da requisicao invalido.' });
		}

		if (error instanceof Error && error.message.includes('unique constraint')) {
			return res.status(409).json({ erro: 'Insumo com este nome ja existe.' });
		}

		return res.status(500).json({ erro: 'Erro interno ao criar insumo.' });
	}
}

export async function editarInsumo(req: VercelRequest, res: VercelResponse) {
	let id: string;
	try {
		id = extrairIdDaUrl(req);
		autenticarRequisicao(req);
	} catch (error) {
		if (error instanceof AuthError) {
			return res.status(error.statusCode).json({ erro: error.message });
		}
		return res.status(401).json({ erro: 'Requer autenticacao.' });
	}

	try {
		const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body as EditarInsumoBody);

		const campos: { chave: string; valor: unknown }[] = [];

		if (body.nome !== undefined) {
			if (typeof body.nome !== 'string' || !body.nome.trim()) {
				return res.status(400).json({ erro: 'Nome deve ser uma string nao-vazia.' });
			}
			campos.push({ chave: 'nome', valor: body.nome.trim() });
		}

		if (body.descricao !== undefined) {
			const desc = body.descricao ? String(body.descricao).trim() : null;
			campos.push({ chave: 'descricao', valor: desc });
		}

		if (body.unidade_medida !== undefined) {
			if (typeof body.unidade_medida !== 'string' || !body.unidade_medida.trim()) {
				return res.status(400).json({ erro: 'Unidade de medida deve ser uma string nao-vazia.' });
			}
			campos.push({ chave: 'unidade_medida', valor: body.unidade_medida.trim() });
		}

		if (campos.length === 0) {
			return res.status(400).json({ erro: 'Nenhum campo para atualizar.' });
		}

		const setClauses = campos.map((campo, i) => `${campo.chave} = $${i + 1}`).join(', ');
		const valores = campos.map((campo) => campo.valor);

		const resultado = await pool.query<Insumo>(
			`UPDATE insumos SET ${setClauses} WHERE id = $${campos.length + 1} RETURNING id, nome, descricao, unidade_medida, criado_em`,
			[...valores, id],
		);

		if (resultado.rowCount !== 1) {
			return res.status(404).json({ erro: 'Insumo nao encontrado.' });
		}

		return res.status(200).json({
			mensagem: 'Insumo atualizado com sucesso.',
			insumo: resultado.rows[0],
		});
	} catch (error) {
		if (error instanceof SyntaxError) {
			return res.status(400).json({ erro: 'Corpo da requisicao invalido.' });
		}

		if (error instanceof Error && error.message.includes('unique constraint')) {
			return res.status(409).json({ erro: 'Insumo com este nome ja existe.' });
		}

		return res.status(500).json({ erro: 'Erro interno ao atualizar insumo.' });
	}
}

export async function deletarInsumo(req: VercelRequest, res: VercelResponse) {
	let id: string;
	try {
		id = extrairIdDaUrl(req);
		const usuarioLogado = autenticarRequisicao(req);
		await verificarPermissaoDeletar(req, usuarioLogado);
	} catch (error) {
		if (error instanceof AuthError) {
			return res.status(error.statusCode).json({ erro: error.message });
		}
		return res.status(401).json({ erro: 'Requer autenticacao.' });
	}

	try {
		const resultado = await pool.query('DELETE FROM insumos WHERE id = $1', [id]);

		if (resultado.rowCount !== 1) {
			return res.status(404).json({ erro: 'Insumo nao encontrado.' });
		}

		return res.status(200).json({ mensagem: 'Insumo excluido com sucesso.' });
	} catch (error) {
		if (error instanceof AuthError) {
			return res.status(error.statusCode).json({ erro: error.message });
		}

		return res.status(500).json({ erro: 'Erro interno ao excluir insumo.' });
	}
}
