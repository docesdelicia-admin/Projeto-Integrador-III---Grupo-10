import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockReq, createMockRes } from '../../tests/http-mocks';

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
const mockedPassword = vi.hoisted(() => ({ gerarSenhaHash: vi.fn() }));

vi.mock('../../_lib/db', () => ({
  default: mockedDb,
}));

vi.mock('../../_lib/auth', () => ({
  autenticarRequisicao: mockedAuth.autenticarRequisicao,
  verificarPermissaoAcesso: mockedAuth.verificarPermissaoAcesso,
  AuthError: mockedAuth.AuthError,
}));

vi.mock('../../_lib/password', () => ({
  gerarSenhaHash: mockedPassword.gerarSenhaHash,
}));

describe('PUT /api/usuarios/editar/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna 405 quando metodo nao eh PUT', async () => {
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
      method: 'PUT',
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
      method: 'PUT',
      query: { id: '1' },
      body: { nome: 'Novo Nome' },
    });

    mockedAuth.autenticarRequisicao.mockImplementation(() => {
      throw new Error('Token invalido');
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('retorna 403 quando operador tenta editar outro usuario', async () => {
    const { default: handler } = await import('./[id]');
    const { res } = createMockRes();
    const req = createMockReq({
      method: 'PUT',
      query: { id: '2' },
      body: { nome: 'Novo Nome' },
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

  it('retorna 400 quando nome eh vazio', async () => {
    const { default: handler } = await import('./[id]');
    const { res } = createMockRes();
    const req = createMockReq({
      method: 'PUT',
      query: { id: '1' },
      body: { nome: '   ' }, // vazio com espacos
      headers: { authorization: 'Bearer token-admin' },
    });

    mockedAuth.autenticarRequisicao.mockReturnValue({
      id: 1,
      tipo_usuario: 'admin',
      email: 'admin@teste.com',
      nome: 'Administrador',
    });

    mockedAuth.verificarPermissaoAcesso.mockReturnValue(undefined);

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('retorna 400 quando email eh invalido', async () => {
    const { default: handler } = await import('./[id]');
    const { res } = createMockRes();
    const req = createMockReq({
      method: 'PUT',
      query: { id: '1' },
      body: { email: 'email-invalido' },
      headers: { authorization: 'Bearer token-admin' },
    });

    mockedAuth.autenticarRequisicao.mockReturnValue({
      id: 1,
      tipo_usuario: 'admin',
      email: 'admin@teste.com',
      nome: 'Administrador',
    });

    mockedAuth.verificarPermissaoAcesso.mockReturnValue(undefined);

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('edita nome com sucesso', async () => {
    const { default: handler } = await import('./[id]');
    const { res } = createMockRes();
    const novoNome = 'Novo Nome Usuario';
    const req = createMockReq({
      method: 'PUT',
      query: { id: '1' },
      body: { nome: novoNome },
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
      rowCount: 1,
      rows: [{
        id: 1,
        nome: novoNome,
        email: 'admin@teste.com',
        tipo_usuario: 'admin',
        criado_em: '2025-01-01T10:00:00Z',
      }],
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('edita email com sucesso', async () => {
    const { default: handler } = await import('./[id]');
    const { res } = createMockRes();
    const novoEmail = 'novo.email@teste.com';
    const req = createMockReq({
      method: 'PUT',
      query: { id: '1' },
      body: { email: novoEmail },
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
      rowCount: 1,
      rows: [{
        id: 1,
        nome: 'Administrador',
        email: novoEmail,
        tipo_usuario: 'admin',
        criado_em: '2025-01-01T10:00:00Z',
      }],
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('edita senha com sucesso', async () => {
    const { default: handler } = await import('./[id]');
    const { res } = createMockRes();
    const novaSenha = 'novasenha123';
    const req = createMockReq({
      method: 'PUT',
      query: { id: '1' },
      body: { senha: novaSenha },
      headers: { authorization: 'Bearer token-admin' },
    });

    mockedAuth.autenticarRequisicao.mockReturnValue({
      id: 1,
      tipo_usuario: 'admin',
      email: 'admin@teste.com',
      nome: 'Administrador',
    });

    mockedAuth.verificarPermissaoAcesso.mockReturnValue(undefined);

    mockedPassword.gerarSenhaHash.mockResolvedValue('novo-hash-senha');

    mockedDb.query.mockResolvedValue({
      rowCount: 1,
      rows: [{ id: 1 }],
    });

    await handler(req, res);

    expect(mockedPassword.gerarSenhaHash).toHaveBeenCalledWith(novaSenha);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('retorna 404 quando usuario nao encontrado', async () => {
    const { default: handler } = await import('./[id]');
    const { res } = createMockRes();
    const req = createMockReq({
      method: 'PUT',
      query: { id: '999' },
      body: { nome: 'Novo Nome' },
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
  });
});
