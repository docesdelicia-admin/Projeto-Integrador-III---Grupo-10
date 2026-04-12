import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthError, autenticarRequisicao, extrairIdDaUrl, verificarPermissaoDeletar } from '../api/_lib/auth.js';
import pool from '../api/_lib/db.js';

interface PedidoListagem {
	id: string;
	cliente_id: string;
	data_pedido: string;
	data_entrega: string | null;
	status: 'novo' | 'em_producao' | 'entregue' | 'cancelado';
	observacoes: string | null;
	criado_em: string;
}

interface Pedido extends PedidoListagem {}

interface CriarPedidoBody {
	cliente_id?: string;
	data_pedido?: string;
	data_entrega?: string | null;
	status?: string;
	observacoes?: string;
}

interface EditarPedidoBody {
	data_pedido?: string;
	data_entrega?: string | null;
	status?: string;
	observacoes?: string;
}

export async function listarPedidos(req: VercelRequest, res: VercelResponse) {
	try {
		autenticarRequisicao(req);
	} catch (error) {
		if (error instanceof AuthError) {
			return res.status(error.statusCode).json({ erro: error.message });
		}

		return res.status(401).json({ erro: 'Requer autenticacao.' });
	}

	const status = typeof req.query.status === 'string' ? req.query.status.trim().toLowerCase() : '';
	const dataInicio = typeof req.query.data_inicio === 'string' ? req.query.data_inicio.trim() : '';
	const dataFim = typeof req.query.data_fim === 'string' ? req.query.data_fim.trim() : '';

	if (status && !['novo', 'em_producao', 'entregue', 'cancelado'].includes(status)) {
		return res.status(400).json({ erro: 'Filtro de status invalido. Use: novo, em_producao, entregue, cancelado.' });
	}

	const filtros: string[] = [];
	const valores: unknown[] = [];

	if (status) {
		filtros.push(`status = $${valores.length + 1}`);
		valores.push(status);
	}

	if (dataInicio) {
		filtros.push(`data_pedido >= $${valores.length + 1}`);
		valores.push(dataInicio);
	}

	if (dataFim) {
		filtros.push(`data_pedido <= $${valores.length + 1}`);
		valores.push(dataFim);
	}

	const whereClause = filtros.length > 0 ? `WHERE ${filtros.join(' AND ')}` : '';

	const resultado = await pool.query<PedidoListagem>(
		`SELECT id, cliente_id, data_pedido, data_entrega, status, observacoes, criado_em FROM pedidos ${whereClause} ORDER BY criado_em DESC`,
		valores,
	);

	res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');

	return res.status(200).json({
		total: resultado.rowCount ?? 0,
		pedidos: resultado.rows,
	});
}

export async function criarPedido(req: VercelRequest, res: VercelResponse) {
	try {
		autenticarRequisicao(req);
	} catch (error) {
		if (error instanceof AuthError) {
			return res.status(error.statusCode).json({ erro: error.message });
		}
		return res.status(401).json({ erro: 'Requer autenticacao.' });
	}

	try {
		const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body as CriarPedidoBody);

		if (typeof body.cliente_id !== 'string' || !body.cliente_id.trim()) {
			return res.status(400).json({ erro: 'cliente_id é obrigatorio.' });
		}

		if (typeof body.data_pedido !== 'string' || !body.data_pedido.trim()) {
			return res.status(400).json({ erro: 'data_pedido éobrigatoria.' });
		}

		const clienteId = body.cliente_id.trim();
		const dataPedido = body.data_pedido.trim();
		const dataEntrega = body.data_entrega ? String(body.data_entrega).trim() : null;
		const status = body.status ? String(body.status).trim().toLowerCase() : 'novo';
		const observacoes = body.observacoes ? String(body.observacoes).trim() : null;

		// Validar status
		if (!['novo', 'em_producao', 'entregue', 'cancelado'].includes(status)) {
			return res.status(400).json({ erro: 'Status invalido. Use: novo, em_producao, entregue, cancelado.' });
		}

		const resultado = await pool.query<Pedido>(
			'INSERT INTO pedidos (cliente_id, data_pedido, data_entrega, status, observacoes) VALUES ($1, $2, $3, $4, $5) RETURNING id, cliente_id, data_pedido, data_entrega, status, observacoes, criado_em',
			[clienteId, dataPedido, dataEntrega, status, observacoes],
		);

		if (resultado.rowCount !== 1) {
			return res.status(500).json({ erro: 'Erro ao criar pedido.' });
		}

		return res.status(201).json({
			mensagem: 'Pedido criado com sucesso.',
			pedido: resultado.rows[0],
		});
	} catch (error) {
		if (error instanceof SyntaxError) {
			return res.status(400).json({ erro: 'Corpo da requisicao invalido.' });
		}

		if (error instanceof Error && error.message.includes('foreign key constraint')) {
			return res.status(400).json({ erro: 'Cliente inexistente.' });
		}

		return res.status(500).json({ erro: 'Erro interno ao criar pedido.' });
	}
}

