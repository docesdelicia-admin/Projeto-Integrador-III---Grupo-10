import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService, LoginResponse } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(6)]],
  });

  carregando = false;
  mostrarSenha = false;

  alternarVisibilidadeSenha(): void {
    this.mostrarSenha = !this.mostrarSenha;
  }

  enviarLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, senha } = this.loginForm.getRawValue();

    this.carregando = true;

    this.authService
      .login(email, senha)
      .pipe(finalize(() => (this.carregando = false)))
      .subscribe({
        next: (resposta: LoginResponse) => {
          this.toastService.sucesso(`Bem-vindo, ${resposta.usuario.nome}!`);
          void this.router.navigateByUrl('/dashboard');
        },
        error: (error: Error) => {
          this.toastService.erro(error.message);
        },
      });
  }

  get campoEmailInvalido(): boolean {
    const campo = this.loginForm.controls.email;
    return campo.invalid && (campo.touched || campo.dirty);
  }

  get campoSenhaInvalido(): boolean {
    const campo = this.loginForm.controls.senha;
    return campo.invalid && (campo.touched || campo.dirty);
  }
}
