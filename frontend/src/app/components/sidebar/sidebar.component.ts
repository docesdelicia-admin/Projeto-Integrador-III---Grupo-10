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

  ehAdmin = false;

  get itensVisiveis(): SidebarItem[] {
    return this.itens.filter((item) => !item.apenasAdmin || this.ehAdmin);
  }

  ngOnInit(): void {
    this.authService.validarSessao().subscribe((autenticado) => {
      this.ehAdmin = autenticado && this.authService.ehAdmin();
    });
  }
}
