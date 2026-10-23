import { Navigate, Route, Routes } from 'react-router-dom';
import { rotaInicial, useSessao } from './contexto/sessao';
import LayoutApp from './componentes/LayoutApp';
import RotaProtegida from './componentes/RotaProtegida';
import Login from './paginas/Login';
import NaoEncontrada from './paginas/NaoEncontrada';
import InicioInstituicao from './paginas/instituicao/InicioInstituicao';
import InicioAluno from './paginas/aluno/InicioAluno';
import Turmas from './paginas/instituicao/Turmas';
import Disciplinas from './paginas/instituicao/Disciplinas';
import Professores from './paginas/instituicao/Professores';
import Alunos from './paginas/instituicao/Alunos';
import PerfilProfessor from './paginas/instituicao/PerfilProfessor';
import PerfilAluno from './paginas/instituicao/PerfilAluno';
import FormularioTurma from './paginas/instituicao/FormularioTurma';
import TurmasOfertadas from './paginas/aluno/TurmasOfertadas';
import MinhasMatriculas from './paginas/aluno/MinhasMatriculas';
import MinhaGrade from './paginas/aluno/MinhaGrade';
import GradeGeral from './paginas/instituicao/GradeGeral';

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
          <Route path="disciplinas" element={<Disciplinas />} />
          <Route path="professores" element={<Professores />} />
          <Route path="professores/:id" element={<PerfilProfessor />} />
          <Route path="alunos" element={<Alunos />} />
          <Route path="alunos/:id" element={<PerfilAluno />} />
          <Route path="turmas" element={<Turmas />} />
          <Route path="turmas/nova" element={<FormularioTurma />} />
          <Route path="turmas/:id/editar" element={<FormularioTurma />} />
          <Route path="grade" element={<GradeGeral />} />
        </Route>
      </Route>

      <Route path="aluno" element={<RotaProtegida perfil="aluno" />}>
        <Route element={<LayoutApp />}>
          <Route index element={<InicioAluno />} />
          <Route path="turmas" element={<TurmasOfertadas />} />
          <Route path="matriculas" element={<MinhasMatriculas />} />
          <Route path="grade" element={<MinhaGrade />} />
        </Route>
      </Route>

      <Route path="*" element={<NaoEncontrada />} />
    </Routes>
  );
}
