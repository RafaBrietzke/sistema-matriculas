import { useEffect, useState } from 'react';

const CHAVE_TEMA = 'matriculafacil:tema';

function temaAtual() {
  return document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'escuro' : 'claro';
}

export function useTema() {
  const [tema, setTema] = useState(temaAtual);

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', tema === 'escuro' ? 'dark' : 'light');
    try {
      localStorage.setItem(CHAVE_TEMA, tema);
    } catch {
    }
  }, [tema]);

  function alternarTema() {
    setTema((atual) => (atual === 'escuro' ? 'claro' : 'escuro'));
  }

  return { tema, alternarTema };
}
