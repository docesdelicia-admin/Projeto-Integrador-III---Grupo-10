import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthError, autenticarRequisicao } from '../api/_lib/auth';
import pool from '../api/_lib/db';

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

function extrairIdDaUrl(req: VercelRequest): string {
	const { id } = req.query;

	if (!id || Array.isArray(id)) {
		throw new AuthError('ID invalido.', 400);
	}

	return id;
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

    const {
        cliente_id,
        status,
        data_inicio,
        data_fim,
        limit = '20',
        offset = '0',
    } = req.query;

    const filtros: string[] = [];
    const valores: unknown[] = [];

    // Filtro por cliente
    if (cliente_id && typeof cliente_id === 'string') {
        valores.push(cliente_id);
        filtros.push(`cliente_id = $${valores.length}`);
    }

    // Filtro por status
    if (status && typeof status === 'string') {
        valores.push(status.toLowerCase());
        filtros.push(`status = $${valores.length}`);
    }

    // Filtro por período
    if (data_inicio && typeof data_inicio === 'string') {
        valores.push(data_inicio);
        filtros.push(`data_pedido >= $${valores.length}`);
    }

    if (data_fim && typeof data_fim === 'string') {
        valores.push(data_fim);
        filtros.push(`data_pedido <= $${valores.length}`);
    }

    const whereClause = filtros.length
        ? `WHERE ${filtros.join(' AND ')}`
        : '';

    const parsedLimit = Math.min(Number(limit) || 20, 100);
    const parsedOffset = Number(offset) || 0;

    valores.push(parsedLimit, parsedOffset);

    const query = `
        SELECT
            id,
            cliente_id,
            data_pedido,
            data_entrega,
            status,
            observacoes,
            criado_em
        FROM pedidos
        ${whereClause}
        ORDER BY criado_em DESC
        LIMIT $${valores.length - 1}
        OFFSET $${valores.length}
    `;

    const resultado = await pool.query<PedidoListagem>(query, valores);

    return res.status(200).json({
        filtros_aplicados: {
            cliente_id: cliente_id ?? null,
            status: status ?? null,
            data_inicio: data_inicio ?? null,
            data_fim: data_fim ?? null,
        },
        limit: parsedLimit,
        offset: parsedOffset,
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
			return res.status(400).json({ erro: 'cliente_id eh obrigatorio.' });
		}

		if (typeof body.data_pedido !== 'string' || !body.data_pedido.trim()) {
			return res.status(400).json({ erro: 'data_pedido eh obrigatoria.' });
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
		
		// Apenas admin pode deletar
		if (usuarioLogado.tipo_usuario !== 'admin') {
			throw new AuthError('Apenas administradores podem deletar pedidos.', 403);
		}
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
