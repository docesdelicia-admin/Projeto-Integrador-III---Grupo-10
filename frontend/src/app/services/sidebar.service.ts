import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  private abertoSignal = signal(false);

  readonly aberto = this.abertoSignal.asReadonly();

  open(): void {
    this.abertoSignal.set(true);
  }

  close(): void {
    this.abertoSignal.set(false);
  }

  toggle(): void {
    this.abertoSignal.set(!this.abertoSignal());
  }
}
