import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { CacheStoreService } from './cache-store.service';

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
  private readonly ttlProdutosMs = 60 * 60 * 1000;
  private readonly ttlProdutosPublicosMs = 30 * 60 * 1000;
  private readonly chaveCacheLista = 'products';
  private readonly chaveCacheListaPublica = 'products:public';

  constructor(
    private readonly http: HttpClient,
    private readonly cacheStore: CacheStoreService,
  ) {}

  listar(): Observable<ListaProdutosResponse> {
    const request$ = this.http.get<ListaProdutosResponse>(this.apiUrl, { withCredentials: true });

    return this.cacheStore
      .getData(this.chaveCacheLista, request$, this.ttlProdutosMs)
      .pipe(
        catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error)))),
      );
  }

  listarPublico(): Observable<ListaProdutosResponse> {
    const request$ = this.http.get<ListaProdutosResponse>(`${this.apiUrl}?publico=1`);

    return this.cacheStore
      .getData(this.chaveCacheListaPublica, request$, this.ttlProdutosPublicosMs)
      .pipe(
        catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error)))),
      );
  }

  obterProdutosPublicosEmCache(): Produto[] {
    const entrada = this.cacheStore.getStale<ListaProdutosResponse>(this.chaveCacheListaPublica);
    return entrada?.produtos ?? [];
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

  excluir(id: string, senhaAtual: string): Observable<{ mensagem: string }> {
    return this.http
      .delete<{
        mensagem: string;
      }>(`${this.apiUrl}?id=${encodeURIComponent(id)}`, {
        withCredentials: true,
        body: { senha_atual: senhaAtual },
      })
      .pipe(
        tap(() => this.invalidarCacheLista()),
        catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error)))),
      );
  }

  private invalidarCacheLista(): void {
    this.cacheStore.invalidate(this.chaveCacheLista);
    this.cacheStore.invalidate(this.chaveCacheListaPublica);
  }

  private extrairMensagemErro(payload: ErroApiResponse | undefined): string {
    if (payload && typeof payload.erro === 'string' && payload.erro.trim()) {
      return payload.erro;
    }

    return 'Nao foi possivel processar produtos. Tente novamente.';
  }
}
