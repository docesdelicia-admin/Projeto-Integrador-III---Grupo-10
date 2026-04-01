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
  private readonly tempoCacheMs = 24 * 60 * 60 * 1000;
  private readonly chaveCacheLista = 'docesdelicia.produtos.lista';
  private readonly chaveCacheListaPublica = 'docesdelicia.produtos.lista-publica';
  private cacheLista: ListaProdutosResponse | null = null;
  private cacheListaAtualizadaEm = 0;
  private cacheListaPublica: ListaProdutosResponse | null = null;
  private cacheListaPublicaAtualizadaEm = 0;

  constructor(private readonly http: HttpClient) {
    this.hidratarCachesDoStorage();
  }

  listar(forceRefresh = false): Observable<ListaProdutosResponse> {
    if (!forceRefresh) {
      this.reidratarCacheListaSeNecessario();
    }

    if (!forceRefresh && this.temCacheValido()) {
      return of(this.cacheLista as ListaProdutosResponse);
    }

    return this.http.get<ListaProdutosResponse>(this.apiUrl, { withCredentials: true }).pipe(
      tap((resposta) => this.salvarCacheLista(resposta)),
      catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error)))),
    );
  }

  listarPublico(forceRefresh = false): Observable<ListaProdutosResponse> {
    if (!forceRefresh) {
      this.reidratarCacheListaPublicaSeNecessario();
    }

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
    this.persistirCache(this.chaveCacheLista, resposta, this.cacheListaAtualizadaEm);
  }

  private salvarCacheListaPublica(resposta: ListaProdutosResponse): void {
    this.cacheListaPublica = resposta;
    this.cacheListaPublicaAtualizadaEm = Date.now();
    this.persistirCache(this.chaveCacheListaPublica, resposta, this.cacheListaPublicaAtualizadaEm);
  }

  private invalidarCacheLista(): void {
    this.cacheLista = null;
    this.cacheListaAtualizadaEm = 0;
    this.cacheListaPublica = null;
    this.cacheListaPublicaAtualizadaEm = 0;
    this.removerCachePersistido(this.chaveCacheLista);
    this.removerCachePersistido(this.chaveCacheListaPublica);
  }

  private temCachePublicoValido(): boolean {
    return this.cacheListaPublica !== null && Date.now() - this.cacheListaPublicaAtualizadaEm < this.tempoCacheMs;
  }

  private hidratarCachesDoStorage(): void {
    this.hidratarCache(this.chaveCacheLista, (resposta, atualizadoEm) => {
      this.cacheLista = resposta;
      this.cacheListaAtualizadaEm = atualizadoEm;
    });

    this.hidratarCache(this.chaveCacheListaPublica, (resposta, atualizadoEm) => {
      this.cacheListaPublica = resposta;
      this.cacheListaPublicaAtualizadaEm = atualizadoEm;
    });
  }

  private reidratarCacheListaSeNecessario(): void {
    if (this.temCacheValido()) {
      return;
    }

    this.hidratarCache(this.chaveCacheLista, (resposta, atualizadoEm) => {
      this.cacheLista = resposta;
      this.cacheListaAtualizadaEm = atualizadoEm;
    });
  }

  private reidratarCacheListaPublicaSeNecessario(): void {
    if (this.temCachePublicoValido()) {
      return;
    }

    this.hidratarCache(this.chaveCacheListaPublica, (resposta, atualizadoEm) => {
      this.cacheListaPublica = resposta;
      this.cacheListaPublicaAtualizadaEm = atualizadoEm;
    });
  }

  private hidratarCache(
    chave: string,
    definir: (resposta: ListaProdutosResponse, atualizadoEm: number) => void,
  ): void {
    const entrada = this.lerCachePersistido(chave);
    if (!entrada) {
      return;
    }

    if (Date.now() - entrada.atualizadoEm >= this.tempoCacheMs) {
      this.removerCachePersistido(chave);
      return;
    }

    definir(entrada.resposta, entrada.atualizadoEm);
  }

  private persistirCache(
    chave: string,
    resposta: ListaProdutosResponse,
    atualizadoEm: number,
  ): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(
      chave,
      JSON.stringify({ resposta, atualizadoEm }),
    );
  }

  private lerCachePersistido(chave: string): { resposta: ListaProdutosResponse; atualizadoEm: number } | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const bruto = window.localStorage.getItem(chave);
    if (!bruto) {
      return null;
    }

    try {
      const entrada = JSON.parse(bruto) as { resposta?: ListaProdutosResponse; atualizadoEm?: number };

      if (!entrada.resposta || typeof entrada.atualizadoEm !== 'number') {
        return null;
      }

      return {
        resposta: entrada.resposta,
        atualizadoEm: entrada.atualizadoEm,
      };
    } catch {
      return null;
    }
  }

  private removerCachePersistido(chave: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.removeItem(chave);
  }

  private extrairMensagemErro(payload: ErroApiResponse | undefined): string {
    if (payload && typeof payload.erro === 'string' && payload.erro.trim()) {
      return payload.erro;
    }

    return 'Nao foi possivel processar produtos. Tente novamente.';
  }
}
