import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useSessao } from '../contexto/sessao';
import BarraLateral from './BarraLateral';
import BarraSuperior from './BarraSuperior';
import Assinatura from './Assinatura';
import LimiteErro from './LimiteErro';

export default function LayoutApp() {
  const { sessao } = useSessao();
  const { pathname } = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <div className="app">
      <BarraLateral perfil={sessao.perfil} aberta={menuAberto} aoFechar={() => setMenuAberto(false)} />
      <div className="app-principal">
        <BarraSuperior aoAbrirMenu={() => setMenuAberto(true)} />
        <main className="app-conteudo">
          <LimiteErro key={pathname}>
            <Outlet />
          </LimiteErro>
        </main>
        <Assinatura className="app-rodape nao-imprimir" />
      </div>
    </div>
  );
}
