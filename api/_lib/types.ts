export type TipoUsuario = 'admin' | 'operador';

export interface Usuario {
	id: string;
	nome: string;
	email: string;
	senha: string;
	tipo_usuario: TipoUsuario;
	criado_em: string;
}

export interface CriarUsuarioInput {
	nome: string;
	email: string;
	senha: string;
	tipo_usuario: TipoUsuario;
}

export interface JwtUsuarioPayload {
	id: string;
	nome: string;
	email: string;
	tipo_usuario: TipoUsuario;
}
