import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface SidebarItem {
  label: string;
  path: string;
  apenasAdmin?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  private readonly authService = inject(AuthService);

  readonly itens: SidebarItem[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Pedidos', path: '/dashboard/pedidos' },
    { label: 'Produtos', path: '/dashboard/produtos' },
    { label: 'Clientes', path: '/dashboard/clientes' },
    { label: 'Insumos', path: '/dashboard/insumos' },
    { label: 'Usuarios', path: '/dashboard/usuarios', apenasAdmin: true },
    { label: 'Minha conta', path: '/dashboard/minha-conta' },
  ];

  isAdmin = false;
  nomeUsuario = '';
  tipoUsuario = '';

  get saudacaoUsuario(): string {
    if (!this.nomeUsuario || !this.tipoUsuario) {
      return 'Seja bem-vindo';
    }

    return `Seja bem-vindo, ${this.tipoUsuario} ${this.nomeUsuario}`;
  }

  get itensVisiveis(): SidebarItem[] {
    return this.itens.filter((item) => !item.apenasAdmin || this.isAdmin);
  }

  ngOnInit(): void {
    const sessaoInicial = this.authService.obterSessaoAutenticada();
    if (sessaoInicial) {
      this.nomeUsuario = sessaoInicial.nome;
      this.tipoUsuario = sessaoInicial.tipo_usuario === 'admin' ? 'Admin' : 'Operador(a)';
    }

    this.authService.validarSessao().subscribe((autenticado) => {
      this.isAdmin = autenticado && this.authService.isAdmin();

      if (!autenticado) {
        this.nomeUsuario = '';
        this.tipoUsuario = '';
        return;
      }

      const sessao = this.authService.obterSessaoAutenticada();
      this.nomeUsuario = sessao?.nome ?? '';
      this.tipoUsuario = sessao?.tipo_usuario === 'admin' ? 'Admin' : 'Operador(a)';
    });
  }
}
