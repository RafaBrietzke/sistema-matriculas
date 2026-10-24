import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useSessao } from '../contexto/sessao';
import BarraLateral from './BarraLateral';
import BarraSuperior from './BarraSuperior';
import Assinatura from './Assinatura';


export default function LayoutApp() {
  const { sessao } = useSessao();
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <div className="app">
      <BarraLateral perfil={sessao.perfil} aberta={menuAberto} aoFechar={() => setMenuAberto(false)} />
      <div className="app-principal">
        <BarraSuperior aoAbrirMenu={() => setMenuAberto(true)} />
        <main className="app-conteudo">
          <Outlet />
        </main>
        <Assinatura className="app-rodape nao-imprimir" />
      </div>
    </div>
  );
}
