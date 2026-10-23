import { useEffect, useState } from 'react';
import { buscar } from '../api/cliente';
import { CHAVE_SESSAO, SessaoContext } from './sessao';

// Lê a sessão salva. Se o localStorage estiver bloqueado ou o valor for inválido,
// considera que não há sessão.
function lerSessaoSalva() {
  try {
    const sessao = JSON.parse(localStorage.getItem(CHAVE_SESSAO));
    return ['instituicao', 'aluno'].includes(sessao?.perfil) ? sessao : null;
  } catch {
    return null;
  }
}

function gravarSessao(sessao) {
  try {
    if (sessao) localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
    else localStorage.removeItem(CHAVE_SESSAO);
  } catch {
  }
}

export default function SessaoProvider({ children }) {
  const [sessao, setSessao] = useState(lerSessaoSalva);

  function entrar(novaSessao) {
    gravarSessao(novaSessao);
    setSessao(novaSessao);
  }

  function sair() {
    gravarSessao(null);
    setSessao(null);
  }

  // Se o aluno da sessão salva não existe mais na API, encerra a sessão.
  useEffect(() => {
    if (sessao?.perfil !== 'aluno') return;
    buscar('alunos', sessao.id).catch((erro) => {
      if (erro.status === 404) {
        gravarSessao(null);
        setSessao(null);
      }
    });
  }, [sessao?.perfil, sessao?.id]);

  return <SessaoContext.Provider value={{ sessao, entrar, sair }}>{children}</SessaoContext.Provider>;
}
