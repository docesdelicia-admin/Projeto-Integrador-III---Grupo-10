import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { CacheStoreService } from './cache-store.service';
import { extrairMensagemErroApi } from '../utils/extrair-mensagem-erro-api';

import {
  UsuarioListaItem,
  CriarUsuarioPayload,
  EditarUsuarioPayload,
  EditarMinhaContaPayload,
} from '../interfaces/Usuario';

export interface ListarUsuariosResponse {
  total: number;
  usuarios: UsuarioListaItem[];
}

export interface UsuarioAtualizadoResponse {
  mensagem: string;
  usuario: UsuarioListaItem;
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
  private readonly cacheKeyListagem = 'usuarios:listagem';
  private readonly ttl = 30000;

  constructor(
    private readonly http: HttpClient,
    private readonly cache: CacheStoreService,
  ) {}

  listar(): Observable<ListarUsuariosResponse> {
    const request$ = this.http.get<ListarUsuariosResponse>(this.apiUrl, {
      withCredentials: true,
    });

    return this.cache
      .getData(this.cacheKeyListagem, request$, this.ttl)
      .pipe(
        catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error)))),
      );
  }

  criar(payload: CriarUsuarioPayload): Observable<UsuarioListaItem> {
    return this.http
      .post<UsuarioListaItem>(this.apiUrl, payload, {
        withCredentials: true,
      })
      .pipe(
        tap((novoUsuario) => {
          const atual = this.cache.get<ListarUsuariosResponse>(this.cacheKeyListagem);
          if (!atual) return;

          this.cache.set(
            this.cacheKeyListagem,
            {
              total: atual.total + 1,
              usuarios: [novoUsuario, ...atual.usuarios],
            },
            this.ttl,
          );
        }),
        catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error)))),
      );
  }

  editar(usuarioId: string, payload: EditarUsuarioPayload): Observable<UsuarioAtualizadoResponse> {
    const body: Record<string, string> = {};

    if (payload.nome !== undefined) body['nome'] = payload.nome.trim();
    if (payload.email !== undefined) body['email'] = payload.email.trim();
    if (payload.senha !== undefined) body['senha'] = payload.senha;
    if (payload.tipo_usuario !== undefined) body['tipo_usuario'] = payload.tipo_usuario;

    return this.http
      .put<UsuarioAtualizadoResponse>(`${this.apiUrl}?id=${encodeURIComponent(usuarioId)}`, body, {
        withCredentials: true,
      })
      .pipe(
        tap((resposta) => {
          const atual = this.cache.get<ListarUsuariosResponse>(this.cacheKeyListagem);
          if (!atual) return;

          const usuariosAtualizados = atual.usuarios.map((u) =>
            u.id === usuarioId ? resposta.usuario : u,
          );

          this.cache.set(
            this.cacheKeyListagem,
            {
              total: atual.total,
              usuarios: usuariosAtualizados,
            },
            this.ttl,
          );
        }),
        catchError((error) =>
          throwError(
            () => new Error(extrairMensagemErroApi(error?.error, 'Nao foi possivel atualizar.')),
          ),
        ),
      );
  }

  excluir(id: string, senhaAtual: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}?id=${encodeURIComponent(id)}`, {
        body: { senhaAtual },
        withCredentials: true,
      })
      .pipe(
        tap(() => {
          const atual = this.cache.get<ListarUsuariosResponse>(this.cacheKeyListagem);
          if (!atual) return;

          const usuarios: UsuarioListaItem[] = atual.usuarios.filter(
            (u: UsuarioListaItem) => u.id !== id,
          );

          this.cache.set(
            this.cacheKeyListagem,
            {
              total: Math.max(0, atual.total - 1),
              usuarios,
            },
            this.ttl,
          );
        }),
        catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error)))),
      );
  }

  editarMinhaConta(
    usuarioId: string,
    payload: EditarMinhaContaPayload,
  ): Observable<UsuarioAtualizadoResponse> {
    const body: Record<string, string> = {
      senha_atual: payload.senhaAtual,
    };

    if (payload.nome !== undefined) body['nome'] = payload.nome;
    if (payload.email !== undefined) body['email'] = payload.email;
    if (payload.senhaNova !== undefined) body['senha'] = payload.senhaNova;

    return this.http
      .put<UsuarioAtualizadoResponse>(`${this.apiUrl}?id=${encodeURIComponent(usuarioId)}`, body, {
        withCredentials: true,
      })
      .pipe(
        tap((resposta) => {
          const atual = this.cache.get<ListarUsuariosResponse>(this.cacheKeyListagem);
          if (!atual) return;

          const usuariosAtualizados = atual.usuarios.map((u) =>
            u.id === usuarioId ? resposta.usuario : u,
          );

          this.cache.set(
            this.cacheKeyListagem,
            {
              total: atual.total,
              usuarios: usuariosAtualizados,
            },
            this.ttl,
          );
        }),
        catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error)))),
      );
  }

  private extrairMensagemErro(payload: ErroApiResponse | undefined): string {
    if (payload?.erro?.trim()) return payload.erro;
    if (payload?.message?.trim()) return payload.message;
    return 'Não foi possível processar a solicitação. Tente novamente.';
  }
}
