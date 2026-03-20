import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { DashboardPage } from './pages/dashboard/dashboard.component';
import { HomePage } from './pages/home/home.component';
import { LoginPage } from './pages/login/login.component';

export const routes: Routes = [
  {
    path: '',
    component: HomePage,
  },
  {
    path: 'login',
    component: LoginPage,
  },
  {
    path: 'dashboard',
    component: DashboardPage,
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
