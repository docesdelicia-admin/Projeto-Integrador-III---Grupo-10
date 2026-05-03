import { Routes } from '@angular/router';
import { adminGuard, authGuard, loginGuard } from './guards/auth.guard';
import { DashboardPage } from './pages/dashboard/dashboard.component';
import { VitrinePage } from './pages/vitrine/vitrine.component';
import { LoginPage } from './pages/login/login.component';
import { ProdutosAdminPage } from './pages/produtos-admin/produtos-admin.component';
import { PedidosPage } from './pages/pedidos/pedidos.component';
import { ClientesPage } from './pages/clientes/clientes.component';
import { InsumosPage } from './pages/insumos/insumos.component';
import { UsuariosPage } from './pages/usuarios/usuarios.component';
import { MinhaContaPage } from './pages/minha-conta/minha-conta.component';

export const routes: Routes = [
  {
    path: '',
    component: VitrinePage,
  },
  {
    path: 'login',
    component: LoginPage,
    canActivate: [loginGuard],
  },
  {
    path: 'dashboard',
    component: DashboardPage,
    canActivate: [authGuard],
  },
  {
    path: 'dashboard/produtos',
    component: ProdutosAdminPage,
    canActivate: [authGuard],
  },
  {
    path: 'dashboard/pedidos',
    component: PedidosPage,
    canActivate: [authGuard],
  },
  {
    path: 'dashboard/clientes',
    component: ClientesPage,
    canActivate: [authGuard],
  },
  {
    path: 'dashboard/insumos',
    component: InsumosPage,
    canActivate: [authGuard],
  },
  {
    path: 'dashboard/usuarios',
    component: UsuariosPage,
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'dashboard/minha-conta',
    component: MinhaContaPage,
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
