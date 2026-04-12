import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthError, autenticarRequisicao, extrairIdDaUrl, verificarPermissaoDeletar } from '../api/_lib/auth';
import pool from '../api/_lib/db';

interface ProdutoListagem {
	id: string;
	nome: string;
	categoria: string | null;
	descricao: string | null;
	preco: string;
	fotos: string[];
	ativo: boolean;
	criado_em: string;
}

interface Produto extends ProdutoListagem {}

interface CriarProdutoBody {
	nome?: string;
	categoria?: string;
	descricao?: string;
	preco?: string | number;
	fotos?: string[];
	ativo?: boolean;
}

interface EditarProdutoBody {
	nome?: string;
	categoria?: string;
	descricao?: string;
	preco?: string | number;
	fotos?: string[];
	ativo?: boolean;
}

export async function listarProdutos(req: VercelRequest, res: VercelResponse) {
	const listagemPublica = String(req.query.publico ?? '').toLowerCase() === 'true' || req.query.publico === '1';

	if (!listagemPublica) {
		try {
			autenticarRequisicao(req);
		} catch (error) {
			if (error instanceof AuthError) {
				return res.status(error.statusCode).json({ erro: error.message });
			}

			return res.status(401).json({ erro: 'Requer autenticacao.' });
		}
	}

	const query = listagemPublica
		? 'SELECT id, nome, categoria, descricao, preco, fotos, ativo, criado_em FROM produtos WHERE ativo = true ORDER BY criado_em DESC'
		: 'SELECT id, nome, categoria, descricao, preco, fotos, ativo, criado_em FROM produtos ORDER BY criado_em DESC';

	const resultado = await pool.query<ProdutoListagem>(query);

	if (listagemPublica) {
		res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
		res.setHeader('CDN-Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
		res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
	} else {
		res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
	}

	return res.status(200).json({
		total: resultado.rowCount ?? 0,
		produtos: resultado.rows,
	});
}

export async function criarProduto(req: VercelRequest, res: VercelResponse) {
	try {
		autenticarRequisicao(req);
	} catch (error) {
		if (error instanceof AuthError) {
			return res.status(error.statusCode).json({ erro: error.message });
		}
		return res.status(401).json({ erro: 'Requer autenticacao.' });
	}

	try {
		const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body as CriarProdutoBody);

		if (typeof body.nome !== 'string' || !body.nome.trim()) {
			return res.status(400).json({ erro: 'Nome do produto é obrigatorio.' });
		}

		if (body.categoria !== undefined && typeof body.categoria !== 'string') {
			return res.status(400).json({ erro: 'Categoria deve ser uma string.' });
		}

		if (typeof body.preco !== 'string' && typeof body.preco !== 'number') {
			return res.status(400).json({ erro: 'Preço é obrigatorio.' });
		}

		const nome = body.nome.trim();
		const categoria = body.categoria ? body.categoria.trim() : null;
		const descricao = body.descricao ? String(body.descricao).trim() : null;
		const preco = String(body.preco);
		const fotos = Array.isArray(body.fotos) ? body.fotos : [];
		const ativo = body.ativo !== false;

		const resultado = await pool.query<Produto>(
			'INSERT INTO produtos (nome, categoria, descricao, preco, fotos, ativo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nome, categoria, descricao, preco, fotos, ativo, criado_em',
			[nome, categoria, descricao, preco, fotos, ativo],
		);

		if (resultado.rowCount !== 1) {
			return res.status(500).json({ erro: 'Erro ao criar produto.' });
		}

		return res.status(201).json({
			mensagem: 'Produto criado com sucesso.',
			produto: resultado.rows[0],
		});
	} catch (error) {
		if (error instanceof SyntaxError) {
			return res.status(400).json({ erro: 'Corpo da requisicao invalido.' });
		}

		if (error instanceof Error && error.message.includes('unique constraint')) {
			return res.status(409).json({ erro: 'Produto com este nome ja existe.' });
		}

		return res.status(500).json({ erro: 'Erro interno ao criar produto.' });
	}
}

export async function editarProduto(req: VercelRequest, res: VercelResponse) {
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
		const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body as EditarProdutoBody);

		const campos: { chave: string; valor: unknown }[] = [];

		if (body.nome !== undefined) {
			if (typeof body.nome !== 'string' || !body.nome.trim()) {
				return res.status(400).json({ erro: 'Nome deve ser uma string nao-vazia.' });
			}
			campos.push({ chave: 'nome', valor: body.nome.trim() });
		}

		if (body.categoria !== undefined) {
			const categoria = body.categoria ? String(body.categoria).trim() : null;
			campos.push({ chave: 'categoria', valor: categoria });
		}

		if (body.descricao !== undefined) {
			const desc = body.descricao ? String(body.descricao).trim() : null;
			campos.push({ chave: 'descricao', valor: desc });
		}

		if (body.preco !== undefined) {
			const preco = String(body.preco);
			campos.push({ chave: 'preco', valor: preco });
		}

		if (body.fotos !== undefined) {
			const fotos = Array.isArray(body.fotos) ? body.fotos : [];
			campos.push({ chave: 'fotos', valor: fotos });
		}

		if (body.ativo !== undefined) {
			campos.push({ chave: 'ativo', valor: body.ativo });
		}

		if (campos.length === 0) {
			return res.status(400).json({ erro: 'Nenhum campo para atualizar.' });
		}

		const setClauses = campos.map((campo, i) => `${campo.chave} = $${i + 1}`).join(', ');
		const valores = campos.map((campo) => campo.valor);

		const resultado = await pool.query<Produto>(
			`UPDATE produtos SET ${setClauses} WHERE id = $${campos.length + 1} RETURNING id, nome, categoria, descricao, preco, fotos, ativo, criado_em`,
			[...valores, id],
		);

		if (resultado.rowCount !== 1) {
			return res.status(404).json({ erro: 'Produto nao encontrado.' });
		}

		return res.status(200).json({
			mensagem: 'Produto atualizado com sucesso.',
			produto: resultado.rows[0],
		});
	} catch (error) {
		if (error instanceof SyntaxError) {
			return res.status(400).json({ erro: 'Corpo da requisicao invalido.' });
		}

		if (error instanceof Error && error.message.includes('unique constraint')) {
			return res.status(409).json({ erro: 'Produto com este nome ja existe.' });
		}

		return res.status(500).json({ erro: 'Erro interno ao atualizar produto.' });
	}
}

export async function deletarProduto(req: VercelRequest, res: VercelResponse) {
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
		const resultado = await pool.query('DELETE FROM produtos WHERE id = $1', [id]);

		if (resultado.rowCount !== 1) {
			return res.status(404).json({ erro: 'Produto nao encontrado.' });
		}

		return res.status(200).json({ mensagem: 'Produto excluido com sucesso.' });
	} catch (error) {
		if (error instanceof AuthError) {
			return res.status(error.statusCode).json({ erro: error.message });
		}

		return res.status(500).json({ erro: 'Erro interno ao excluir produto.' });
	}
}
