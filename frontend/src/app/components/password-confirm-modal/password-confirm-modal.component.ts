import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { inject } from '@angular/core';

@Component({
  selector: 'app-password-confirm-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './password-confirm-modal.component.html',
  styleUrl: './password-confirm-modal.component.scss',
})
export class PasswordConfirmModalComponent implements OnChanges {
  private readonly formBuilder = inject(FormBuilder);

  @Input() aberto = false;
  @Input() titulo = 'Confirmar acao';
  @Input() mensagem = 'Digite sua senha atual para confirmar esta acao.';
  @Input() rotuloSenha = 'Senha atual';
  @Input() placeholderSenha = 'Sua senha atual';
  @Input() textoConfirmar = 'Confirmar';
  @Input() textoCancelar = 'Cancelar';
  @Input() salvando = false;

  @Output() cancelar = new EventEmitter<void>();
  @Output() confirmar = new EventEmitter<string>();

  mostrarSenha = false;

  readonly formSenha = this.formBuilder.nonNullable.group({
    senhaAtual: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if ('aberto' in changes && !this.aberto) {
      this.resetarEstado();
    }
  }

  fechar(): void {
    if (this.salvando) {
      return;
    }

    this.cancelar.emit();
  }

  alternarVisualizacaoSenha(): void {
    this.mostrarSenha = !this.mostrarSenha;
  }

  enviarConfirmacao(): void {
    if (this.formSenha.invalid) {
      this.formSenha.markAllAsTouched();
      return;
    }

    const { senhaAtual } = this.formSenha.getRawValue();
    this.confirmar.emit(senhaAtual);
  }

  private resetarEstado(): void {
    this.formSenha.reset();
    this.mostrarSenha = false;
  }
}
