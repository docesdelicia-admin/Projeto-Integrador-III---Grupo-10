import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { PasswordConfirmModalComponent } from '../../components/password-confirm-modal/password-confirm-modal.component';

import {
  TabelaColuna,
  TabelaLinha,
  TabelaComponent,
} from '../../components/tabela/tabela.component';
import { ModalComponent } from '../../components/modal/modal.component';

import { AuthService } from '../../services/auth.service';
import { Cliente, ClientesService } from '../../services/clientes.service';
import { ToastService } from '../../services/toast.service';
import { FiltroCampo, FiltrosComponent } from '../../components/filtros/filtros.component';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    TabelaComponent,
    PasswordConfirmModalComponent,
    ModalComponent,
    FiltrosComponent,
  ],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss',
})
export class ClientesPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly clientesService = inject(ClientesService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  // ── Tabela ──────────────────────────────────────────────────────────────────

  readonly colunasTabela: TabelaColuna[] = [
    { chave: 'nome', titulo: 'Nome' },
    { chave: 'telefone', titulo: 'Telefone', formatador: (v) => (v as string) || '-' },
    { chave: 'observacoes', titulo: 'Observações', formatador: (v) => (v as string) || '-' },
    { chave: 'criado_em', titulo: 'Criado em', formatador: (v) => this.formatarData(v) },
  ];

  readonly clientes = signal<Cliente[]>([]);
  carregando = false;
  readonly isAdmin = signal(false);
  readonly filtroExecutado = signal(false);
  readonly filtrosAtuais = signal<Record<string, string>>(this.criarFiltrosPadrao());

  readonly camposFiltro: FiltroCampo[] = [
    {
      key: 'q',
      label: 'Nome / Telefone',
      type: 'text',
      placeholder: 'Buscar cliente...',
    },
    { key: 'data_inicio', label: 'Data inicial', type: 'date' },
    { key: 'data_fim', label: 'Data final', type: 'date' },
  ];

  get linhas(): () => TabelaLinha[] {
    return () => this.clientes().map((c) => ({ ...c }) as TabelaLinha);
  }

  // ── Modal cadastro / edição ──────────────────────────────────────────────────

  readonly modalAberto = signal(false);
  readonly modoEdicao = signal(false);
  readonly idClienteEdicao = signal<string | null>(null);
  readonly salvando = signal(false);

  readonly formCliente = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(160)]],
    telefone: [''],
    observacoes: [''],
  });

  // ── Modal exclusão ───────────────────────────────────────────────────────────

  readonly modalExclusaoAberto = signal(false);
  readonly clientePendenteExclusao = signal<Cliente | null>(null);
  readonly excluindo = signal(false);

  // ── Ações da tabela ─────────────────────────────────────────────────────────

  readonly acaoEditarCliente = (linha: TabelaLinha): void => {
    this.abrirModalEdicao(linha);
  };

  readonly acaoExcluirCliente = (linha: TabelaLinha): void => {
    this.solicitarExclusao(linha);
  };

  readonly excluirDesabilitado = (): boolean => !this.isAdmin();

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.isAdmin.set(this.authService.isAdmin());
    this.carregarClientes(this.filtrosAtuais());
  }

  // ── Carregar ─────────────────────────────────────────────────────────────────

  onFiltrosChange(filtros: Record<string, string>): void {
    this.filtroExecutado.set(true);
    this.filtrosAtuais.set({ ...filtros });
    this.carregarClientes(filtros);
  }

  mensagemSemDadosTabela(): string {
    if (!this.filtroExecutado()) {
      return 'Use os filtros para buscar clientes.';
    }

    return 'Nenhum cliente encontrado para os filtros informados.';
  }

  private carregarClientes(filtros: Record<string, string>): void {
    this.carregando = true;
    this.clientesService
      .listar({
        q: filtros['q']?.trim() || undefined,
        dataInicio: filtros['data_inicio'] || undefined,
        dataFim: filtros['data_fim'] || undefined,
      })
      .pipe(finalize(() => (this.carregando = false)))
      .subscribe({
        next: (res) => {
          this.clientes.set(res.clientes ?? []);
          // Limpar filtros de data após carregar
          this.filtrosAtuais.set({
            q: filtros['q'] || '',
            data_inicio: '',
            data_fim: '',
          });
        },
        error: (err: Error) => this.toastService.erro(err.message),
      });
  }

  // ── Abrir modais ─────────────────────────────────────────────────────────────

  abrirModalCadastro(): void {
    this.modoEdicao.set(false);
    this.idClienteEdicao.set(null);
    this.formCliente.reset({ nome: '', telefone: '', observacoes: '' });
    this.modalAberto.set(true);
  }

  private abrirModalEdicao(linha: TabelaLinha): void {
    const cliente = this.resolverCliente(linha);
    if (!cliente) return;

    this.modoEdicao.set(true);
    this.idClienteEdicao.set(cliente.id);
    this.formCliente.reset({
      nome: cliente.nome,
      telefone: cliente.telefone ?? '',
      observacoes: cliente.observacoes ?? '',
    });
    this.modalAberto.set(true);
  }

  fecharModal(): void {
    if (this.salvando()) return;
    this.modalAberto.set(false);
  }

  // ── Salvar ───────────────────────────────────────────────────────────────────

  salvarCliente(): void {
    if (this.formCliente.invalid) {
      this.formCliente.markAllAsTouched();
      return;
    }

    this.salvando.set(true);

    const v = this.formCliente.getRawValue();
    const payload = {
      nome: v.nome.trim(),
      telefone: v.telefone.trim() || undefined,
      observacoes: v.observacoes.trim() || undefined,
    };

    const requisicao =
      this.modoEdicao() && this.idClienteEdicao()
        ? this.clientesService.editar(this.idClienteEdicao()!, payload)
        : this.clientesService.criar(payload);

    requisicao.pipe(finalize(() => this.salvando.set(false))).subscribe({
      next: () => {
        this.modalAberto.set(false);
        this.toastService.sucesso(
          this.modoEdicao() ? 'Cliente atualizado com sucesso.' : 'Cliente cadastrado com sucesso.',
        );
        this.carregarClientes(this.filtrosAtuais());
      },
      error: (err: Error) => this.toastService.erro(err.message),
    });
  }

  // ── Exclusão ─────────────────────────────────────────────────────────────────

  private solicitarExclusao(linha: TabelaLinha): void {
    if (!this.isAdmin()) {
      this.toastService.erro('Apenas administradores podem excluir clientes.');
      return;
    }

    const cliente = this.resolverCliente(linha);
    if (!cliente) return;

    this.clientePendenteExclusao.set(cliente);
    this.modalExclusaoAberto.set(true);
  }

  fecharModalExclusao(): void {
    if (this.excluindo()) return;
    this.modalExclusaoAberto.set(false);
    this.clientePendenteExclusao.set(null);
  }

  confirmarExclusaoComSenha(senha: string): void {
    const cliente = this.clientePendenteExclusao();
    const senhaLimpa = senha.trim();
    if (!cliente || !senhaLimpa) return;

    this.excluindo.set(true);

    this.clientesService
      .excluir(cliente.id, senhaLimpa)
      .pipe(finalize(() => this.excluindo.set(false)))
      .subscribe({
        next: () => {
          this.modalExclusaoAberto.set(false);
          this.clientePendenteExclusao.set(null);
          this.toastService.sucesso('Cliente excluído com sucesso.');
          this.carregarClientes(this.filtrosAtuais());
        },
        error: (err: Error) => {
          this.toastService.erro(err.message);
          this.modalExclusaoAberto.set(false);
        },
      });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private resolverCliente(linha: TabelaLinha): Cliente | null {
    const id = linha['id'];
    if (typeof id !== 'string') {
      this.toastService.erro('Não foi possível identificar o cliente.');
      return null;
    }
    const cliente = this.clientes().find((c) => c.id === id) ?? null;
    if (!cliente) this.toastService.erro('Cliente não encontrado na lista atual.');
    return cliente;
  }

  private formatarData(valor: unknown): string {
    if (!valor) return '-';
    const data = new Date(valor as string);
    if (Number.isNaN(data.getTime())) return '-';
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
      data,
    );
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
      q: '',
      data_inicio: paraIsoData(inicio),
      data_fim: paraIsoData(hoje),
    };
  }
}
