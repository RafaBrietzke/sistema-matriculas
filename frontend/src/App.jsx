import { Navigate, Route, Routes } from 'react-router-dom';
import { rotaInicial, useSessao } from './contexto/sessao';
import LayoutApp from './componentes/LayoutApp';
import RotaProtegida from './componentes/RotaProtegida';
import Login from './paginas/Login';
import NaoEncontrada from './paginas/NaoEncontrada';
import EmConstrucao from './paginas/EmConstrucao';
import InicioInstituicao from './paginas/instituicao/InicioInstituicao';
import InicioAluno from './paginas/aluno/InicioAluno';
import Turmas from './paginas/instituicao/Turmas';
import FormularioTurma from './paginas/instituicao/FormularioTurma';
import TurmasOfertadas from './paginas/aluno/TurmasOfertadas';
import MinhasMatriculas from './paginas/aluno/MinhasMatriculas';

// "/" leva para a página inicial do perfil logado, ou para o login.
function RedirecionarInicio() {
  const { sessao } = useSessao();
  return <Navigate to={sessao ? rotaInicial(sessao.perfil) : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route index element={<RedirecionarInicio />} />
      <Route path="login" element={<Login />} />

      <Route path="instituicao" element={<RotaProtegida perfil="instituicao" />}>
        <Route element={<LayoutApp />}>
          <Route index element={<InicioInstituicao />} />
          <Route path="disciplinas" element={<EmConstrucao titulo="Disciplinas" />} />
          <Route path="professores" element={<EmConstrucao titulo="Professores" />} />
          <Route path="alunos" element={<EmConstrucao titulo="Alunos" />} />
          <Route path="turmas" element={<Turmas />} />
          <Route path="turmas/nova" element={<FormularioTurma />} />
          <Route path="turmas/:id/editar" element={<FormularioTurma />} />
          <Route path="grade" element={<EmConstrucao titulo="Grade geral" />} />
        </Route>
      </Route>

      <Route path="aluno" element={<RotaProtegida perfil="aluno" />}>
        <Route element={<LayoutApp />}>
          <Route index element={<InicioAluno />} />
          <Route path="turmas" element={<TurmasOfertadas />} />
          <Route path="matriculas" element={<MinhasMatriculas />} />
          <Route path="grade" element={<EmConstrucao titulo="Minha grade" />} />
        </Route>
      </Route>

      <Route path="*" element={<NaoEncontrada />} />
    </Routes>
  );
}
