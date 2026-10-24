import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { atualizar, listar, salvarNaMatriz } from '../../api/cliente';
import { useNotificacao } from '../../contexto/notificacao';
import { useBuscaDados } from '../../hooks/useBuscaDados';
import { plural } from '../../utilitarios/indicadores';
import AlertaErro from '../../componentes/AlertaErro';
import EstadoVazio from '../../componentes/EstadoVazio';
import { EsqueletoCartoes } from '../../componentes/Esqueleto';
import ModalExclusao from '../../componentes/ModalExclusao';
import PainelLateral from '../../componentes/PainelLateral';
import { FormularioCurso } from './Cursos';

async function buscarDados() {
  const [cursos, disciplinas, alunos] = await Promise.all([listar('cursos'), listar('disciplinas'), listar('alunos')]);
  return { cursos, disciplinas, alunos };
}

// Etapas em que a disciplina pode ficar: depois dos pré-requisitos e antes das disciplinas que dependem dela.
function limitesDeEtapa(disciplina, curso, disciplinas) {
  const outras = curso.matriz.filter((m) => m.disciplinaId !== disciplina.id);
  const etapaDe = (id) => outras.find((m) => m.disciplinaId === id)?.etapa;
  const faltando = disciplina.preRequisitos.filter((p) => etapaDe(p) === undefined).map((p) => disciplinas.find((d) => d.id === p)?.nome);
  const minima = Math.max(0, ...disciplina.preRequisitos.map((p) => etapaDe(p) ?? 0)) + 1;
  const dependentes = outras.filter((m) => disciplinas.find((d) => d.id === m.disciplinaId)?.preRequisitos.includes(disciplina.id));
  const maxima = dependentes.length ? Math.min(...dependentes.map((m) => m.etapa)) - 1 : curso.etapas;
  return { faltando, minima, maxima };
}

function VoltarPara() {
  return (
    <Link to="/instituicao/cursos" className="small text-decoration-none d-inline-flex align-items-center gap-1 mb-3">
      <i className="bi bi-arrow-left" aria-hidden="true" />
      Cursos
    </Link>
  );
}

