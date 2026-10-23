import { useEffect, useState } from 'react';

export function useBuscaDados(funcaoBusca, dependencias = []) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [versao, setVersao] = useState(0);


  useEffect(() => {
    let ativo = true;

    async function carregar() {
      setCarregando(true);
      setErro(null);
      try {
        const resultado = await funcaoBusca();
        if (ativo) setDados(resultado);
      } catch (e) {
        if (ativo) setErro(e.message);
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregar();
    return () => {
      ativo = false;
    };
  }, [...dependencias, versao]);

  function recarregar() {
    setVersao((atual) => atual + 1);
  }

  return { dados, carregando, erro, recarregar };
}
