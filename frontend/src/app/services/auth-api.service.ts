import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

interface UsuarioAutenticado {
  id: number;
  nome: string;
  email: string;
  tipo_usuario: 'admin' | 'operador';
}

export interface LoginResponse {
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
  private sessaoAtiva = false;

  constructor(private readonly http: HttpClient) {}

  login(email: string, senha: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(this.apiUrl, { email, senha }, { withCredentials: true })
      .pipe(
        tap(() => {
          this.sessaoAtiva = true;
        }),
        catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error)))),
      );
  }

  validarSessao(): Observable<boolean> {
    return this.http
      .get<{ usuario: UsuarioAutenticado }>(this.apiUrl, { withCredentials: true })
      .pipe(
        map(() => {
          this.sessaoAtiva = true;
          return true;
        }),
        catchError(() => {
          this.sessaoAtiva = false;
          return of(false);
        }),
      );
  }

  logout(): Observable<{ mensagem: string }> {
    return this.http.delete<{ mensagem: string }>(this.apiUrl, { withCredentials: true }).pipe(
      tap(() => this.removerToken()),
      catchError((error) => {
        this.removerToken();
        return throwError(() => new Error(this.extrairMensagemErro(error?.error)));
      }),
    );
  }

  possuiToken(): boolean {
    return this.sessaoAtiva;
  }

  removerToken(): void {
    this.sessaoAtiva = false;
  }

  private extrairMensagemErro(payload: ErroApiResponse | undefined): string {
    if (payload && typeof payload.erro === 'string' && payload.erro.trim()) {
      return payload.erro;
    }

    return 'Nao foi possivel processar a autenticacao. Tente novamente.';
  }
}
