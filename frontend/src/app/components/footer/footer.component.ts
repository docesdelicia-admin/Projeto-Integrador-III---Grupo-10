import { Component } from '@angular/core';
import { AdminAreaComponent } from '../admin-area/admin-area.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [AdminAreaComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {}
