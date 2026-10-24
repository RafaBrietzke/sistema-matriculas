import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { buscarOfertasDoAluno, listar } from '../../api/cliente';
import { useBuscaDados } from '../../hooks/useBuscaDados';
import { percentual, plural } from '../../utilitarios/indicadores';
import { etapaNoCurso } from '../../utilitarios/disciplinas';
import AlertaErro from '../../componentes/AlertaErro';
import Avatar from '../../componentes/Avatar';
import CartaoIndicador from '../../componentes/CartaoIndicador';
import EstadoVazio from '../../componentes/EstadoVazio';
import { EsqueletoCartoes } from '../../componentes/Esqueleto';
import ListaHorarios from '../../componentes/ListaHorarios';
import PainelLateral from '../../componentes/PainelLateral';
import { FormularioAluno } from './Alunos';

async function buscarDados(id) {
  const alunos = await listar('alunos');
  const aluno = alunos.find((a) => a.id === Number(id));
  if (!aluno) return { aluno: null };

  const [cursos, disciplinas, ofertas] = await Promise.all([listar('cursos'), listar('disciplinas'), buscarOfertasDoAluno(aluno.id)]);
  return { aluno, cursos, disciplinas, ...ofertas };
}

function VoltarPara() {
  return (
    <Link to="/instituicao/alunos" className="small text-decoration-none d-inline-flex align-items-center gap-1 mb-3">
      <i className="bi bi-arrow-left" aria-hidden="true" />
      Alunos
    </Link>
  );
}

function Coluna({ icone, cor, titulo, quantidade, children }) {
  return (
    <div className="card h-100">
      <div className="card-header py-3 d-flex align-items-center gap-2">
        <i className={`bi ${icone} text-${cor}`} aria-hidden="true" />
        <h2 className="h6 mb-0 me-auto">{titulo}</h2>
        <span className={`badge rounded-pill bg-${cor}-subtle text-${cor}-emphasis`}>{quantidade}</span>
      </div>
      {children}
    </div>
  );
}