export async function editarPedido(req: VercelRequest, res: VercelResponse) {
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
		const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body as EditarPedidoBody);

		const campos: { chave: string; valor: unknown }[] = [];

		if (body.data_pedido !== undefined) {
			if (typeof body.data_pedido !== 'string' || !body.data_pedido.trim()) {
				return res.status(400).json({ erro: 'data_pedido deve ser uma string nao-vazia.' });
			}
			campos.push({ chave: 'data_pedido', valor: body.data_pedido.trim() });
		}

		if (body.data_entrega !== undefined) {
			const dataEntrega = body.data_entrega ? String(body.data_entrega).trim() : null;
			campos.push({ chave: 'data_entrega', valor: dataEntrega });
		}

		if (body.status !== undefined) {
			const status = String(body.status).trim().toLowerCase();
			if (!['novo', 'em_producao', 'entregue', 'cancelado'].includes(status)) {
				return res.status(400).json({ erro: 'Status invalido. Use: novo, em_producao, entregue, cancelado.' });
			}
			campos.push({ chave: 'status', valor: status });
		}

		if (body.observacoes !== undefined) {
			const observacoes = body.observacoes ? String(body.observacoes).trim() : null;
			campos.push({ chave: 'observacoes', valor: observacoes });
		}

		if (campos.length === 0) {
			return res.status(400).json({ erro: 'Nenhum campo para atualizar.' });
		}

		const setClauses = campos.map((campo, i) => `${campo.chave} = $${i + 1}`).join(', ');
		const valores = campos.map((campo) => campo.valor);

		const resultado = await pool.query<Pedido>(
			`UPDATE pedidos SET ${setClauses} WHERE id = $${campos.length + 1} RETURNING id, cliente_id, data_pedido, data_entrega, status, observacoes, criado_em`,
			[...valores, id],
		);

		if (resultado.rowCount !== 1) {
			return res.status(404).json({ erro: 'Pedido nao encontrado.' });
		}

		return res.status(200).json({
			mensagem: 'Pedido atualizado com sucesso.',
			pedido: resultado.rows[0],
		});
	} catch (error) {
		if (error instanceof SyntaxError) {
			return res.status(400).json({ erro: 'Corpo da requisicao invalido.' });
		}

		return res.status(500).json({ erro: 'Erro interno ao atualizar pedido.' });
	}
}

export async function deletarPedido(req: VercelRequest, res: VercelResponse) {
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
		const resultado = await pool.query('DELETE FROM pedidos WHERE id = $1', [id]);

		if (resultado.rowCount !== 1) {
			return res.status(404).json({ erro: 'Pedido nao encontrado.' });
		}

		return res.status(200).json({ mensagem: 'Pedido excluido com sucesso.' });
	} catch (error) {
		if (error instanceof AuthError) {
			return res.status(error.statusCode).json({ erro: error.message });
		}

		return res.status(500).json({ erro: 'Erro interno ao excluir pedido.' });
	}
}
