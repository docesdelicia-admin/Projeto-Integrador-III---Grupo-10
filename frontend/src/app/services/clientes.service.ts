import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { CacheStoreService } from './cache-store.service';

export interface Cliente {
  id: string;
  nome: string;
  telefone: string | null;
  observacoes: string | null;
  criado_em: string;
}

interface ListaClientesResponse {
  total: number;
  clientes: Cliente[];
}

export interface ClientesFiltro {
  q?: string;
  dataInicio?: string;
  dataFim?: string;
}

export interface ClientePayload {
  nome: string;
  telefone?: string;
  observacoes?: string;
}

interface ClienteResponse {
  mensagem: string;
  cliente: Cliente;
}

interface ErroApiResponse {
  erro?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ClientesService {
  private readonly apiUrl = '/api/clientes';
  private readonly ttlMs = 30 * 1000;
  private readonly prefixoChave = 'clients:';

  constructor(
    private readonly http: HttpClient,
    private readonly cacheStore: CacheStoreService,
  ) {}

  listar(filtros: ClientesFiltro = {}): Observable<ListaClientesResponse> {
    const key = this.criarChaveCache(filtros);
    const params = this.criarHttpParams(filtros);
    const request$ = this.http.get<ListaClientesResponse>(this.apiUrl, {
      params,
      withCredentials: true,
    });
    return this.cacheStore
      .getData(key, request$, this.ttlMs)
      .pipe(
        catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error)))),
      );
  }

  private criarChaveCache(filtros: ClientesFiltro): string {
    const q = filtros.q?.trim() || 'all';
    const inicio = filtros.dataInicio || 'na';
    const fim = filtros.dataFim || 'na';

    return `${this.prefixoChave}${q}:${inicio}-${fim}`;
  }

  private criarHttpParams(filtros: ClientesFiltro): HttpParams {
    let params = new HttpParams();

    if (filtros.q?.trim()) {
      params = params.set('q', filtros.q.trim());
    }

    if (filtros.dataInicio) {
      params = params.set('data_inicio', filtros.dataInicio);
    }

    if (filtros.dataFim) {
      params = params.set('data_fim', filtros.dataFim);
    }

    return params;
  }

  buscar(termo: string): Observable<Cliente[]> {
    const query = termo.trim();

    if (!query) {
      return of([]);
    }

    const params = new HttpParams().set('q', query);

    return this.http
      .get<ListaClientesResponse>(this.apiUrl, { params, withCredentials: true })
      .pipe(
        map((res) => res?.clientes ?? []),
        catchError((error) => {
          console.error(error);
          return of([]);
        }),
      );
  }

  criar(payload: ClientePayload): Observable<ClienteResponse> {
    return this.http.post<ClienteResponse>(this.apiUrl, payload, { withCredentials: true }).pipe(
      tap((resposta) => this.addClienteToCache(resposta.cliente)),
      catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error)))),
    );
  }

  editar(id: string, payload: Partial<ClientePayload>): Observable<ClienteResponse> {
    this.updateClienteInCache(id, payload);

    return this.http
      .put<ClienteResponse>(`${this.apiUrl}?id=${encodeURIComponent(id)}`, payload, {
        withCredentials: true,
      })
      .pipe(
        tap((resposta) => this.updateClienteInCache(id, resposta.cliente)),
        catchError((error) => {
          this.cacheStore.invalidateByPrefix(this.prefixoChave);
          return throwError(() => new Error(this.extrairMensagemErro(error?.error)));
        }),
      );
  }

  excluir(id: string, senhaAtual: string): Observable<{ mensagem: string }> {
    this.removeClienteFromCache(id);

    return this.http
      .delete<{ mensagem: string }>(`${this.apiUrl}?id=${encodeURIComponent(id)}`, {
        withCredentials: true,
        body: { senha_atual: senhaAtual },
      })
      .pipe(
        catchError((error) => {
          this.cacheStore.invalidateByPrefix(this.prefixoChave);
          return throwError(() => new Error(this.extrairMensagemErro(error?.error)));
        }),
      );
  }

  obterClientesEmCache(): Cliente[] {
    const entrada = this.cacheStore.getStale<ListaClientesResponse>(`${this.prefixoChave}all`);
    return entrada?.clientes ?? [];
  }

  // ── Cache helpers ──────────────────────────────────────────────────────────

  private addClienteToCache(novoCliente: Cliente): void {
    const entries = this.cacheStore.entriesByPrefix<ListaClientesResponse>(this.prefixoChave);

    for (const entry of entries) {
      const semDuplicidade = entry.value.clientes.filter((c) => c.id !== novoCliente.id);
      const clientesAtualizados = [novoCliente, ...semDuplicidade];

      this.cacheStore.set(
        entry.key,
        { ...entry.value, total: clientesAtualizados.length, clientes: clientesAtualizados },
        this.ttlMs,
      );
    }
  }

  private updateClienteInCache(id: string, changes: Partial<Cliente>): void {
    const entries = this.cacheStore.entriesByPrefix<ListaClientesResponse>(this.prefixoChave);

    for (const entry of entries) {
      const clientesAtualizados = entry.value.clientes.map((c) =>
        c.id === id ? { ...c, ...changes } : c,
      );

      this.cacheStore.set(entry.key, { ...entry.value, clientes: clientesAtualizados }, this.ttlMs);
    }
  }

  private removeClienteFromCache(id: string): void {
    const entries = this.cacheStore.entriesByPrefix<ListaClientesResponse>(this.prefixoChave);

    for (const entry of entries) {
      const clientesAtualizados = entry.value.clientes.filter((c) => c.id !== id);

      this.cacheStore.set(
        entry.key,
        { ...entry.value, total: clientesAtualizados.length, clientes: clientesAtualizados },
        this.ttlMs,
      );
    }
  }

  // ── Erro ───────────────────────────────────────────────────────────────────

  private extrairMensagemErro(payload: ErroApiResponse | undefined): string {
    if (payload && typeof payload.erro === 'string' && payload.erro.trim()) {
      return payload.erro;
    }

    return 'Nao foi possivel processar clientes. Tente novamente.';
  }
}