export default function PerfilAluno() {
  const { id } = useParams();
  const { dados, carregando, erro, recarregar } = useBuscaDados(() => buscarDados(id), id);
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

  const { aluno, cursos, disciplinas, configuracoes, creditosMatriculados, ofertas } = dados;
  if (!aluno) {
    return (
      <>
        <VoltarPara />
        <div className="card">
          <EstadoVazio icone="bi-person-x" cor="danger" titulo="Aluno não encontrado" descricao="Ele pode ter sido excluído." />
        </div>
      </>
    );
  }

  const curso = cursos.find((c) => c.id === aluno.cursoId);
  const nomeDe = (disciplinaId) => disciplinas.find((d) => d.id === disciplinaId)?.nome;
  const etapaDe = (disciplinaId) => etapaNoCurso(curso, disciplinaId);
  const porCodigo = (a, b) => a.codigo.localeCompare(b.codigo);
  const porEtapa = (a, b) => (etapaDe(a.id) ?? 99) - (etapaDe(b.id) ?? 99) || porCodigo(a, b);

  const matriz = disciplinas.filter((d) => etapaDe(d.id) !== null);
  const concluidas = disciplinas.filter((d) => aluno.aprovadas.includes(d.id)).sort(porEtapa);
  const concluidasNaMatriz = concluidas.filter((d) => etapaDe(d.id) !== null);
  const emCurso = ofertas.filter((o) => o.matriculado).sort(porCodigo);
  const idsEmCurso = emCurso.map((o) => o.disciplina.id);
  const faltam = matriz
    .filter((d) => !aluno.aprovadas.includes(d.id) && !idsEmCurso.includes(d.id))
    .sort(porEtapa)
    .map((d) => ({
      ...d,
      faltando: d.preRequisitos.filter((p) => !aluno.aprovadas.includes(p)).map(nomeDe),
      turmas: ofertas.filter((o) => o.disciplina.id === d.id).map((o) => o.codigo),
    }));

  const progresso = percentual(concluidasNaMatriz.length, matriz.length);
  const creditosConcluidos = concluidasNaMatriz.reduce((soma, d) => soma + d.creditos, 0);
  const creditosDoCurso = matriz.reduce((soma, d) => soma + d.creditos, 0);

  return (
    <>
      <VoltarPara />

      <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
        <Avatar nome={aluno.nome} tamanho={64} />
        <div className="me-auto">
          <h1 className="h3 mb-1">{aluno.nome}</h1>
          <p className="text-body-secondary mb-0">
            Matrícula {aluno.matricula} ·{' '}
            <span className="badge rounded-pill bg-info-subtle text-info-emphasis">{curso?.sigla}</span> {curso?.nome}
          </p>
        </div>
        <button type="button" className="btn btn-neutro" onClick={() => setEditando(true)}>
          <i className="bi bi-pencil me-2" aria-hidden="true" />
          Editar cadastro
        </button>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <CartaoIndicador
            icone="bi-graph-up-arrow"
            cor="success"
            rotulo="Progresso no curso"
            valor={`${progresso}%`}
            detalhe={`${concluidasNaMatriz.length} de ${matriz.length} disciplinas da matriz`}
          >
            <div className="progress mt-2" role="progressbar" aria-label="Progresso no curso" aria-valuenow={progresso} aria-valuemin="0" aria-valuemax="100">
              <div className="progress-bar bg-success" style={{ width: `${progresso}%` }} />
            </div>
          </CartaoIndicador>
        </div>
        <div className="col-md-4">
          <CartaoIndicador icone="bi-award" cor="info" rotulo="Créditos concluídos" valor={creditosConcluidos} detalhe={`de ${creditosDoCurso} créditos da matriz`} />
        </div>
        <div className="col-md-4">
          <CartaoIndicador
            icone="bi-collection"
            rotulo={`Semestre ${configuracoes.semestreAtual}`}
            valor={plural(emCurso.length, 'turma', 'turmas')}
            detalhe={`${creditosMatriculados} de ${configuracoes.limiteCreditos} créditos`}
          />
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-4">
          <Coluna icone="bi-check-circle-fill" cor="success" titulo="Concluídas" quantidade={concluidas.length}>
            {concluidas.length === 0 ? (
              <EstadoVazio compacto icone="bi-hourglass" cor="secondary" titulo="Nenhuma disciplina concluída" />
            ) : (
              <ul className="list-group list-group-flush">
                {concluidas.map((d) => (
                  <li key={d.id} className="list-group-item d-flex gap-2">
                    <i className="bi bi-check2 text-success" aria-hidden="true" />
                    <span className="small flex-grow-1">
                      <span className="fw-semibold">{d.codigo}</span> · {d.nome}
                      {etapaDe(d.id) === null && <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis ms-1">fora da matriz</span>}
                    </span>
                    <span className="texto-pequeno text-body-secondary text-nowrap">{d.creditos} cr</span>
                  </li>
                ))}
              </ul>
            )}
          </Coluna>
        </div>

        <div className="col-lg-4">
          <Coluna icone="bi-play-circle-fill" cor="primary" titulo="Em curso" quantidade={emCurso.length}>
            {emCurso.length === 0 ? (
              <EstadoVazio compacto icone="bi-calendar-x" cor="secondary" titulo="Sem matrículas neste semestre" />
            ) : (
              <ul className="list-group list-group-flush">
                {emCurso.map((o) => (
                  <li key={o.id} className="list-group-item">
                    <span className="small">
                      <span className="fw-semibold">{o.codigo}</span> · {o.disciplina.nome}
                    </span>
                    <span className="d-block texto-pequeno text-body-secondary mb-1">Prof. {o.professor.nome}</span>
                    <ListaHorarios horarios={o.horarios} />
                  </li>
                ))}
              </ul>
            )}
          </Coluna>
        </div>

        <div className="col-lg-4">
          <Coluna icone="bi-circle" cor="secondary" titulo="Faltam cursar" quantidade={faltam.length}>
            {faltam.length === 0 ? (
              <EstadoVazio compacto icone="bi-trophy" cor="success" titulo="Todas as disciplinas cursadas" />
            ) : (
              <ul className="list-group list-group-flush">
                {faltam.map((d) => (
                  <li key={d.id} className="list-group-item">
                    <div className="d-flex gap-2 align-items-start">
                      <span className="small flex-grow-1">
                        <span className="texto-pequeno text-body-secondary d-block">{etapaDe(d.id)}ª etapa</span>
                        <span className="fw-semibold">{d.codigo}</span> · {d.nome}
                      </span>
                      {d.faltando.length === 0 && <span className="badge rounded-pill bg-success-subtle text-success-emphasis">Pode cursar</span>}
                    </div>
                    {d.faltando.length > 0 && (
                      <span className="d-block texto-pequeno text-danger-emphasis">
                        <i className="bi bi-lock me-1" aria-hidden="true" />
                        Requer: {d.faltando.join(', ')}
                      </span>
                    )}
                    <span className="d-block texto-pequeno text-body-secondary">
                      <i className="bi bi-collection me-1" aria-hidden="true" />
                      {d.turmas.length ? `Ofertada: ${d.turmas.join(', ')}` : 'Sem turma neste semestre'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Coluna>
        </div>
      </div>

      <PainelLateral aberto={editando} titulo={`Editar ${aluno.nome}`} subtitulo="O histórico de aprovadas é usado na regra de pré-requisitos da matrícula." aoFechar={() => setEditando(false)}>
        {editando && (
          <FormularioAluno
            aluno={aluno}
            cursos={cursos}
            disciplinas={disciplinas}
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
