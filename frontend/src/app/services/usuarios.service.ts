import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface ErroApiResponse {
  erro?: string;
}

export interface UsuarioAtualizadoResponse {
  mensagem: string;
  usuario: {
    id: string;
    nome: string;
    email: string;
    tipo_usuario: 'admin' | 'operador';
    criado_em: string;
  };
}

export interface EditarMinhaContaPayload {
  nome?: string;
  email?: string;
  senhaAtual: string;
  senhaNova?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {
  private readonly apiUrl = '/api/usuarios';

  constructor(private readonly http: HttpClient) {}

  editarMinhaConta(usuarioId: string, payload: EditarMinhaContaPayload): Observable<UsuarioAtualizadoResponse> {
    const body: Record<string, string> = {
      senha_atual: payload.senhaAtual,
    };

    if (payload.nome !== undefined) {
      body['nome'] = payload.nome;
    }

    if (payload.email !== undefined) {
      body['email'] = payload.email;
    }

    if (payload.senhaNova !== undefined) {
      body['senha'] = payload.senhaNova;
    }

    return this.http
      .put<UsuarioAtualizadoResponse>(
        `${this.apiUrl}?id=${encodeURIComponent(usuarioId)}`,
        body,
        { withCredentials: true },
      )
      .pipe(
        catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error)))),
      );
  }

  private extrairMensagemErro(payload: ErroApiResponse | undefined): string {
    if (payload && typeof payload.erro === 'string' && payload.erro.trim()) {
      return payload.erro;
    }

    return 'Nao foi possivel atualizar a senha. Tente novamente.';
  }
}
