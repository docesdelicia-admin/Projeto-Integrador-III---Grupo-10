import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createMockReq, createMockRes } from '../tests/http-mocks.js';

const mockedAutenticarLogin = vi.hoisted(() => vi.fn());
const mockedObterSessaoAutenticada = vi.hoisted(() => vi.fn());
const mockedLogout = vi.hoisted(() => vi.fn());

vi.mock('../../services/auth.service.js', () => ({
  autenticarLogin: mockedAutenticarLogin,
  logout: mockedLogout,
  obterSessaoAutenticada: mockedObterSessaoAutenticada,
}));

describe('/api/auth', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    mockedAutenticarLogin.mockResolvedValue(undefined);
    mockedObterSessaoAutenticada.mockResolvedValue(undefined);
    mockedLogout.mockResolvedValue(undefined);
  });

  it('retorna 405 quando metodo nao e suportado', async () => {
    const handler = (await import('./index.js')).default as unknown as (
      req: VercelRequest,
      res: VercelResponse,
    ) => Promise<unknown>;
    const { res, state } = createMockRes();
    const req = createMockReq({ method: 'OPTIONS' });

    await handler(req, res);

    expect(state.statusCode).toBe(405);
    expect(state.headers.Allow).toBe('GET, POST, DELETE');
    expect(state.jsonBody).toEqual({ erro: 'Metodo nao permitido' });
    expect(mockedAutenticarLogin).not.toHaveBeenCalled();
    expect(mockedLogout).not.toHaveBeenCalled();
    expect(mockedObterSessaoAutenticada).not.toHaveBeenCalled();
  });

  it('delega POST para autenticarLogin', async () => {
    const handler = (await import('./index.js')).default as unknown as (
      req: VercelRequest,
      res: VercelResponse,
    ) => Promise<unknown>;
    const { res } = createMockRes();
    const req = createMockReq({ method: 'POST', body: { email: 'admin@teste.com', senha: '123456' } });

    await handler(req, res);

    expect(mockedAutenticarLogin).toHaveBeenCalledTimes(1);
    expect(mockedAutenticarLogin).toHaveBeenCalledWith(req, res);
    expect(mockedObterSessaoAutenticada).not.toHaveBeenCalled();
  });

  it('delega GET para obterSessaoAutenticada', async () => {
    const handler = (await import('./index.js')).default as unknown as (
      req: VercelRequest,
      res: VercelResponse,
    ) => Promise<unknown>;
    const { res } = createMockRes();
    const req = createMockReq({ method: 'GET' });

    await handler(req, res);

    expect(mockedObterSessaoAutenticada).toHaveBeenCalledTimes(1);
    expect(mockedObterSessaoAutenticada).toHaveBeenCalledWith(req, res);
    expect(mockedAutenticarLogin).not.toHaveBeenCalled();
    expect(mockedLogout).not.toHaveBeenCalled();
  });

  it('delega DELETE para logout', async () => {
    const handler = (await import('./index.js')).default as unknown as (
      req: VercelRequest,
      res: VercelResponse,
    ) => Promise<unknown>;
    const { res } = createMockRes();
    const req = createMockReq({ method: 'DELETE' });

    await handler(req, res);

    expect(mockedLogout).toHaveBeenCalledTimes(1);
    expect(mockedLogout).toHaveBeenCalledWith(req, res);
    expect(mockedAutenticarLogin).not.toHaveBeenCalled();
    expect(mockedObterSessaoAutenticada).not.toHaveBeenCalled();
  });
});
