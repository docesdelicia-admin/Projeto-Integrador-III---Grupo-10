import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { CacheStoreService } from './cache-store.service';

export type PedidoStatus = 'novo' | 'em_producao' | 'entregue' | 'cancelado';

export interface Pedido {
  id: string;
  cliente_id: string;
  data_pedido: string;
  data_entrega: string | null;
  status: PedidoStatus;
  observacoes: string | null;
  criado_em: string;
}

interface ListaPedidosResponse {
  total: number;
  pedidos: Pedido[];
}

export interface PedidosFiltro {
  status?: PedidoStatus;
  dataInicio?: string;
  dataFim?: string;
}

export interface PedidoPayload {
  cliente_id: string;
  data_pedido: string;
  data_entrega?: string | null;
  status?: PedidoStatus;
  observacoes?: string;
}

interface PedidoResponse {
  mensagem: string;
  pedido: Pedido;
}

interface ErroApiResponse {
  erro?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PedidosService {
  private readonly apiUrl = '/api/pedidos';
  private readonly ttlPedidosMs = 30 * 1000;
  private readonly prefixoChave = 'orders:';

  constructor(
    private readonly http: HttpClient,
    private readonly cacheStore: CacheStoreService,
  ) {}

  listar(filtros: PedidosFiltro = {}): Observable<ListaPedidosResponse> {
    const key = this.criarChaveCache(filtros);
    const params = this.criarHttpParams(filtros);
    const request$ = this.http.get<ListaPedidosResponse>(this.apiUrl, {
      params,
      withCredentials: true,
    });
    return this.cacheStore
      .getData(key, request$, this.ttlPedidosMs)
      .pipe(
        catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error)))),
      );
  }

  obterPedidosEmCache(filtros: PedidosFiltro = {}): Pedido[] {
    const key = this.criarChaveCache(filtros);
    const entrada = this.cacheStore.getStale<ListaPedidosResponse>(key);
    return entrada?.pedidos ?? [];
  }

  criar(payload: PedidoPayload): Observable<PedidoResponse> {
    return this.http.post<PedidoResponse>(this.apiUrl, payload, { withCredentials: true }).pipe(
      tap((resposta) => this.addOrderToCache(resposta.pedido)),
      catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error)))),
    );
  }

  editar(id: string, payload: Partial<PedidoPayload>): Observable<PedidoResponse> {
    this.updateOrderInCache(id, payload);

    return this.http
      .put<PedidoResponse>(`${this.apiUrl}?id=${encodeURIComponent(id)}`, payload, {
        withCredentials: true,
      })
      .pipe(
        tap((resposta) => this.updateOrderInCache(id, resposta.pedido)),
        catchError((error) => {
          this.cacheStore.invalidateByPrefix(this.prefixoChave);
          return throwError(() => new Error(this.extrairMensagemErro(error?.error)));
        }),
      );
  }

  excluir(id: string): Observable<{ mensagem: string }> {
    this.removeOrderFromCache(id);

    return this.http
      .delete<{
        mensagem: string;
      }>(`${this.apiUrl}?id=${encodeURIComponent(id)}`, { withCredentials: true })
      .pipe(
        catchError((error) => {
          this.cacheStore.invalidateByPrefix(this.prefixoChave);
          return throwError(() => new Error(this.extrairMensagemErro(error?.error)));
        }),
      );
  }

  updateOrderInCache(orderId: string, changes: Partial<Pedido>): void {
    const entries = this.cacheStore.entriesByPrefix<ListaPedidosResponse>(this.prefixoChave);

    for (const entry of entries) {
      const pedidosAtualizados = entry.value.pedidos.map((pedido) =>
        pedido.id === orderId ? { ...pedido, ...changes } : pedido,
      );

      this.cacheStore.set(
        entry.key,
        {
          ...entry.value,
          pedidos: pedidosAtualizados,
        },
        this.ttlPedidosMs,
      );
    }
  }

  addOrderToCache(newOrder: Pedido): void {
    const entries = this.cacheStore.entriesByPrefix<ListaPedidosResponse>(this.prefixoChave);

    for (const entry of entries) {
      if (!this.pedidoCombinaComFiltro(entry.key, newOrder)) {
        continue;
      }

      const semDuplicidade = entry.value.pedidos.filter((pedido) => pedido.id !== newOrder.id);
      const pedidosAtualizados = [newOrder, ...semDuplicidade];

      this.cacheStore.set(
        entry.key,
        {
          ...entry.value,
          total: pedidosAtualizados.length,
          pedidos: pedidosAtualizados,
        },
        this.ttlPedidosMs,
      );
    }
  }

  private removeOrderFromCache(orderId: string): void {
    const entries = this.cacheStore.entriesByPrefix<ListaPedidosResponse>(this.prefixoChave);

    for (const entry of entries) {
      const pedidosAtualizados = entry.value.pedidos.filter((pedido) => pedido.id !== orderId);

      this.cacheStore.set(
        entry.key,
        {
          ...entry.value,
          total: pedidosAtualizados.length,
          pedidos: pedidosAtualizados,
        },
        this.ttlPedidosMs,
      );
    }
  }

  private pedidoCombinaComFiltro(cacheKey: string, pedido: Pedido): boolean {
    const [, status, intervalo] = cacheKey.split(':');

    const combinaStatus = status === 'all' || pedido.status === status;
    if (!combinaStatus) {
      return false;
    }

    if (!intervalo || intervalo === 'na-na') {
      return true;
    }

    const [inicio, fim] = intervalo.split('-');
    const dataPedido = pedido.data_pedido;

    const combinaInicio = !inicio || inicio === 'na' || dataPedido >= inicio;
    const combinaFim = !fim || fim === 'na' || dataPedido <= fim;

    return combinaInicio && combinaFim;
  }

  private criarChaveCache(filtros: PedidosFiltro): string {
    const status = filtros.status ?? 'all';
    const inicio = filtros.dataInicio ?? 'na';
    const fim = filtros.dataFim ?? 'na';

    return `${this.prefixoChave}${status}:${inicio}-${fim}`;
  }

  private criarHttpParams(filtros: PedidosFiltro): HttpParams {
    let params = new HttpParams();

    if (filtros.status) {
      params = params.set('status', filtros.status);
    }

    if (filtros.dataInicio) {
      params = params.set('data_inicio', filtros.dataInicio);
    }

    if (filtros.dataFim) {
      params = params.set('data_fim', filtros.dataFim);
    }

    return params;
  }

  private extrairMensagemErro(payload: ErroApiResponse | undefined): string {
    if (payload && typeof payload.erro === 'string' && payload.erro.trim()) {
      return payload.erro;
    }

    return 'Nao foi possivel processar pedidos. Tente novamente.';
  }
}
