import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { of, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize, switchMap } from 'rxjs/operators';

import { HeaderComponent } from '../../components/header/header.component';
import { PasswordConfirmModalComponent } from '../../components/password-confirm-modal/password-confirm-modal.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import {
  TabelaColuna,
  TabelaLinha,
  TabelaComponent,
} from '../../components/tabela/tabela.component';

import { AuthService } from '../../services/auth.service';
import { Cliente, ClientesService } from '../../services/clientes.service';
import { Pedido, PedidosService, PedidoStatus } from '../../services/pedidos.service';
import { ToastService } from '../../services/toast.service';
import { ModalComponent } from '../../components/modal/modal.component';
import { FiltroCampo, FiltrosComponent } from '../../components/filtros/filtros.component';

type EtapaCriacao = 'escolha' | 'novo-cliente' | 'buscar-cliente' | 'dados-pedido';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HeaderComponent,
    SidebarComponent,
    TabelaComponent,
    PasswordConfirmModalComponent,
    ModalComponent,
    FiltrosComponent,
  ],
  templateUrl: './pedidos.component.html',
  styleUrl: './pedidos.component.scss',
})
export class PedidosPage implements OnInit {
  // Cache de sessão para buscas de clientes
  private readonly cacheBuscaClientes = new Map<string, Cliente[]>();
  // Cache de sessão para listagem de pedidos
  private readonly cachePedidos = new Map<string, TabelaLinha[]>();
  private readonly authService = inject(AuthService);
  private readonly pedidosService = inject(PedidosService);
  private readonly clientesService = inject(ClientesService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  // ── Tabela ──────────────────────────────────────────────────────────────────

  readonly colunasTabela: TabelaColuna[] = [
    { chave: 'cliente_nome', titulo: 'Cliente' },
    {
      chave: 'data_pedido',
      titulo: 'Data do Pedido',
      formatador: (valor) => this.formatarData(valor),
    },
    {
      chave: 'data_entrega',
      titulo: 'Data de Entrega',
      formatador: (valor) => this.formatarData(valor),
    },
    {
      chave: 'status',
      titulo: 'Status',
      formatador: (valor) => this.formatarStatus(valor),
    },
    { chave: 'observacoes', titulo: 'Observações' },
  ];

  readonly linhas = signal<TabelaLinha[]>([]);
  readonly carregando = signal(false);
  readonly isAdmin = signal(false);
  readonly filtrosAtuais = signal<Record<string, string>>(this.criarFiltrosPadrao());

  readonly camposFiltro: FiltroCampo[] = [
    {
      key: 'cliente',
      label: 'Cliente',
      type: 'text',
      placeholder: 'Buscar por nome do cliente...',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'multicheck',
      options: [
        { label: 'Novo', value: 'novo' },
        { label: 'Em produção', value: 'em_producao' },
        { label: 'Entregue', value: 'entregue' },
        { label: 'Cancelado', value: 'cancelado' },
      ],
    },
    { key: 'data_inicio', label: 'Data inicial', type: 'date' },
    { key: 'data_fim', label: 'Data final', type: 'date' },
  ];

  // ── Modal novo pedido ────────────────────────────────────────────────────────

  readonly modalNovoPedidoAberto = signal(false);
  readonly etapaCriacao = signal<EtapaCriacao>('escolha');

  // Etapa: novo cliente
  readonly formNovoCliente = this.fb.nonNullable.group({
    nome: ['', Validators.required],
    telefone: [''],
    observacoes: [''],
  });
  readonly salvandoCliente = signal(false);
  readonly erroCliente = signal('');

  // Etapa: buscar cliente
  readonly termoBuscaCliente = signal('');
  readonly resultadosBuscaCliente = signal<Cliente[]>([]);
  readonly buscandoCliente = signal(false);
  private readonly buscaSubject = new Subject<string>();

  // Cliente selecionado (novo ou existente)
  readonly clienteSelecionado = signal<Cliente | null>(null);

  // Etapa: dados do pedido
  readonly formPedido = this.fb.nonNullable.group({
    data_pedido: ['', Validators.required],
    data_entrega: [''],
    status: ['novo' as PedidoStatus],
    observacoes: [''],
  });
  readonly salvandoPedido = signal(false);
  readonly erroPedido = signal('');

  // ── Modal visualizar/editar pedido ──────────────────────────────────────────

  readonly modalVisualizarAberto = signal(false);
  readonly pedidoSelecionado = signal<Pedido | null>(null);

  // Computed helpers para acesso tipado no template
  readonly nomeClientePedido = computed(() => this.pedidoSelecionado()?.cliente_nome ?? '');
  readonly statusPedidoSelecionado = computed(() => this.pedidoSelecionado()?.status ?? null);

  readonly formEdicaoPedido = this.fb.nonNullable.group({
    data_pedido: ['', Validators.required],
    data_entrega: [''],
    status: ['novo' as PedidoStatus],
    observacoes: [''],
  });
  readonly salvandoEdicao = signal(false);
  readonly erroEdicao = signal('');

  // ── Modal confirmação cancelamento ──────────────────────────────────────────

  readonly modalConfirmaCancelamentoAberto = signal(false);
  readonly salvandoCancelamento = signal(false);

  // ── Ações da tabela ─────────────────────────────────────────────────────────

  // Reutiliza acaoEditar como "visualizar" pois TabelaComponent expõe esse input
  readonly acaoEditarPedido = (linha: TabelaLinha): void => {
    this.abrirModalVisualizar(linha);
  };

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.isAdmin.set(this.authService.isAdmin());
    this.carregarPedidos(this.filtrosAtuais());
    this.configurarBuscaCliente();
  }

