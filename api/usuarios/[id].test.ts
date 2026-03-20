import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockReq, createMockRes } from '../tests/http-mocks';

const mockedDb = vi.hoisted(() => ({ query: vi.fn() }));
const mockedAuth = vi.hoisted(() => ({
  autenticarRequisicao: vi.fn(),
  verificarPermissaoAcesso: vi.fn(),
  AuthError: class AuthError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
  },
}));

vi.mock('../_lib/db', () => ({
  default: mockedDb,
}));

vi.mock('../_lib/auth', () => ({
  autenticarRequisicao: mockedAuth.autenticarRequisicao,
  verificarPermissaoAcesso: mockedAuth.verificarPermissaoAcesso,
  AuthError: mockedAuth.AuthError,
}));

describe('GET /api/usuarios/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna 405 quando metodo nao eh GET', async () => {
    const { default: handler } = await import('./[id]');
    const { res } = createMockRes();
    const req = createMockReq({
      method: 'POST',
      query: { id: '1' },
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('retorna 400 quando ID eh invalido', async () => {
    const { default: handler } = await import('./[id]');
    const { res } = createMockRes();
    const req = createMockReq({
      method: 'GET',
      query: { id: 'abc' },
      headers: { authorization: 'Bearer token-valido' },
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
      method: 'GET',
      query: { id: '1' },
      headers: {},
    });

    mockedAuth.autenticarRequisicao.mockImplementation(() => {
      throw new Error('Token invalido');
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('retorna 403 quando operador tenta acessar usuario diferente', async () => {
    const { default: handler } = await import('./[id]');
    const { res } = createMockRes();
    const req = createMockReq({
      method: 'GET',
      query: { id: '2' },
      headers: { authorization: 'Bearer token-operador' },
    });

    mockedAuth.autenticarRequisicao.mockReturnValue({
      id: 1,
      tipo_usuario: 'operador',
      email: 'operador@teste.com',
      nome: 'Operador',
    });

    mockedAuth.verificarPermissaoAcesso.mockImplementation(() => {
      throw new mockedAuth.AuthError('Sem permissao', 403);
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('retorna 404 quando usuario nao encontrado', async () => {
    const { default: handler } = await import('./[id]');
    const { res } = createMockRes();
    const req = createMockReq({
      method: 'GET',
      query: { id: '999' },
      headers: { authorization: 'Bearer token-admin' },
    });

    mockedAuth.autenticarRequisicao.mockReturnValue({
      id: 1,
      tipo_usuario: 'admin',
      email: 'admin@teste.com',
      nome: 'Administrador',
    });

    mockedAuth.verificarPermissaoAcesso.mockReturnValue(undefined);

    mockedDb.query.mockResolvedValue({
      rowCount: 0,
      rows: [],
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Usuario nao encontrado.' });
  });

  it('retorna 200 com dados do usuario quando encontrado', async () => {
    const { default: handler } = await import('./[id]');
    const { res } = createMockRes();
    const req = createMockReq({
      method: 'GET',
      query: { id: '1' },
      headers: { authorization: 'Bearer token-admin' },
    });

    const usuarioMock = {
      id: 1,
      nome: 'Administrador',
      email: 'admin@teste.com',
      tipo_usuario: 'admin',
      criado_em: '2025-01-01T10:00:00Z',
    };

    mockedAuth.autenticarRequisicao.mockReturnValue({
      id: 1,
      tipo_usuario: 'admin',
      email: 'admin@teste.com',
      nome: 'Administrador',
    });

    mockedAuth.verificarPermissaoAcesso.mockReturnValue(undefined);

    mockedDb.query.mockResolvedValue({
      rowCount: 1,
      rows: [usuarioMock],
    });

    await handler(req, res);

    expect(mockedDb.query).toHaveBeenCalledWith(
      'SELECT id, nome, email, tipo_usuario, criado_em FROM usuarios WHERE id = $1',
      [1],
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ usuario: usuarioMock });
  });

  it('admin consegue acessar dados de outro usuario', async () => {
    const { default: handler } = await import('./[id]');
    const { res } = createMockRes();
    const req = createMockReq({
      method: 'GET',
      query: { id: '2' },
      headers: { authorization: 'Bearer token-admin' },
    });

    const usuarioMock = {
      id: 2,
      nome: 'Operador',
      email: 'operador@teste.com',
      tipo_usuario: 'operador',
      criado_em: '2025-01-02T10:00:00Z',
    };

    mockedAuth.autenticarRequisicao.mockReturnValue({
      id: 1,
      tipo_usuario: 'admin',
      email: 'admin@teste.com',
      nome: 'Administrador',
    });

    mockedAuth.verificarPermissaoAcesso.mockReturnValue(undefined);

    mockedDb.query.mockResolvedValue({
      rowCount: 1,
      rows: [usuarioMock],
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ usuario: usuarioMock });
  });
});
