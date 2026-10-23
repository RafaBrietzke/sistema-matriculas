import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listar } from '../../api/cliente';
import { SEMESTRE_ATUAL } from '../../constantes';
import { useBuscaDados } from '../../hooks/useBuscaDados';
import { corDaDisciplina } from '../../utilitarios/cores';
import { cargaDoProfessor, plural } from '../../utilitarios/indicadores';
import AlertaErro from '../../componentes/AlertaErro';
import BarraUso from '../../componentes/BarraUso';
import CabecalhoPagina from '../../componentes/CabecalhoPagina';
import { EsqueletoTexto } from '../../componentes/Esqueleto';
import GradeHoraria from '../../componentes/GradeHoraria';

async function buscarDados() {
  const [turmas, disciplinas, professores] = await Promise.all([
    listar('turmas'),
    listar('disciplinas'),
    listar('professores'),
  ]);
  return { turmas, disciplinas, professores };
}

export default function GradeGeral() {
  const navegar = useNavigate();
  const { dados, carregando, erro, recarregar } = useBuscaDados(buscarDados);
  const [professorId, setProfessorId] = useState('');
  const [disciplinaId, setDisciplinaId] = useState('');

  const acoes = (
    <Link to="/instituicao/turmas/nova" className="btn btn-primary">
      <i className="bi bi-plus-lg me-2" aria-hidden="true" />
      Nova turma
    </Link>
  );

  if (carregando && !dados) {
    return (
      <>
        <CabecalhoPagina titulo="Grade geral" acoes={acoes} />
        <div className="card card-body">
          <EsqueletoTexto linhas={6} />
        </div>
      </>
    );
  }
  if (erro) return <AlertaErro mensagem={erro} aoTentarNovamente={recarregar} />;

  const { turmas, disciplinas, professores } = dados;
  const disciplinaPorId = (id) => disciplinas.find((d) => d.id === id);
  const professorPorId = (id) => professores.find((p) => p.id === id);
  const professor = professorPorId(Number(professorId));

  const filtradas = turmas.filter(
    (t) => (!professorId || t.professorId === Number(professorId)) && (!disciplinaId || t.disciplinaId === Number(disciplinaId)),
  );
  const eventos = filtradas.map((t) => ({
    id: t.id,
    horarios: t.horarios,
    titulo: t.codigo,
    subtitulo: disciplinaPorId(t.disciplinaId)?.nome,
    detalhe: professor ? `${t.alunos.length}/${t.vagas} alunos` : professorPorId(t.professorId)?.nome,
    cor: corDaDisciplina(t.disciplinaId),
  }));
  const disciplinasNaGrade = [...new Set(filtradas.map((t) => t.disciplinaId))].map(disciplinaPorId).sort((a, b) => a.codigo.localeCompare(b.codigo));

  function ofertarNoHorario(codigo) {
    const params = new URLSearchParams({ horario: codigo });
    if (professorId) params.set('professor', professorId);
    navegar(`/instituicao/turmas/nova?${params}`);
  }

  return (
    <>
      <CabecalhoPagina
        titulo="Grade geral"
        subtitulo={`${plural(filtradas.length, 'turma', 'turmas')} em ${SEMESTRE_ATUAL} · clique em um horário para ofertar uma turma nele`}
        acoes={acoes}
      />

      <div className="card mb-3">
        <div className="card-body row g-3 align-items-center">
          <div className="col-sm-6 col-lg-4">
            <select className="form-select" aria-label="Filtrar por professor" value={professorId} onChange={(e) => setProfessorId(e.target.value)}>
              <option value="">Todos os professores</option>
              {professores.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>
          <div className="col-sm-6 col-lg-4">
            <select className="form-select" aria-label="Filtrar por disciplina" value={disciplinaId} onChange={(e) => setDisciplinaId(e.target.value)}>
              <option value="">Todas as disciplinas</option>
              {disciplinas.map((d) => (
                <option key={d.id} value={d.id}>{d.codigo} — {d.nome}</option>
              ))}
            </select>
          </div>
          {professor && (
            <div className="col-lg-4">
              <BarraUso
                rotulo={`Carga de ${professor.nome}`}
                valor={cargaDoProfessor(professor.id, turmas)}
                maximo={professor.cargaMaxima}
                detalhe={`${cargaDoProfessor(professor.id, turmas)}/${professor.cargaMaxima} horários`}
              />
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <GradeHoraria eventos={eventos} aoClicarHorario={ofertarNoHorario} />
        </div>
        {disciplinasNaGrade.length > 0 && (
          <div className="card-footer bg-transparent d-flex flex-wrap gap-3 texto-pequeno text-body-secondary py-3">
            {disciplinasNaGrade.map((d) => (
              <span key={d.id}>
                <span className="legenda-horario" style={{ backgroundColor: corDaDisciplina(d.id) }} />
                {d.codigo} · {d.nome}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
