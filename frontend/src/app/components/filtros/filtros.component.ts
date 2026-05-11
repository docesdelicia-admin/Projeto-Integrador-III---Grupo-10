import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

export type FiltroTipo = 'text' | 'date' | 'select' | 'multicheck';

export interface FiltroOpcao {
  label: string;
  value: string;
}

export interface FiltroCampo {
  key: string;
  label: string;
  type: FiltroTipo;
  placeholder?: string;
  options?: FiltroOpcao[];
}

export type FiltroAcaoTipo = 'confirmar' | 'cancelar' | 'custom';

export interface FiltroAcao {
  id: string;
  label?: string;
  ordem?: number;
  tipo?: FiltroAcaoTipo;
  classe?: 'primary' | 'secondary';
}

@Component({
  selector: 'app-filtros',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filtros.component.html',
  styleUrl: './filtros.component.scss',
})
export class FiltrosComponent implements OnChanges {
  @Input({ required: true }) campos: FiltroCampo[] = [];
  @Input() titulo = 'Filtros';
  @Input() valoresIniciais: Record<string, string> = {};
  @Input() acoes: FiltroAcao[] = [];
  @Input() incluirAcoesPadrao = true;
  @Input() labelCancelar = 'Cancelar';
  @Input() labelConfirmar = 'Confirmar';

  @Output() filtrosChange = new EventEmitter<Record<string, string>>();
  @Output() acaoCustomizada = new EventEmitter<string>();

  valores: Record<string, string> = {};
  dropdownAbertoKey: string | null = null;

  get acoesOrdenadas(): FiltroAcao[] {
    const acoesNormalizadas = this.acoes.map((acao) => this.normalizarAcao(acao));

    if (!this.incluirAcoesPadrao) {
      return [...acoesNormalizadas].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
    }

    const acoesPadrao = [
      this.normalizarAcao({
        id: 'cancelar',
        label: this.labelCancelar,
        tipo: 'cancelar',
        ordem: 2,
        classe: 'secondary',
      }),
      this.normalizarAcao({
        id: 'confirmar',
        label: this.labelConfirmar,
        tipo: 'confirmar',
        ordem: 3,
        classe: 'primary',
      }),
    ];

    const idsCustomizados = new Set(acoesNormalizadas.map((acao) => acao.id));
    const resultado = [
      ...acoesPadrao.filter((acao) => !idsCustomizados.has(acao.id)),
      ...acoesNormalizadas,
    ];

    return resultado.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['campos'] || changes['valoresIniciais']) {
      this.inicializarValores();
    }
  }

  confirmar(): void {
    this.filtrosChange.emit({ ...this.valores });
  }

  cancelar(): void {
    this.campos.forEach((campo) => {
      this.valores[campo.key] = '';
    });

    this.confirmar();
  }

  executarAcao(acao: FiltroAcao): void {
    const tipo = acao.tipo ?? this.inferirTipoAcao(acao.id);

    if (tipo === 'confirmar') {
      this.confirmar();
      return;
    }

    if (tipo === 'cancelar') {
      this.cancelar();
      return;
    }

    this.acaoCustomizada.emit(acao.id);
  }

  isOpcaoSelecionada(campoKey: string, opcaoValue: string): boolean {
    const selecionadas = (this.valores[campoKey] ?? '')
      .split(',')
      .map((valor) => valor.trim())
      .filter(Boolean);

    return selecionadas.includes(opcaoValue);
  }

  alternarOpcao(campoKey: string, opcaoValue: string, marcada: boolean): void {
    const selecionadas = new Set(
      (this.valores[campoKey] ?? '')
        .split(',')
        .map((valor) => valor.trim())
        .filter(Boolean),
    );

    if (marcada) {
      selecionadas.add(opcaoValue);
    } else {
      selecionadas.delete(opcaoValue);
    }

    this.valores[campoKey] = Array.from(selecionadas).join(',');
  }

  toggleDropdown(campoKey: string): void {
    this.dropdownAbertoKey = this.dropdownAbertoKey === campoKey ? null : campoKey;
  }

  resumoMulticheck(campo: FiltroCampo): string {
    const selecionadas = (this.valores[campo.key] ?? '')
      .split(',')
      .map((valor) => valor.trim())
      .filter(Boolean);

    if (selecionadas.length === 0) {
      return 'Selecionar opcoes';
    }

    if (selecionadas.length === 1) {
      const opcao = (campo.options ?? []).find((item) => item.value === selecionadas[0]);
      return opcao?.label ?? selecionadas[0];
    }

    return `${selecionadas.length} selecionados`;
  }

  private inicializarValores(): void {
    const proximosValores: Record<string, string> = {};

    this.campos.forEach((campo) => {
      proximosValores[campo.key] = this.valoresIniciais[campo.key] ?? '';
    });

    this.valores = proximosValores;
  }

  private inferirTipoAcao(id: string): FiltroAcaoTipo {
    if (id === 'confirmar') {
      return 'confirmar';
    }

    if (id === 'cancelar') {
      return 'cancelar';
    }

    return 'custom';
  }

  private normalizarAcao(acao: FiltroAcao): FiltroAcao {
    const tipo = acao.tipo ?? this.inferirTipoAcao(acao.id);
    const label = acao.label ?? this.labelPadraoPorTipo(tipo, acao.id);
    const ordem = acao.ordem ?? this.ordemPadraoPorTipo(tipo);
    const classe = acao.classe ?? (tipo === 'confirmar' ? 'primary' : 'secondary');

    return {
      id: acao.id,
      label,
      ordem,
      tipo,
      classe,
    };
  }

  private labelPadraoPorTipo(tipo: FiltroAcaoTipo, id: string): string {
    if (tipo === 'confirmar') {
      return this.labelConfirmar;
    }

    if (tipo === 'cancelar') {
      return this.labelCancelar;
    }

    return id;
  }

  private ordemPadraoPorTipo(tipo: FiltroAcaoTipo): number {
    if (tipo === 'cancelar') {
      return 2;
    }

    if (tipo === 'confirmar') {
      return 3;
    }

    return 1;
  }
}
