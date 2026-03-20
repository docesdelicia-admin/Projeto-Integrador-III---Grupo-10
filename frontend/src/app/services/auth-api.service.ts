import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

interface UsuarioAutenticado {
  id: number;
  nome: string;
  email: string;
  tipo_usuario: 'admin' | 'operador';
}

export interface LoginResponse {
  token: string;
  tipo_token: 'Bearer';
  expira_em: string;
  usuario: UsuarioAutenticado;
}

interface ErroApiResponse {
  erro?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly apiUrl = '/api/auth';
  private readonly tokenStorageKey = 'doces-delicia:auth-token';

  constructor(private readonly http: HttpClient) {}

  login(email: string, senha: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.apiUrl, { email, senha }).pipe(
      tap((response) => this.salvarToken(response.token)),
      catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error)))),
    );
  }

  logout(): Observable<{ mensagem: string }> {
    return this.http
      .delete<{ mensagem: string }>(this.apiUrl, {
        headers: this.criarHeadersAutenticacao(),
      })
      .pipe(
        tap(() => this.removerToken()),
        catchError((error) => {
          this.removerToken();
          return throwError(() => new Error(this.extrairMensagemErro(error?.error)));
        }),
      );
  }

  possuiToken(): boolean {
    return this.obterToken() !== null;
  }

  obterToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.localStorage.getItem(this.tokenStorageKey);
  }

  removerToken(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.removeItem(this.tokenStorageKey);
  }

  private salvarToken(token: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(this.tokenStorageKey, token);
  }

  private criarHeadersAutenticacao(): HttpHeaders {
    const token = this.obterToken();

    if (!token) {
      return new HttpHeaders();
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  private extrairMensagemErro(payload: ErroApiResponse | undefined): string {
    if (payload && typeof payload.erro === 'string' && payload.erro.trim()) {
      return payload.erro;
    }

    return 'Nao foi possivel processar a autenticacao. Tente novamente.';
  }
}
