import type { VercelRequest } from '@vercel/node';
import type { JwtPayload, SignOptions } from 'jsonwebtoken';
import type { JwtUsuarioPayload, TipoUsuario } from './types.js';
import pool from './db.js';
import { validarSenha } from './password.js';

interface JwtTokenClaims extends JwtUsuarioPayload {
  sub: string;
}

const jwt = require('jsonwebtoken/index.js') as typeof import('jsonwebtoken');

if (typeof jwt.sign !== 'function' || typeof jwt.verify !== 'function') {
  throw new Error('Biblioteca jsonwebtoken indisponivel para assinatura/validacao de token.');
}

const jwtSecret: string = process.env.JWT_SECRET ?? '';

if (!jwtSecret) {
  throw new Error('Variavel de ambiente JWT_SECRET nao configurada.');
}

// Configuracao do emissor do token e tempo de expiracao
const jwtIssuer = 'doces-delicia-api';
const jwtExpiresIn = (process.env.JWT_EXPIRES_IN ?? '8h') as SignOptions['expiresIn'];
const authCookieName = process.env.AUTH_COOKIE_NAME ?? 'doces_delicia_session';

export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

function isTipoUsuario(value: unknown): value is TipoUsuario {
  return value === 'admin' || value === 'operador';
}

/**
 * Gera um token JWT com os dados do usuario
 * O token contem o ID, nome, email e tipo de usuario
 */
export function gerarAccessToken(usuario: JwtUsuarioPayload): string {
  const payload: JwtTokenClaims = {
    sub: String(usuario.id),
    ...usuario,
  };

  const options: SignOptions = {
    expiresIn: jwtExpiresIn,
    issuer: jwtIssuer,
  };

  return jwt.sign(payload, jwtSecret, options);
}

export function extrairBearerToken(authorizationHeader: string | undefined): string {
  if (!authorizationHeader) {
    throw new AuthError('Token nao enviado.');
  }

  const [scheme, token] = authorizationHeader.trim().split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    throw new AuthError('Formato do token invalido. Use: Bearer <token>.');
  }

  return token;
}

function parseDuracaoParaSegundos(value: string): number {
  const valor = value.trim();
  const regex = /^(\d+)([smhd])$/i;
  const match = valor.match(regex);

  if (!match) {
    return 8 * 60 * 60;
  }

  const quantidade = Number(match[1]);
  const unidade = match[2].toLowerCase();

  if (!Number.isFinite(quantidade) || quantidade <= 0) {
    return 8 * 60 * 60;
  }

  if (unidade === 's') return quantidade;
  if (unidade === 'm') return quantidade * 60;
  if (unidade === 'h') return quantidade * 60 * 60;

  return quantidade * 60 * 60 * 24;
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(';').reduce<Record<string, string>>((acc, item) => {
    const [rawKey, ...rest] = item.split('=');
    const key = rawKey?.trim();
    const value = rest.join('=').trim();

    if (!key) {
      return acc;
    }

    acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}

function extrairTokenDoCookie(cookieHeader: string | undefined): string {
  const cookies = parseCookies(cookieHeader);
  const token = cookies[authCookieName];

  if (!token) {
    throw new AuthError('Token nao enviado.');
  }

  return token;
}

export function criarCookieSessao(token: string): string {
  const maxAge = parseDuracaoParaSegundos(String(jwtExpiresIn));
  const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';

  return `${authCookieName}=${encodeURIComponent(token)}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Lax${secureFlag}`;
}

export function criarCookieSessaoEncerrada(): string {
  const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${authCookieName}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; HttpOnly; SameSite=Lax${secureFlag}`;
}

export function verificarAccessToken(token: string): JwtUsuarioPayload {
  let decoded: string | JwtPayload;

  try {
    decoded = jwt.verify(token, jwtSecret, { issuer: jwtIssuer });
  } catch {
    throw new AuthError('Token invalido ou expirado.');
  }

  if (typeof decoded === 'string') {
    throw new AuthError('Payload do token invalido.');
  }

  const idRaw = decoded.id ?? decoded.sub;
  const id = typeof idRaw === 'string' || typeof idRaw === 'number' ? String(idRaw).trim() : '';
  const nome = decoded.nome;
  const email = decoded.email;
  const tipoUsuario = decoded.tipo_usuario;

  if (!id || typeof nome !== 'string' || typeof email !== 'string' || !isTipoUsuario(tipoUsuario)) {
    throw new AuthError('Token com payload invalido.');
  }

  return {
    id,
    nome,
    email,
    tipo_usuario: tipoUsuario,
  };
}

export function autenticarRequisicao(req: VercelRequest): JwtUsuarioPayload {
  const token = req.headers.authorization
    ? extrairBearerToken(req.headers.authorization)
    : extrairTokenDoCookie(req.headers.cookie);

  return verificarAccessToken(token);
}


export function verificarAdminAutorizado(usuario: JwtUsuarioPayload): void {
  if (usuario.tipo_usuario !== 'admin') {
    throw new AuthError('Acesso Restrito a Administradores.', 403);
  }
}

export function verificarPermissaoAcesso(usuario: JwtUsuarioPayload, usuarioIdSolicitado: string | number): void {
  if (usuario.tipo_usuario === 'admin') {
    return;
  }

  if (usuario.id !== String(usuarioIdSolicitado)) {
    throw new AuthError('Acesso Restrito a Administradores.', 403);
  }
}

export function extrairIdDaUrl(req: VercelRequest): string {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    throw new AuthError('ID invalido.', 400);
  }

  const valor = String(id).trim();

  if (!valor) {
    throw new AuthError('ID invalido.', 400);
  }

  return valor;
}

function obterSenhaConfirmacaoAdmin(req: VercelRequest): string {
  const body = typeof req.body === 'string'
    ? JSON.parse(req.body)
    : (typeof req.body === 'object' && req.body !== null ? req.body : {});

  const senhaBruta =
    (typeof (body as Record<string, unknown>)['senha_atual'] === 'string' && (body as Record<string, string>)['senha_atual']) ||
    (typeof (body as Record<string, unknown>)['senha_admin'] === 'string' && (body as Record<string, string>)['senha_admin']) ||
    (typeof (body as Record<string, unknown>)['senha'] === 'string' && (body as Record<string, string>)['senha']) ||
    '';

  const senha = senhaBruta.trim();

  if (!senha) {
    throw new AuthError('Senha de confirmacao do administrador eh obrigatoria para excluir.', 400);
  }

  return senha;
}

export async function verificarPermissaoDeletar(
  req: VercelRequest,
  usuario: JwtUsuarioPayload,
): Promise<void> {
  if (usuario.tipo_usuario !== 'admin') {
    throw new AuthError('Apenas administradores podem deletar dados.', 403);
  }

  let senhaConfirmacao: string;
  try {
    senhaConfirmacao = obterSenhaConfirmacaoAdmin(req);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new AuthError('Corpo da requisicao invalido.', 400);
    }
    throw error;
  }

  const resultado = await pool.query<{ senha_hash: string }>(
    'SELECT senha_hash FROM usuarios WHERE id = $1 LIMIT 1',
    [usuario.id],
  );

  if (resultado.rowCount !== 1) {
    throw new AuthError('Administrador autenticado nao encontrado.', 401);
  }

  const senhaValida = await validarSenha(senhaConfirmacao, resultado.rows[0].senha_hash);

  if (!senhaValida) {
    throw new AuthError('Senha de confirmacao invalida.', 403);
  }
}
