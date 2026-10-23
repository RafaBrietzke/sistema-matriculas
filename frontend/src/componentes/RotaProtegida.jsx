import { Navigate, Outlet } from 'react-router-dom';
import { rotaInicial, useSessao } from '../contexto/sessao';

export default function RotaProtegida({ perfil }) {
  const { sessao } = useSessao();

  if (!sessao) {
    return <Navigate to="/login" replace />;
  }
  if (sessao.perfil !== perfil) {
    return <Navigate to={rotaInicial(sessao.perfil)} replace />;
  }
  return <Outlet />;
}