  // ── Carregar pedidos ────────────────────────────────────────────────────────

  onFiltrosChange(filtros: Record<string, string>): void {
    this.filtrosAtuais.set({ ...filtros });
    this.carregarPedidos(filtros);
  }

  private carregarPedidos(filtros: Record<string, string>): void {
    this.carregando.set(true);
    const cacheKey = JSON.stringify(filtros);
    if (this.cachePedidos.has(cacheKey)) {
      this.linhas.set(this.cachePedidos.get(cacheKey)!);
      this.carregando.set(false);
      return;
    }

    const filtrosServico = {
      status: filtros['status']
        ? (filtros['status']
            .split(',')
            .map((status) => status.trim())
            .filter(Boolean) as PedidoStatus[])
        : undefined,
      cliente: filtros['cliente']?.trim() || undefined,
      dataInicio: filtros['data_inicio'] || undefined,
      dataFim: filtros['data_fim'] || undefined,
    };

    this.pedidosService
      .listar(filtrosServico)
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: (res) => {
          const mapped = this.mapearPedidos(res.pedidos ?? []);
          this.linhas.set(mapped);
          this.cachePedidos.set(cacheKey, mapped);
        },
        error: (err: Error) => {
          this.toastService.erro(err.message);
          this.linhas.set([]);
        },
      });
  }

  private mapearPedidos(pedidos: Pedido[]): TabelaLinha[] {
    return pedidos.map((p) => ({ ...p }) as TabelaLinha);
  }

  // ── Modal novo pedido: navegação de etapas ──────────────────────────────────

  abrirModalNovoPedido(): void {
    this.etapaCriacao.set('escolha');
    this.clienteSelecionado.set(null);
    this.termoBuscaCliente.set('');
    this.resultadosBuscaCliente.set([]);
    this.erroCliente.set('');
    this.erroPedido.set('');
    this.formNovoCliente.reset({ nome: '', telefone: '', observacoes: '' });
    this.formPedido.reset({ data_pedido: '', data_entrega: '', status: 'novo', observacoes: '' });
    this.modalNovoPedidoAberto.set(true);
  }

  fecharModalNovoPedido(): void {
    if (this.salvandoCliente() || this.salvandoPedido()) return;
    this.modalNovoPedidoAberto.set(false);
  }

  voltarParaEscolha(): void {
    this.etapaCriacao.set('escolha');
    this.clienteSelecionado.set(null);
    this.erroCliente.set('');
    this.termoBuscaCliente.set('');
    this.resultadosBuscaCliente.set([]);
    this.formNovoCliente.reset({ nome: '', telefone: '', observacoes: '' });
  }

  irParaNovoCliente(): void {
    this.etapaCriacao.set('novo-cliente');
  }

  irParaClienteExistente(): void {
    this.etapaCriacao.set('buscar-cliente');
  }

  // ── Novo cliente ────────────────────────────────────────────────────────────

  salvarNovoCliente(): void {
    if (this.formNovoCliente.invalid) {
      this.formNovoCliente.markAllAsTouched();
      return;
    }

    this.erroCliente.set('');
    this.salvandoCliente.set(true);

    const v = this.formNovoCliente.getRawValue();

    this.clientesService
      .criar({
        nome: v.nome.trim(),
        telefone: v.telefone.trim() || undefined,
        observacoes: v.observacoes.trim() || undefined,
      })
      .pipe(finalize(() => this.salvandoCliente.set(false)))
      .subscribe({
        next: (resposta) => {
          this.clienteSelecionado.set(resposta.cliente);
          this.toastService.sucesso(`Cliente "${resposta.cliente.nome}" cadastrado com sucesso.`);
          this.etapaCriacao.set('dados-pedido');
        },
        error: (err: Error) => {
          this.erroCliente.set(err.message);
        },
      });
  }

  // ── Buscar cliente existente ────────────────────────────────────────────────

  private configurarBuscaCliente(): void {
    this.buscaSubject
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((termo) => {
          if (termo.length < 3) {
            this.resultadosBuscaCliente.set([]);
            this.buscandoCliente.set(false);
            return of([]);
          }
          // Verifica cache
          if (this.cacheBuscaClientes.has(termo)) {
            this.resultadosBuscaCliente.set(this.cacheBuscaClientes.get(termo)!);
            this.buscandoCliente.set(false);
            return of([]); // Não faz nova busca
          }
          this.buscandoCliente.set(true);
          return this.clientesService
            .buscar(termo)
            .pipe(finalize(() => this.buscandoCliente.set(false)));
        }),
      )
      .subscribe({
        next: (clientes) => {
          const termo = this.termoBuscaCliente();
          if (termo.length >= 3 && clientes.length > 0) {
            this.cacheBuscaClientes.set(termo, clientes);
          }
          if (clientes.length > 0) {
            this.resultadosBuscaCliente.set(clientes);
          }
        },
        error: (err: Error) => {
          this.erroCliente.set(err.message);
          this.buscandoCliente.set(false);
        },
      });
  }

  onTermoBuscaCliente(event: Event): void {
    const termo = (event.target as HTMLInputElement).value;
    this.termoBuscaCliente.set(termo);
    this.erroCliente.set('');
    this.buscaSubject.next(termo);
  }

  selecionarClienteExistente(cliente: Cliente): void {
    this.clienteSelecionado.set(cliente);
    this.resultadosBuscaCliente.set([]);
    this.etapaCriacao.set('dados-pedido');
  }

  // ── Salvar pedido ───────────────────────────────────────────────────────────

  salvarPedido(): void {
    if (this.formPedido.invalid) {
      this.formPedido.markAllAsTouched();
      return;
    }

    const cliente = this.clienteSelecionado();
    if (!cliente) return;

    this.erroPedido.set('');
    this.salvandoPedido.set(true);

    const v = this.formPedido.getRawValue();

    this.pedidosService
      .criar({
        cliente_id: cliente.id,
        cliente_nome: cliente.nome,
        data_pedido: v.data_pedido,
        data_entrega: v.data_entrega || null,
        status: v.status,
        observacoes: v.observacoes?.trim() || undefined,
      })
      .pipe(finalize(() => this.salvandoPedido.set(false)))
      .subscribe({
        next: () => {
          this.modalNovoPedidoAberto.set(false);
          this.toastService.sucesso('Pedido cadastrado com sucesso.');
          this.cachePedidos.clear(); // Limpa cache ao criar novo pedido
          this.carregarPedidos(this.filtrosAtuais());
        },
        error: (err: Error) => {
          this.erroPedido.set(err.message);
        },
      });
  }

  // ── Modal visualizar/editar ─────────────────────────────────────────────────

  private abrirModalVisualizar(linha: TabelaLinha): void {
    // Busca o Pedido tipado a partir da linha para ter acesso seguro às propriedades
    const pedido = linha as unknown as Pedido;
    this.pedidoSelecionado.set(pedido);
    this.erroEdicao.set('');

    this.formEdicaoPedido.reset({
      data_pedido: this.formatarParaDatetimeLocal(pedido.data_pedido),
      data_entrega: this.formatarParaDatetimeLocal(pedido.data_entrega),
      status: pedido.status ?? 'novo',
      observacoes: pedido.observacoes ?? '',
    });

    this.modalVisualizarAberto.set(true);
  }

  fecharModalVisualizar(): void {
    if (this.salvandoEdicao()) return;
    this.modalVisualizarAberto.set(false);
    this.pedidoSelecionado.set(null);
  }

  salvarEdicaoPedido(): void {
    if (this.formEdicaoPedido.invalid) {
      this.formEdicaoPedido.markAllAsTouched();
      return;
    }

    const pedido = this.pedidoSelecionado();
    if (!pedido?.id) return;

    this.erroEdicao.set('');
    this.salvandoEdicao.set(true);

    const v = this.formEdicaoPedido.getRawValue();

    this.pedidosService
      .editar(pedido.id, {
        data_pedido: v.data_pedido,
        data_entrega: v.data_entrega || null,
        status: v.status,
        observacoes: v.observacoes?.trim() || undefined,
      })
      .pipe(finalize(() => this.salvandoEdicao.set(false)))
      .subscribe({
        next: () => {
          this.modalVisualizarAberto.set(false);
          this.pedidoSelecionado.set(null);
          this.toastService.sucesso('Pedido atualizado com sucesso.');
          this.carregarPedidos(this.filtrosAtuais());
        },
        error: (err: Error) => {
          this.erroEdicao.set(err.message);
        },
      });
  }

  // ── Cancelar pedido — usa editar com status 'cancelado' + senha via header ──

  solicitarCancelamentoPedido(): void {
    this.modalConfirmaCancelamentoAberto.set(true);
  }

  fecharModalConfirmaCancelamento(): void {
    if (this.salvandoCancelamento()) return;
    this.modalConfirmaCancelamentoAberto.set(false);
  }

  confirmarCancelamentoComSenha(senha: string): void {
    const pedido = this.pedidoSelecionado();
    const senhaLimpa = senha.trim();
    if (!pedido?.id || !senhaLimpa) return;

    this.salvandoCancelamento.set(true);

    // PedidosService não tem método cancelar próprio — cancela via editar com status
    this.pedidosService
      .editar(pedido.id, { status: 'cancelado' })
      .pipe(finalize(() => this.salvandoCancelamento.set(false)))
      .subscribe({
        next: () => {
          this.modalConfirmaCancelamentoAberto.set(false);
          this.modalVisualizarAberto.set(false);
          this.pedidoSelecionado.set(null);
          this.toastService.sucesso('Pedido cancelado com sucesso.');
          this.carregarPedidos(this.filtrosAtuais());
        },
        error: (err: Error) => {
          this.toastService.erro(err.message);
          this.modalConfirmaCancelamentoAberto.set(false);
        },
      });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private formatarData(valor: unknown): string {
    if (!valor) return '-';
    const data = new Date(valor as string);
    if (Number.isNaN(data.getTime())) return '-';
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(data);
  }

  private formatarParaDatetimeLocal(valor: string | null | undefined): string {
    if (!valor) return '';
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return '';
    return data.toISOString().slice(0, 16);
  }

  private formatarStatus(valor: unknown): string {
    const mapa: Record<PedidoStatus, string> = {
      novo: 'Novo',
      em_producao: 'Em produção',
      entregue: 'Entregue',
      cancelado: 'Cancelado',
    };
    return mapa[valor as PedidoStatus] ?? '-';
  }

  private criarFiltrosPadrao(): Record<string, string> {
    const hoje = new Date();
    const inicio = new Date(hoje);
    inicio.setDate(hoje.getDate() - 7);

    const paraIsoData = (data: Date): string => {
      const tzOffset = data.getTimezoneOffset() * 60_000;
      return new Date(data.getTime() - tzOffset).toISOString().slice(0, 10);
    };

    return {
      cliente: '',
      status: 'novo,em_producao',
      data_inicio: paraIsoData(inicio),
      data_fim: paraIsoData(hoje),
    };
  }
}
