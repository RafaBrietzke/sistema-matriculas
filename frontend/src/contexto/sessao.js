import { createContext, useContext } from 'react';

// Sessão simulada: { perfil: 'instituicao' | 'aluno', id, nome }
export const SessaoContext = createContext(null);

export const CHAVE_SESSAO = 'matriculaweb:sessao';

export function useSessao() {
  return useContext(SessaoContext);
}

export function rotaInicial(perfil) {
  return perfil === 'instituicao' ? '/instituicao' : '/aluno';
}
