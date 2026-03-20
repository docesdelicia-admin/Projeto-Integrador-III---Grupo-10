import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockReq, createMockRes } from '../tests/http-mocks';

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
const mockedPassword = vi.hoisted(() => ({ gerarSenhaHash: vi.fn() }));

vi.mock('../_lib/db', () => ({
  default: mockedDb,
}));

vi.mock('../_lib/auth', () => ({
  autenticarRequisicao: mockedAuth.autenticarRequisicao,
  verificarAdminAutorizado: mockedAuth.verificarAdminAutorizado,
  AuthError: mockedAuth.AuthError,
}));

vi.mock('../_lib/password', () => ({
  gerarSenhaHash: mockedPassword.gerarSenhaHash,
}));

describe('POST /api/usuarios/criar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna 405 quando metodo nao eh POST', async () => {
    const { default: handler } = await import('./criar');
    const { res } = createMockRes();
    const req = createMockReq({
      method: 'GET',
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('retorna 401 quando usuario nao autenticado', async () => {
    const { default: handler } = await import('./criar');
    const { res } = createMockRes();
    const req = createMockReq({
      method: 'POST',
      body: { nome: 'Novo Usuario', email: 'novo@teste.com', senha: '123456', tipo_usuario: 'operador' },
    });

    mockedAuth.autenticarRequisicao.mockImplementation(() => {
      throw new Error('Token invalido');
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('retorna 403 quando operador tenta criar usuario', async () => {
    const { default: handler } = await import('./criar');
    const { res } = createMockRes();
    const req = createMockReq({
      method: 'POST',
      body: { nome: 'Novo Usuario', email: 'novo@teste.com', senha: '123456', tipo_usuario: 'operador' },
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

  it('retorna 400 quando campos obrigatorios faltam', async () => {
    const { default: handler } = await import('./criar');
    const { res } = createMockRes();
    const req = createMockReq({
      method: 'POST',
      body: { nome: 'Novo Usuario' },
      headers: { authorization: 'Bearer token-admin' },
    });

    mockedAuth.autenticarRequisicao.mockReturnValue({
      id: 1,
      tipo_usuario: 'admin',
      email: 'admin@teste.com',
      nome: 'Administrador',
    });

    mockedAuth.verificarAdminAutorizado.mockReturnValue(undefined);

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('retorna 400 quando email eh invalido', async () => {
    const { default: handler } = await import('./criar');
    const { res } = createMockRes();
    const req = createMockReq({
      method: 'POST',
      body: { nome: 'Novo Usuario', email: 'email-invalido', senha: '123456', tipo_usuario: 'operador' },
      headers: { authorization: 'Bearer token-admin' },
    });

    mockedAuth.autenticarRequisicao.mockReturnValue({
      id: 1,
      tipo_usuario: 'admin',
      email: 'admin@teste.com',
      nome: 'Administrador',
    });

    mockedAuth.verificarAdminAutorizado.mockReturnValue(undefined);

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('retorna 400 quando tipo_usuario invalido', async () => {
    const { default: handler } = await import('./criar');
    const { res } = createMockRes();
    const req = createMockReq({
      method: 'POST',
      body: { nome: 'Novo Usuario', email: 'novo@teste.com', senha: '123456', tipo_usuario: 'super-admin' },
      headers: { authorization: 'Bearer token-admin' },
    });

    mockedAuth.autenticarRequisicao.mockReturnValue({
      id: 1,
      tipo_usuario: 'admin',
      email: 'admin@teste.com',
      nome: 'Administrador',
    });

    mockedAuth.verificarAdminAutorizado.mockReturnValue(undefined);

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('retorna 500 em erro de banco de dados durante criacao', async () => {
    const { default: handler } = await import('./criar');
    const { res } = createMockRes();
    const req = createMockReq({
      method: 'POST',
      body: { nome: 'Novo Usuario', email: 'novo@teste.com', senha: '123456', tipo_usuario: 'operador' },
      headers: { authorization: 'Bearer token-admin' },
    });

    mockedAuth.autenticarRequisicao.mockReturnValue({
      id: 1,
      tipo_usuario: 'admin',
      email: 'admin@teste.com',
      nome: 'Administrador',
    });

    mockedAuth.verificarAdminAutorizado.mockReturnValue(undefined);

    mockedPassword.gerarSenhaHash.mockResolvedValue('hash-senha');
    mockedDb.query.mockRejectedValue(new Error('duplicate key'));

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('cria usuario com sucesso quando dados validos', async () => {
    const { default: handler } = await import('./criar');
    const { res } = createMockRes();
    const req = createMockReq({
      method: 'POST',
      body: { nome: 'Novo Usuario', email: 'novo@teste.com', senha: '123456', tipo_usuario: 'operador' },
      headers: { authorization: 'Bearer token-admin' },
    });

    mockedAuth.autenticarRequisicao.mockReturnValue({
      id: 1,
      tipo_usuario: 'admin',
      email: 'admin@teste.com',
      nome: 'Administrador',
    });

    mockedAuth.verificarAdminAutorizado.mockReturnValue(undefined);

    mockedPassword.gerarSenhaHash.mockResolvedValue('hash-senha');

    mockedDb.query.mockResolvedValue({
      rowCount: 1,
      rows: [{
        id: 2,
        nome: 'Novo Usuario',
        email: 'novo@teste.com',
        tipo_usuario: 'operador',
        criado_em: '2025-01-03T10:00:00Z',
      }],
    });

    await handler(req, res);

    expect(mockedPassword.gerarSenhaHash).toHaveBeenCalledWith('123456');
    expect(mockedDb.query).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