export default function MatrizCurso() {
  const { id } = useParams();
  const { notificar } = useNotificacao();
  const { dados, carregando, erro, recarregar } = useBuscaDados(buscarDados);
  const [adicionando, setAdicionando] = useState(false);
  const [removendo, setRemovendo] = useState(null);
  const [editandoCurso, setEditandoCurso] = useState(false);

  if (carregando && !dados) {
    return (
      <>
        <VoltarPara />
        <EsqueletoCartoes />
      </>
    );
  }
  if (erro) return <AlertaErro mensagem={erro} aoTentarNovamente={recarregar} />;

  const { cursos, disciplinas, alunos } = dados;
  const curso = cursos.find((c) => c.id === Number(id));
  if (!curso) {
    return (
      <>
        <VoltarPara />
        <div className="card">
          <EstadoVazio icone="bi-question-circle" cor="danger" titulo="Curso não encontrado" />
        </div>
      </>
    );
  }

  const disciplinaPorId = (disciplinaId) => disciplinas.find((d) => d.id === disciplinaId);
  const codigoDe = (disciplinaId) => disciplinaPorId(disciplinaId)?.codigo;
  const etapas = Array.from({ length: curso.etapas }, (_, i) => i + 1);
  const creditos = curso.matriz.reduce((soma, m) => soma + (disciplinaPorId(m.disciplinaId)?.creditos ?? 0), 0);
  const totalAlunos = alunos.filter((a) => a.cursoId === curso.id).length;

  async function moverEtapa(disciplina, etapa) {
    try {
      await salvarNaMatriz(curso.id, disciplina.id, etapa);
      notificar({ tipo: 'sucesso', titulo: `${disciplina.codigo} movida para a ${etapa}ª etapa` });
    } catch (e) {
      notificar({ tipo: 'erro', titulo: 'Não foi possível mudar a etapa', mensagem: e.message });
    }
    recarregar();
  }

  async function mudarNumeroDeEtapas(novoTotal) {
    try {
      await atualizar('cursos', curso.id, { nome: curso.nome, sigla: curso.sigla, etapas: novoTotal });
      notificar({ tipo: 'sucesso', titulo: `${curso.sigla} agora tem ${plural(novoTotal, 'etapa', 'etapas')}` });
    } catch (e) {
      notificar({ tipo: 'erro', titulo: 'Não foi possível alterar as etapas', mensagem: e.message });
    }
    recarregar();
  }

  return (
    <>
      <VoltarPara />

      <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
        <span className="icone-bolha icone-bolha-lg bg-primary-subtle text-primary-emphasis fw-bold fs-6">{curso.sigla}</span>
        <div className="me-auto">
          <h1 className="h3 mb-1">{curso.nome}</h1>
          <p className="text-body-secondary mb-0">
            Matriz curricular · {plural(curso.etapas, 'etapa', 'etapas')} · {plural(curso.matriz.length, 'disciplina', 'disciplinas')} ·{' '}
            {creditos} créditos ·{' '}
            {plural(totalAlunos, 'aluno', 'alunos')}
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button type="button" className="btn btn-neutro" onClick={() => setEditandoCurso(true)}>
            <i className="bi bi-pencil me-2" aria-hidden="true" />
            Editar curso
          </button>
          <button type="button" className="btn btn-neutro" disabled={curso.etapas >= 12} onClick={() => mudarNumeroDeEtapas(curso.etapas + 1)}>
            <i className="bi bi-plus-lg me-2" aria-hidden="true" />
            Etapa
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setAdicionando(true)}>
            <i className="bi bi-plus-lg me-2" aria-hidden="true" />
            Adicionar disciplina
          </button>
        </div>
      </div>

      {curso.matriz.length === 0 && (
        <div className="alert alert-info d-flex gap-2">
          <i className="bi bi-info-circle" aria-hidden="true" />
          <span>Matriz vazia: adicione as disciplinas do curso, começando pelas da 1ª etapa (sem pré-requisitos).</span>
        </div>
      )}
      <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4 g-3">
        {etapas.map((etapa) => {
          const daEtapa = curso.matriz
            .filter((m) => m.etapa === etapa)
            .map((m) => disciplinaPorId(m.disciplinaId))
            .filter(Boolean)
            .sort((a, b) => a.codigo.localeCompare(b.codigo));
          return (
            <div className="col" key={etapa}>
              <div className="card h-100 coluna-etapa">
                <div className="card-header py-3 d-flex justify-content-between align-items-center gap-2">
                  <h2 className="h6 mb-0">{etapa}ª etapa</h2>
                  <span className="texto-pequeno text-body-secondary ms-auto">{daEtapa.reduce((s, d) => s + d.creditos, 0)} créditos</span>
                  {etapa === curso.etapas && etapa > 1 && daEtapa.length === 0 && (
                    <button
                      type="button"
                      className="btn botao-icone text-danger"
                      aria-label={`Remover a ${etapa}ª etapa`}
                      title="Remover esta etapa"
                      onClick={() => mudarNumeroDeEtapas(etapa - 1)}
                    >
                      <i className="bi bi-dash-circle" aria-hidden="true" />
                    </button>
                  )}
                </div>
                <div className="card-body d-grid gap-2 align-content-start">
                  {daEtapa.length === 0 && <p className="small text-body-secondary mb-0">Nenhuma disciplina nesta etapa.</p>}
                  {daEtapa.map((d) => {
                    const { minima, maxima } = limitesDeEtapa(d, curso, disciplinas);
                    return (
                      <div key={d.id} className="border rounded-3 p-2 cartao-matriz">
                        <div className="d-flex justify-content-between gap-2">
                          <span className="small lh-sm">
                            <span className="fw-semibold d-block">{d.codigo}</span>
                            {d.nome}
                          </span>
                          <button
                            type="button"
                            className="btn botao-icone text-danger flex-shrink-0"
                            aria-label={`Remover ${d.codigo} da matriz`}
                            title="Remover da matriz"
                            onClick={() => setRemovendo({ id: d.id, nome: d.nome })}
                          >
                            <i className="bi bi-x-lg" aria-hidden="true" />
                          </button>
                        </div>
                        <div className="d-flex flex-wrap align-items-center gap-1 mt-2">
                          <span className="texto-pequeno text-body-secondary me-auto">
                            {d.creditos} cr{d.preRequisitos.length > 0 && ` · requer ${d.preRequisitos.map(codigoDe).join(', ')}`}
                          </span>
                          <select
                            className="form-select form-select-sm w-auto"
                            aria-label={`Etapa de ${d.codigo}`}
                            value={etapa}
                            onChange={(e) => moverEtapa(d, Number(e.target.value))}
                          >
                            {etapas.map((n) => (
                              <option key={n} value={n} disabled={n < minima || n > maxima}>
                                {n}ª etapa
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <PainelLateral
        aberto={adicionando}
        titulo={`Adicionar à matriz de ${curso.sigla}`}
        subtitulo="A etapa precisa vir depois das etapas dos pré-requisitos."
        aoFechar={() => setAdicionando(false)}
      >
        {adicionando && (
          <FormularioMatriz
            curso={curso}
            disciplinas={disciplinas}
            aoSalvar={() => {
              setAdicionando(false);
              recarregar();
            }}
            aoCancelar={() => setAdicionando(false)}
          />
        )}
      </PainelLateral>

      <PainelLateral aberto={editandoCurso} titulo={`Editar ${curso.sigla}`} aoFechar={() => setEditandoCurso(false)}>
        {editandoCurso && (
          <FormularioCurso
            curso={curso}
            aoSalvar={() => {
              setEditandoCurso(false);
              recarregar();
            }}
            aoCancelar={() => setEditandoCurso(false)}
          />
        )}
      </PainelLateral>

      <ModalExclusao
        item={removendo}
        recurso={`cursos/${curso.id}/matriz`}
        verbo="Remover"
        sucesso={(nome) => `${nome} removida da matriz`}
        aoFechar={() => setRemovendo(null)}
        aoExcluir={recarregar}
      />
    </>
  );
}

function FormularioMatriz({ curso, disciplinas, aoSalvar, aoCancelar }) {
  const { notificar } = useNotificacao();
  const [disciplinaId, setDisciplinaId] = useState('');
  const [etapa, setEtapa] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erroServidor, setErroServidor] = useState('');

  const foraDaMatriz = disciplinas
    .filter((d) => !curso.matriz.some((m) => m.disciplinaId === d.id))
    .sort((a, b) => a.codigo.localeCompare(b.codigo));
  const disciplina = disciplinas.find((d) => d.id === Number(disciplinaId));
  const limites = disciplina ? limitesDeEtapa(disciplina, curso, disciplinas) : null;
  const etapaValida = limites && Number(etapa) >= limites.minima && Number(etapa) <= limites.maxima;
  const podeSalvar = disciplina && limites.faltando.length === 0 && etapaValida && !salvando;

  function escolherDisciplina(valor) {
    setDisciplinaId(valor);
    setErroServidor('');
    const nova = disciplinas.find((d) => d.id === Number(valor));
    setEtapa(nova ? String(limitesDeEtapa(nova, curso, disciplinas).minima) : '');
  }

  async function salvar(evento) {
    evento.preventDefault();
    if (!podeSalvar) return;
    setSalvando(true);
    try {
      await salvarNaMatriz(curso.id, disciplina.id, Number(etapa));
      notificar({ tipo: 'sucesso', titulo: `${disciplina.codigo} adicionada à ${etapa}ª etapa de ${curso.sigla}` });
      aoSalvar();
    } catch (e) {
      setErroServidor(e.message);
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} noValidate>
      <div className="offcanvas-body d-grid gap-3 align-content-start">
        <div>
          <label htmlFor="disciplina-matriz" className="form-label fw-medium">Disciplina</label>
          <select id="disciplina-matriz" className="form-select" value={disciplinaId} onChange={(e) => escolherDisciplina(e.target.value)}>
            <option value="">Selecione...</option>
            {foraDaMatriz.map((d) => (
              <option key={d.id} value={d.id}>
                {d.codigo} — {d.nome}
              </option>
            ))}
          </select>
          {foraDaMatriz.length === 0 && <div className="form-text">Todas as disciplinas já estão na matriz.</div>}
        </div>

        {limites?.faltando.length > 0 && (
          <div className="alert alert-warning small mb-0">
            <i className="bi bi-exclamation-triangle me-1" aria-hidden="true" />
            Adicione antes os pré-requisitos: <strong>{limites.faltando.join(', ')}</strong>.
          </div>
        )}

        {disciplina && limites.faltando.length === 0 && (
          <div>
            <label htmlFor="etapa-matriz" className="form-label fw-medium">Etapa</label>
            <select id="etapa-matriz" className="form-select" value={etapa} onChange={(e) => setEtapa(e.target.value)}>
              {Array.from({ length: curso.etapas }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n} disabled={n < limites.minima || n > limites.maxima}>
                  {n}ª etapa
                </option>
              ))}
            </select>
            <div className="form-text">
              {limites.minima > 1 ? `Por causa dos pré-requisitos, a partir da ${limites.minima}ª etapa.` : 'Sem pré-requisitos: pode ficar em qualquer etapa.'}
            </div>
          </div>
        )}

        {erroServidor && (
          <div className="alert alert-danger small mb-0" role="alert">
            <i className="bi bi-exclamation-octagon me-1" aria-hidden="true" />
            {erroServidor}
          </div>
        )}
      </div>

      <div className="border-top p-3 d-flex gap-2">
        <button type="button" className="btn btn-neutro flex-fill" onClick={aoCancelar}>Cancelar</button>
        <button type="submit" className="btn btn-primary flex-fill" disabled={!podeSalvar}>
          {salvando && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
          Adicionar à matriz
        </button>
      </div>
    </form>
  );
}
