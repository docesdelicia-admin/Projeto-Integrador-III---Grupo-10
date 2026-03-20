import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockReq, createMockRes } from '../../tests/http-mocks';

const mockedDb = vi.hoisted(() => ({ query: vi.fn() }));
const mockedAuth = vi.hoisted(() => ({
  autenticarRequisicao: vi.fn(),
  verificarAdminAutorizado: vi.fn(),
  AuthError: class AuthError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
  },
}));

vi.mock('../../_lib/db', () => ({
  default: mockedDb,
}));

vi.mock('../../_lib/auth', () => ({
  autenticarRequisicao: mockedAuth.autenticarRequisicao,
  verificarAdminAutorizado: mockedAuth.verificarAdminAutorizado,
  AuthError: mockedAuth.AuthError,
}));

describe('DELETE /api/usuarios/deletar/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna 405 quando metodo nao eh DELETE', async () => {
    const { default: handler } = await import('./[id]');
    const { res } = createMockRes();
    const req = createMockReq({
      method: 'GET',
      query: { id: '1' },
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('retorna 400 quando ID eh invalido', async () => {
    const { default: handler } = await import('./[id]');
    const { res } = createMockRes();
    const req = createMockReq({
      method: 'DELETE',
      query: { id: 'abc' },
      headers: { authorization: 'Bearer token-admin' },
    });

    mockedAuth.autenticarRequisicao.mockReturnValue({
      id: 1,
      tipo_usuario: 'admin',
      email: 'admin@teste.com',
      nome: 'Administrador',
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('retorna 401 quando usuario nao autenticado', async () => {
    const { default: handler } = await import('./[id]');
    const { res } = createMockRes();
    const req = createMockReq({
      method: 'DELETE',
      query: { id: '2' },
    });

    mockedAuth.autenticarRequisicao.mockImplementation(() => {
      throw new Error('Token invalido');
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('retorna 403 quando operador tenta deletar', async () => {
    const { default: handler } = await import('./[id]');
    const { res } = createMockRes();
    const req = createMockReq({
      method: 'DELETE',
      query: { id: '2' },
      headers: { authorization: 'Bearer token-operador' },
    });

    mockedAuth.autenticarRequisicao.mockReturnValue({
      id: 1,
      tipo_usuario: 'operador',
      email: 'operador@teste.com',
      nome: 'Operador',
    });

    mockedAuth.verificarAdminAutorizado.mockImplementation(() => {
      throw new mockedAuth.AuthError('Sem permissao', 403);
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('retorna 404 quando usuario nao encontrado', async () => {
    const { default: handler } = await import('./[id]');
    const { res } = createMockRes();
    const req = createMockReq({
      method: 'DELETE',
      query: { id: '999' },
      headers: { authorization: 'Bearer token-admin' },
    });

    mockedAuth.autenticarRequisicao.mockReturnValue({
      id: 1,
      tipo_usuario: 'admin',
      email: 'admin@teste.com',
      nome: 'Administrador',
    });

    mockedAuth.verificarAdminAutorizado.mockReturnValue(undefined);

    mockedDb.query.mockResolvedValue({
      rowCount: 0,
      rows: [],
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Usuario nao encontrado.' });
  });

  it('deleta usuario com sucesso quando admin', async () => {
    const { default: handler } = await import('./[id]');
    const { res } = createMockRes();
    const req = createMockReq({
      method: 'DELETE',
      query: { id: '2' },
      headers: { authorization: 'Bearer token-admin' },
    });

    mockedAuth.autenticarRequisicao.mockReturnValue({
      id: 1,
      tipo_usuario: 'admin',
      email: 'admin@teste.com',
      nome: 'Administrador',
    });

    mockedAuth.verificarAdminAutorizado.mockReturnValue(undefined);

    mockedDb.query.mockResolvedValue({
      rowCount: 1,
      rows: [],
    });

    await handler(req, res);

    expect(mockedDb.query).toHaveBeenCalledWith(
      'DELETE FROM usuarios WHERE id = $1',
      [2],
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ mensagem: 'Usuario excluido com sucesso.' });
  });

  it('retorna 500 em caso de erro no banco de dados', async () => {
    const { default: handler } = await import('./[id]');
    const { res } = createMockRes();
    const req = createMockReq({
      method: 'DELETE',
      query: { id: '2' },
      headers: { authorization: 'Bearer token-admin' },
    });

    mockedAuth.autenticarRequisicao.mockReturnValue({
      id: 1,
      tipo_usuario: 'admin',
      email: 'admin@teste.com',
      nome: 'Administrador',
    });

    mockedAuth.verificarAdminAutorizado.mockReturnValue(undefined);

    mockedDb.query.mockRejectedValue(new Error('Database connection error'));

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro interno ao excluir usuario.' });
  });
});
