import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { FiltroCampo, FiltrosComponent } from '../../components/filtros/filtros.component';
import { ModalComponent } from '../../components/modal/modal.component';
import {
  TabelaColuna,
  TabelaComponent,
  TabelaLinha,
} from '../../components/tabela/tabela.component';

import { PasswordConfirmModalComponent } from '../../components/password-confirm-modal/password-confirm-modal.component';

import { AuthService } from '../../services/auth.service';
import { UsuariosService } from '../../services/usuarios.service';
import { ToastService } from '../../services/toast.service';

import { CriarUsuarioPayload, TipoUsuario, UsuarioListaItem } from '../../interfaces/Usuario';

type ModoFormularioUsuario = 'criar' | 'editar';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TabelaComponent,
    ModalComponent,
    FiltrosComponent,
    PasswordConfirmModalComponent,
  ],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss',
})
export class UsuariosPage implements OnInit {
  // estado geral
  isAdmin = false;
  carregando = false;
  salvando = false;
  excluindo = false;

  // modais
  usuarioSelecionado: UsuarioListaItem | null = null;
  usuarioParaExcluir: UsuarioListaItem | null = null;

  modalUsuarioAberto = false;
  passwordModalAberto = false;

  modoFormulario: ModoFormularioUsuario = 'criar';
  modoEdicaoUsuario = true;

  senhaParaExcluir = '';

  // signals
  private readonly filtrosState = signal<Record<string, string>>({});
  private readonly usuariosState = signal<UsuarioListaItem[]>([]);

  get filtros() {
    return this.filtrosState();
  }

  set filtros(valor: Record<string, string>) {
    this.filtrosState.set(valor);
  }

  get usuarios() {
    return this.usuariosState();
  }

  set usuarios(valor: UsuarioListaItem[]) {
    this.usuariosState.set(valor);
  }

  readonly usuariosFiltradosSignal = computed(() => {
    const termo = (this.filtrosState()['busca'] ?? '').toLowerCase().trim();
    const tipo = (this.filtrosState()['tipo_usuario'] ?? '').toLowerCase().trim();

    return this.usuariosState().filter((u) => {
      const matchBusca = !termo || [u.id, u.nome, u.email].join(' ').toLowerCase().includes(termo);

      const matchTipo = !tipo || u.tipo_usuario === tipo;

      return matchBusca && matchTipo;
    });
  });

  get usuariosFiltrados() {
    return this.usuariosFiltradosSignal();
  }

  get linhasTabelaUsuarios(): TabelaLinha[] {
    return this.usuariosFiltrados as unknown as TabelaLinha[];
  }

  // formulário
  private readonly fb = inject(FormBuilder);

