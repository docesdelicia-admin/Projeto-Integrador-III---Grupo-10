import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule, NgIf } from '@angular/common';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { FooterComponent } from './components/footer/footer.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    CommonModule,
    ToastContainerComponent,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  adminArea = false;
  login = false;

  constructor() {
    this.adminArea = this.router.url.startsWith('/dashboard');
    this.login = this.router.url.startsWith('/login');

    this.router.events.subscribe((ev) => {
      if (ev instanceof NavigationEnd) {
        this.adminArea = ev.urlAfterRedirects.startsWith('/dashboard');
        this.login = ev.urlAfterRedirects.startsWith('/login');
      }
    });
  }
}
