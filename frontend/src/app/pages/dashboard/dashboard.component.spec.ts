import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { DashboardPage } from './dashboard.component';

describe('DashboardPage', () => {
  let fixture: ComponentFixture<DashboardPage>;
  let component: DashboardPage;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [{ provide: ActivatedRoute, useValue: { params: of({}) } }],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renderiza componente', () => {
    expect(component).toBeTruthy();
  });

  it('renderiza HeaderComponent', () => {
    const header = fixture.nativeElement.querySelector('app-header');
    expect(header).toBeTruthy();
  });

  it('contem links de navegacao', () => {
    expect(component).toBeTruthy();
    fixture.detectChanges();
    const elementos = fixture.nativeElement.querySelectorAll('[routerLink]');
    expect(elementos.length).toBeGreaterThan(0);
  });
});
