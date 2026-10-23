import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { listar } from '../../api/cliente';
import { SEMESTRE_ATUAL } from '../../constantes';
import { useBuscaDados } from '../../hooks/useBuscaDados';
import { corDaDisciplina } from '../../utilitarios/cores';
import { cargaDoProfessor, percentual, plural } from '../../utilitarios/indicadores';
import AlertaErro from '../../componentes/AlertaErro';
import Avatar from '../../componentes/Avatar';
import BarraUso from '../../componentes/BarraUso';
import CartaoIndicador from '../../componentes/CartaoIndicador';
import EstadoVazio from '../../componentes/EstadoVazio';
import { EsqueletoCartoes } from '../../componentes/Esqueleto';
import GradeHoraria from '../../componentes/GradeHoraria';
import ListaHorarios from '../../componentes/ListaHorarios';
import PainelLateral from '../../componentes/PainelLateral';
import { FormularioProfessor } from './Professores';

async function buscarDados() {
  const [professores, turmas, disciplinas] = await Promise.all([listar('professores'), listar('turmas'), listar('disciplinas')]);
  return { professores, turmas, disciplinas };
}

function VoltarPara() {
  return (
    <Link to="/instituicao/professores" className="small text-decoration-none d-inline-flex align-items-center gap-1 mb-3">
      <i className="bi bi-arrow-left" aria-hidden="true" />
      Professores
    </Link>
  );
}

export default function PerfilProfessor() {
  const { id } = useParams();
  const { dados, carregando, erro, recarregar } = useBuscaDados(buscarDados);
  const [editando, setEditando] = useState(false);

  if (carregando && !dados) {
    return (
      <>
        <VoltarPara />
        <EsqueletoCartoes quantidade={3} />
      </>
    );
  }
  if (erro) return <AlertaErro mensagem={erro} aoTentarNovamente={recarregar} />;

  const { professores, turmas, disciplinas } = dados;
  const professor = professores.find((p) => p.id === Number(id));
  if (!professor) {
    return (
      <>
        <VoltarPara />
        <div className="card">
          <EstadoVazio icone="bi-person-x" cor="danger" titulo="Professor não encontrado" descricao="Ele pode ter sido excluído." />
        </div>
      </>
    );
  }

  const disciplinaPorId = (disciplinaId) => disciplinas.find((d) => d.id === disciplinaId);
  const minhasTurmas = turmas.filter((t) => t.professorId === professor.id).sort((a, b) => a.codigo.localeCompare(b.codigo));
  const carga = cargaDoProfessor(professor.id, turmas);
  const alunosAtendidos = minhasTurmas.reduce((soma, t) => soma + t.alunos.length, 0);
  const disciplinasDistintas = new Set(minhasTurmas.map((t) => t.disciplinaId)).size;
  const eventos = minhasTurmas.map((t) => ({
    id: t.id,
    horarios: t.horarios,
    titulo: t.codigo,
    subtitulo: disciplinaPorId(t.disciplinaId)?.nome,
    detalhe: `${t.alunos.length}/${t.vagas} alunos`,
    cor: corDaDisciplina(t.disciplinaId),
  }));

  const ofertar = (
    <Link to={`/instituicao/turmas/nova?professor=${professor.id}`} className="btn btn-primary">
      <i className="bi bi-plus-lg me-2" aria-hidden="true" />
      Ofertar turma
    </Link>
  );

  return (
    <>
      <VoltarPara />

      <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
        <Avatar nome={professor.nome} tamanho={64} />
        <div className="me-auto">
          <h1 className="h3 mb-1">{professor.nome}</h1>
          <p className="text-body-secondary mb-0">
            <i className="bi bi-briefcase me-1" aria-hidden="true" />
            {professor.area}
          </p>
        </div>
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-neutro" onClick={() => setEditando(true)}>
            <i className="bi bi-pencil me-2" aria-hidden="true" />
            Editar
          </button>
          {ofertar}
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <CartaoIndicador
            icone="bi-speedometer2"
            rotulo="Carga semanal"
            valor={`${carga}/${professor.cargaMaxima}`}
            detalhe={`${percentual(carga, professor.cargaMaxima)}% da carga máxima`}
          >
            <div className="mt-2">
              <BarraUso valor={carga} maximo={professor.cargaMaxima} />
            </div>
          </CartaoIndicador>
        </div>
        <div className="col-md-4">
          <CartaoIndicador
            icone="bi-collection"
            cor="info"
            rotulo={`Turmas em ${SEMESTRE_ATUAL}`}
            valor={minhasTurmas.length}
            detalhe={plural(disciplinasDistintas, 'disciplina diferente', 'disciplinas diferentes')}
          />
        </div>
        <div className="col-md-4">
          <CartaoIndicador icone="bi-people" cor="success" rotulo="Alunos atendidos" valor={alunosAtendidos} detalhe="Soma dos matriculados nas turmas" />
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-header py-3">
          <h2 className="h6 mb-0">Turmas no semestre</h2>
        </div>
        {minhasTurmas.length === 0 ? (
          <EstadoVazio compacto icone="bi-calendar-plus" titulo="Nenhuma turma neste semestre" descricao="Oferte uma turma para este professor." acao={ofertar} />
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr className="texto-pequeno text-body-secondary">
                  <th scope="col" className="ps-3">Turma</th>
                  <th scope="col">Horários</th>
                  <th scope="col" style={{ minWidth: 150 }}>Ocupação</th>
                  <th scope="col" className="text-end pe-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {minhasTurmas.map((t) => (
                  <tr key={t.id}>
                    <td className="ps-3">
                      <span className="fw-semibold">
                        <span className="legenda-horario" style={{ backgroundColor: corDaDisciplina(t.disciplinaId) }} />
                        {t.codigo}
                      </span>
                      <span className="d-block small text-body-secondary">{disciplinaPorId(t.disciplinaId)?.nome}</span>
                    </td>
                    <td><ListaHorarios horarios={t.horarios} /></td>
                    <td><BarraUso valor={t.alunos.length} maximo={t.vagas} detalhe={`${t.alunos.length}/${t.vagas} vagas`} /></td>
                    <td className="text-end pe-3">
                      <Link to={`/instituicao/turmas/${t.id}/editar`} className="btn botao-icone" title={`Editar ${t.codigo}`} aria-label={`Editar ${t.codigo}`}>
                        <i className="bi bi-pencil" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {minhasTurmas.length > 0 && (
        <div className="card">
          <div className="card-header py-3">
            <h2 className="h6 mb-0">Agenda semanal</h2>
          </div>
          <div className="card-body">
            <GradeHoraria eventos={eventos} />
          </div>
        </div>
      )}

      <PainelLateral aberto={editando} titulo={`Editar ${professor.nome}`} aoFechar={() => setEditando(false)}>
        {editando && (
          <FormularioProfessor
            professor={professor}
            cargaAtual={carga}
            aoSalvar={() => {
              setEditando(false);
              recarregar();
            }}
            aoCancelar={() => setEditando(false)}
          />
        )}
      </PainelLateral>
    </>
  );
}
