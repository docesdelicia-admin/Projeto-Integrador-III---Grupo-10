import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockReq, createMockRes } from '../tests/http-mocks';

const mockedDb = vi.hoisted(() => ({ query: vi.fn() }));
const mockedPassword = vi.hoisted(() => ({ validarSenha: vi.fn() }));
const mockedAuth = vi.hoisted(() => ({ gerarAccessToken: vi.fn() }));

vi.mock('../_lib/db', () => ({
  default: mockedDb,
}));

vi.mock('../_lib/password', () => ({
  validarSenha: mockedPassword.validarSenha,
}));

vi.mock('../_lib/auth', async () => {
  const actual = await vi.importActual<typeof import('../_lib/auth')>('../_lib/auth');

  return {
    ...actual,
    gerarAccessToken: mockedAuth.gerarAccessToken,
  };
});

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('retorna 405 quando o metodo nao e POST', async () => {
    const { default: handler } = await import('./login');
    const { res, state } = createMockRes();
    const req = createMockReq({ method: 'GET' });

    await handler(req, res);

    expect(state.statusCode).toBe(405);
    expect(state.headers.Allow).toBe('POST');
    expect(state.jsonBody).toEqual({ erro: 'Metodo nao permitido' });
  });

  it('retorna 400 para email invalido', async () => {
    const { default: handler } = await import('./login');
    const { res, state } = createMockRes();
    const req = createMockReq({
      method: 'POST',
      body: { email: 'invalido', senha: '123456' },
    });

    await handler(req, res);

    expect(state.statusCode).toBe(400);
    expect(state.jsonBody).toEqual({ erro: 'Email invalido.' });
    expect(mockedDb.query).not.toHaveBeenCalled();
  });

  it('retorna 401 quando usuario nao existe', async () => {
    const { default: handler } = await import('./login');
    mockedDb.query.mockResolvedValue({ rowCount: 0, rows: [] });

    const { res, state } = createMockRes();
    const req = createMockReq({
      method: 'POST',
      body: { email: 'admin@teste.com', senha: '123456' },
    });

    await handler(req, res);

    expect(state.statusCode).toBe(401);
    expect(state.jsonBody).toEqual({ erro: 'Credenciais invalidas.' });
  });

  it('retorna 200 com token quando credenciais sao validas', async () => {
    const { default: handler } = await import('./login');

    mockedDb.query.mockResolvedValue({
      rowCount: 1,
      rows: [
        {
          id: 1,
          nome: 'Administrador',
          email: 'admin@teste.com',
          senha: 'hash-senha',
          tipo_usuario: 'admin',
        },
      ],
    });

    mockedPassword.validarSenha.mockResolvedValue(true);
    mockedAuth.gerarAccessToken.mockReturnValue('token-teste');

    const { res, state } = createMockRes();
    const req = createMockReq({
      method: 'POST',
      body: { email: 'ADMIN@TESTE.COM', senha: '123456' },
    });

    await handler(req, res);

    expect(mockedDb.query).toHaveBeenCalledWith(
      'SELECT id, nome, email, senha, tipo_usuario FROM usuarios WHERE email = $1 LIMIT 1',
      ['admin@teste.com'],
    );
    expect(mockedPassword.validarSenha).toHaveBeenCalledWith('123456', 'hash-senha');
    expect(mockedAuth.gerarAccessToken).toHaveBeenCalled();
    expect(state.statusCode).toBe(200);
    expect(state.jsonBody).toMatchObject({
      token: 'token-teste',
      tipo_token: 'Bearer',
      usuario: {
        id: 1,
        email: 'admin@teste.com',
      },
    });
  });
});
