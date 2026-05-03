import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { CacheStoreService } from './cache-store.service';

export interface Insumo {
  id: string;
  nome: string;
  descricao: string | null;
  unidade_medida: string;
  criado_em: string;
}

interface ListaInsumosResponse {
  total: number;
  insumos: Insumo[];
}

export interface InsumoPayload {
  nome: string;
  descricao?: string;
  unidade_medida: string;
}

interface InsumoResponse {
  mensagem: string;
  insumo: Insumo;
}

interface ErroApiResponse {
  erro?: string;
}

@Injectable({
  providedIn: 'root',
})
export class InsumosService {
  private readonly apiUrl = '/api/insumos';
  private readonly chaveCacheLista = 'supplies';
  private readonly ttlInsumosMs = 60 * 60 * 1000;

  constructor(
    private readonly http: HttpClient,
    private readonly cacheStore: CacheStoreService,
  ) {}

  listar(): Observable<ListaInsumosResponse> {
    const request$ = this.http.get<ListaInsumosResponse>(this.apiUrl, { withCredentials: true });

    return this.cacheStore
      .getData(this.chaveCacheLista, request$, this.ttlInsumosMs)
      .pipe(
        catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error)))),
      );
  }

  obterInsumosEmCache(): Insumo[] {
    const entrada = this.cacheStore.getStale<ListaInsumosResponse>(this.chaveCacheLista);
    return entrada?.insumos ?? [];
  }

  criar(payload: InsumoPayload): Observable<InsumoResponse> {
    return this.http.post<InsumoResponse>(this.apiUrl, payload, { withCredentials: true }).pipe(
      tap(() => this.cacheStore.invalidate(this.chaveCacheLista)),
      catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error)))),
    );
  }

  editar(id: string, payload: Partial<InsumoPayload>): Observable<InsumoResponse> {
    return this.http
      .put<InsumoResponse>(`${this.apiUrl}?id=${encodeURIComponent(id)}`, payload, {
        withCredentials: true,
      })
      .pipe(
        tap(() => this.cacheStore.invalidate(this.chaveCacheLista)),
        catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error)))),
      );
  }

  excluir(id: string): Observable<{ mensagem: string }> {
    return this.http
      .delete<{
        mensagem: string;
      }>(`${this.apiUrl}?id=${encodeURIComponent(id)}`, { withCredentials: true })
      .pipe(
        tap(() => this.cacheStore.invalidate(this.chaveCacheLista)),
        catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error)))),
      );
  }

  private extrairMensagemErro(payload: ErroApiResponse | undefined): string {
    if (payload && typeof payload.erro === 'string' && payload.erro.trim()) {
      return payload.erro;
    }

    return 'Nao foi possivel processar insumos. Tente novamente.';
  }
}
