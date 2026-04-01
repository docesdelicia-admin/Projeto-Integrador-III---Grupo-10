import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface Produto {
  id: string;
  nome: string;
  categoria: string | null;
  descricao: string | null;
  preco: string;
  fotos: string[];
  ativo: boolean;
  criado_em: string;
}

interface ListaProdutosResponse {
  total: number;
  produtos: Produto[];
}

export interface ProdutoPayload {
  nome: string;
  categoria?: string;
  descricao?: string;
  preco: number;
  fotos: string[];
  ativo: boolean;
}

interface ProdutoResponse {
  mensagem: string;
  produto: Produto;
}

interface ErroApiResponse {
  erro?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProdutosService {
  private readonly apiUrl = '/api/produtos';
  private readonly tempoCacheMs = 5 * 60 * 1000;
  private cacheLista: ListaProdutosResponse | null = null;
  private cacheListaAtualizadaEm = 0;
  private cacheListaPublica: ListaProdutosResponse | null = null;
  private cacheListaPublicaAtualizadaEm = 0;

  constructor(private readonly http: HttpClient) {}

  listar(forceRefresh = false): Observable<ListaProdutosResponse> {
    if (!forceRefresh && this.temCacheValido()) {
      return of(this.cacheLista as ListaProdutosResponse);
    }

    return this.http.get<ListaProdutosResponse>(this.apiUrl, { withCredentials: true }).pipe(
      tap((resposta) => this.salvarCacheLista(resposta)),
      catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error)))),
    );
  }

  listarPublico(forceRefresh = false): Observable<ListaProdutosResponse> {
    if (!forceRefresh && this.temCachePublicoValido()) {
      return of(this.cacheListaPublica as ListaProdutosResponse);
    }

    return this.http.get<ListaProdutosResponse>(`${this.apiUrl}?publico=1`).pipe(
      tap((resposta) => this.salvarCacheListaPublica(resposta)),
      catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error))))
    );
  }

  criar(payload: ProdutoPayload): Observable<ProdutoResponse> {
    return this.http.post<ProdutoResponse>(this.apiUrl, payload, { withCredentials: true }).pipe(
      tap(() => this.invalidarCacheLista()),
      catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error)))),
    );
  }

  editar(id: string, payload: ProdutoPayload): Observable<ProdutoResponse> {
    return this.http
      .put<ProdutoResponse>(`${this.apiUrl}?id=${encodeURIComponent(id)}`, payload, {
        withCredentials: true,
      })
      .pipe(
        tap(() => this.invalidarCacheLista()),
        catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error)))),
      );
  }

  excluir(id: string): Observable<{ mensagem: string }> {
    return this.http
      .delete<{
        mensagem: string;
      }>(`${this.apiUrl}?id=${encodeURIComponent(id)}`, { withCredentials: true })
      .pipe(
        tap(() => this.invalidarCacheLista()),
        catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error)))),
      );
  }

  private temCacheValido(): boolean {
    return this.cacheLista !== null && Date.now() - this.cacheListaAtualizadaEm < this.tempoCacheMs;
  }

  private salvarCacheLista(resposta: ListaProdutosResponse): void {
    this.cacheLista = resposta;
    this.cacheListaAtualizadaEm = Date.now();
  }

  private salvarCacheListaPublica(resposta: ListaProdutosResponse): void {
    this.cacheListaPublica = resposta;
    this.cacheListaPublicaAtualizadaEm = Date.now();
  }

  private invalidarCacheLista(): void {
    this.cacheLista = null;
    this.cacheListaAtualizadaEm = 0;
    this.cacheListaPublica = null;
    this.cacheListaPublicaAtualizadaEm = 0;
  }

  private temCachePublicoValido(): boolean {
    return this.cacheListaPublica !== null && Date.now() - this.cacheListaPublicaAtualizadaEm < this.tempoCacheMs;
  }

  private extrairMensagemErro(payload: ErroApiResponse | undefined): string {
    if (payload && typeof payload.erro === 'string' && payload.erro.trim()) {
      return payload.erro;
    }

    return 'Nao foi possivel processar produtos. Tente novamente.';
  }
}