  readonly formUsuario = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(6)]],
    tipo_usuario: ['operador' as TipoUsuario, [Validators.required]],
  });

  get nomeControl() {
    return this.formUsuario.get('nome');
  }

  get emailControl() {
    return this.formUsuario.get('email');
  }

  get senhaControl() {
    return this.formUsuario.get('senha');
  }

  get formularioEmModoEdicao(): boolean {
    return this.modoFormulario === 'criar' || this.modoEdicaoUsuario;
  }

  // dependências
  private readonly authService = inject(AuthService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly toast = inject(ToastService);

  // configuração tabela
  readonly colunasTabela: TabelaColuna[] = [
    { chave: 'id', titulo: 'ID' },
    { chave: 'nome', titulo: 'Nome' },
    { chave: 'email', titulo: 'Email' },
    { chave: 'tipo_usuario', titulo: 'Tipo' },
    { chave: 'criado_em', titulo: 'Criado em' },
  ];

  readonly camposFiltro: FiltroCampo[] = [
    {
      key: 'tipo_usuario',
      label: 'Tipo',
      type: 'select',
      options: [
        { label: 'Administrador', value: 'admin' },
        { label: 'Operador', value: 'operador' },
      ],
    },
    {
      key: 'busca',
      label: 'Busca',
      type: 'text',
      placeholder: 'Nome, email ou ID',
    },
  ];

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.carregarUsuarios();
  }

  // carregar dados
  private carregarUsuarios(): void {
    this.carregando = true;

    this.usuariosService
      .listar()
      .pipe(finalize(() => (this.carregando = false)))
      .subscribe({
        next: (res) => {
          this.usuarios = res.usuarios ?? [];
        },
        error: (err: Error) => {
          this.toast.erro(err.message);
        },
      });
  }

  // ações tabela
  readonly acaoEditarUsuario = (linha: TabelaLinha) =>
    this.abrirEdicaoUsuario(linha as unknown as UsuarioListaItem);

  readonly acaoExcluirUsuario = (linha: TabelaLinha) =>
    this.abrirExclusaoUsuario(linha as unknown as UsuarioListaItem);

  readonly excluirDesabilitado = (_: TabelaLinha) => !this.isAdmin;

  // ações
  abrirNovoUsuario(): void {
    this.modoFormulario = 'criar';
    this.modoEdicaoUsuario = true;
    this.usuarioSelecionado = null;

    this.formUsuario.reset({
      nome: '',
      email: '',
      senha: '',
      tipo_usuario: 'operador',
    });

    this.configurarValidacaoSenha(true);
    this.atualizarEstadoFormularioEdicao();

    this.modalUsuarioAberto = true;
  }

  abrirEdicaoUsuario(usuario: UsuarioListaItem): void {
    this.modoFormulario = 'editar';
    this.modoEdicaoUsuario = false;
    this.usuarioSelecionado = usuario;

    this.formUsuario.reset({
      nome: usuario.nome,
      email: usuario.email,
      senha: '',
      tipo_usuario: usuario.tipo_usuario,
    });

    this.configurarValidacaoSenha(false);
    this.atualizarEstadoFormularioEdicao();

    this.modalUsuarioAberto = true;
  }

  ativarEdicaoUsuario(): void {
    if (!this.usuarioSelecionado) return;

    this.modoEdicaoUsuario = true;
    this.configurarValidacaoSenha(false);
    this.atualizarEstadoFormularioEdicao();
  }

  cancelarEdicaoUsuario(): void {
    if (!this.usuarioSelecionado) return;

    this.modoEdicaoUsuario = false;

    this.formUsuario.reset({
      nome: this.usuarioSelecionado.nome,
      email: this.usuarioSelecionado.email,
      senha: '',
      tipo_usuario: this.usuarioSelecionado.tipo_usuario,
    });

    this.atualizarEstadoFormularioEdicao();
  }

  salvarUsuario(): void {
    if (this.formUsuario.invalid) {
      this.formUsuario.markAllAsTouched();
      return;
    }

    const v = this.formUsuario.getRawValue();

    if (this.modoFormulario === 'criar') {
      const payload: CriarUsuarioPayload = {
        nome: v.nome!.trim(),
        email: v.email!.trim(),
        senha: v.senha!.trim(),
        tipo_usuario: v.tipo_usuario!,
      };

      this.salvarNovoUsuario(payload);
      return;
    }

    if (!this.usuarioSelecionado) return;

    this.salvarEdicaoUsuario(this.usuarioSelecionado.id, {
      nome: v.nome!.trim(),
      email: v.email!.trim(),
      tipo_usuario: v.tipo_usuario!,
      ...(v.senha ? { senha: v.senha.trim() } : {}),
    });
  }

  confirmarExclusaoUsuario(senha: string): void {
    if (!this.usuarioParaExcluir) return;

    this.excluindo = true;

    this.usuariosService.excluir(this.usuarioParaExcluir.id, senha).subscribe({
      next: () => {
        this.toast.sucesso('Usuário excluído');
        this.fecharModalExclusao();
        this.carregarUsuarios();
        this.excluindo = false;
      },
      error: (err: Error) => {
        this.toast.erro(err.message);
        this.excluindo = false;
      },
    });
  }

  // persistência
  private salvarNovoUsuario(payload: CriarUsuarioPayload): void {
    this.salvando = true;

    this.usuariosService.criar(payload).subscribe({
      next: () => {
        this.toast.sucesso('Usuário criado');
        this.fecharModalUsuario();
        this.usuariosService.invalidarCacheListagem();
        this.carregando = true;
        window.setTimeout(() => this.carregarUsuarios(), 500);
        this.salvando = false;
      },
      error: (err: Error) => {
        this.toast.erro(err.message);
        this.salvando = false;
      },
    });
  }

  private salvarEdicaoUsuario(id: string, payload: any): void {
    this.salvando = true;

    this.usuariosService.editar(id, payload).subscribe({
      next: () => {
        this.toast.sucesso('Usuário atualizado');
        this.fecharModalUsuario();
        this.usuariosService.invalidarCacheListagem();
        this.carregando = true;
        window.setTimeout(() => this.carregarUsuarios(), 500);
        this.salvando = false;
      },
      error: (err: Error) => {
        this.toast.erro(err.message);
        this.salvando = false;
      },
    });
  }

  // modais
  fecharModalUsuario(): void {
    this.modalUsuarioAberto = false;
    this.usuarioSelecionado = null;
  }

  abrirExclusaoUsuario(usuario: UsuarioListaItem): void {
    this.usuarioParaExcluir = usuario;
    this.passwordModalAberto = true;
  }

  fecharModalExclusao(): void {
    this.passwordModalAberto = false;
    this.usuarioParaExcluir = null;
    this.senhaParaExcluir = '';
  }

  // validação
  private configurarValidacaoSenha(criando: boolean): void {
    const senha = this.senhaControl;
    if (!senha) return;

    if (criando) {
      senha.setValidators([Validators.required, Validators.minLength(6)]);
    } else {
      senha.clearValidators();
    }

    senha.updateValueAndValidity({ emitEvent: false });
  }

  private atualizarEstadoFormularioEdicao(): void {
    if (this.formularioEmModoEdicao) {
      this.formUsuario.enable({ emitEvent: false });
    } else {
      this.formUsuario.disable({ emitEvent: false });
    }
  }

  // filtros
  onFiltrosChange(filtros: Record<string, string>): void {
    this.filtros = filtros;
  }
}
