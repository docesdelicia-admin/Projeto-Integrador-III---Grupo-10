import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthApiService, LoginResponse } from '../../services/auth-api.service';

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
  readonly authApiService = inject(AuthApiService);

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(6)]],
  });

  carregando = false;
  mostrarSenha = false;
  mensagemErro = '';
  mensagemSucesso = '';

  alternarVisibilidadeSenha(): void {
    this.mostrarSenha = !this.mostrarSenha;
  }

  enviarLogin(): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, senha } = this.loginForm.getRawValue();

    this.carregando = true;

    this.authApiService
      .login(email, senha)
      .pipe(finalize(() => (this.carregando = false)))
      .subscribe({
        next: (resposta: LoginResponse) => {
          this.mensagemSucesso = `Bem-vindo, ${resposta.usuario.nome}!`;
          void this.router.navigateByUrl('/dashboard');
        },
        error: (error: Error) => {
          this.mensagemErro = error.message;
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
