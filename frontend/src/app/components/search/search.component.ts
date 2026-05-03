import { Component, EventEmitter, Input, Output } from '@angular/core';

type ModoBusca = 'campo' | 'icone';

@Component({
  selector: 'app-search',
  standalone: true,
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
})
export class SearchComponent {
  @Input() modo: ModoBusca = 'campo';
  @Input() placeholder = 'Pesquisar produtos';
  @Input() desabilitado = false;

  @Output() buscaAlterada = new EventEmitter<string>();
  @Output() buscaAcionada = new EventEmitter<void>();

  onInputBusca(valor: string): void {
    // TODO: conectar este evento com a logica de busca por contexto (vitrine, dashboard e demais modulos).
    this.buscaAlterada.emit(valor);
  }

  onAcionarBusca(): void {
    // TODO: implementar acao de busca contextual (ex.: abrir modal/painel) quando o fluxo for definido.
    this.buscaAcionada.emit();
  }
}
