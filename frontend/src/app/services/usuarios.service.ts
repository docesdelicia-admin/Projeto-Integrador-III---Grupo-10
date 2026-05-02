import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo_usuario: 'admin' | 'operador';
  criado_em: string;
}

export interface ListarUsuariosResponse {
  total: number;
  usuarios: Usuario[];
}

export interface UsuarioAtualizadoResponse {
  mensagem: string;
  usuario: Usuario;
}

export interface CriarUsuarioPayload {
  nome: string;
  email: string;
  senha: string;
  tipo_usuario: 'admin' | 'operador';
}

export interface EditarUsuarioPayload {
  nome?: string;
  email?: string;
  senha?: string;
  tipo_usuario?: 'admin' | 'operador';
}

export interface EditarMinhaContaPayload {
  nome?: string;
  email?: string;
  senhaAtual: string;
  senhaNova?: string;
}

interface ErroApiResponse {
  erro?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {
  private readonly apiUrl = '/api/usuarios';

  constructor(private readonly http: HttpClient) {}

  listar(): Observable<ListarUsuariosResponse> {
    return this.http
      .get<ListarUsuariosResponse>(this.apiUrl, {
        withCredentials: true,
      })
      .pipe(
        catchError((error) =>
          throwError(() => new Error(this.extrairMensagemErro(error?.error)))
        )
      );
  }

  criar(payload: CriarUsuarioPayload): Observable<Usuario> {
    return this.http
      .post<Usuario>(this.apiUrl, payload, {
        withCredentials: true,
      })
      .pipe(
        catchError((error) =>
          throwError(() => new Error(this.extrairMensagemErro(error?.error)))
        )
      );
  }

  editar(
    id: string,
    payload: EditarUsuarioPayload
  ): Observable<Usuario> {
    return this.http
      .put<Usuario>(
        `${this.apiUrl}?id=${encodeURIComponent(id)}`,
        payload,
        {
          withCredentials: true,
        }
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(this.extrairMensagemErro(error?.error)))
        )
      );
  }

  excluir(id: string, senhaAtual: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}?id=${encodeURIComponent(id)}`, {
        body: {
          senhaAtual,
        },
        withCredentials: true,
      })
      .pipe(
        catchError((error) =>
          throwError(() => new Error(this.extrairMensagemErro(error?.error)))
        )
      );
  }

  editarMinhaConta(
    usuarioId: string,
    payload: EditarMinhaContaPayload
  ): Observable<UsuarioAtualizadoResponse> {
    const body: Record<string, string> = {
      senha_atual: payload.senhaAtual,
    };

    if (payload.nome !== undefined) {
      body['nome'] = payload.nome;
    }

    if (payload.email !== undefined) {
      body['email'] = payload.email;
    }

    if (payload.senhaNova !== undefined) {
      body['senha'] = payload.senhaNova;
    }

    return this.http
      .put<UsuarioAtualizadoResponse>(
        `${this.apiUrl}?id=${encodeURIComponent(usuarioId)}`,
        body,
        {
          withCredentials: true,
        }
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(this.extrairMensagemErro(error?.error)))
        )
      );
  }

  private extrairMensagemErro(
    payload: ErroApiResponse | undefined
  ): string {
    if (
      payload &&
      typeof payload.erro === 'string' &&
      payload.erro.trim()
    ) {
      return payload.erro;
    }

    if (
      payload &&
      typeof payload.message === 'string' &&
      payload.message.trim()
    ) {
      return payload.message;
    }

    return 'Não foi possível processar a solicitação. Tente novamente.';
  }
}
