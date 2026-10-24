import { useState } from 'react';
import { Link } from 'react-router-dom';
import { atualizar, criar, listar } from '../../api/cliente';
import { useNotificacao } from '../../contexto/notificacao';
import { useBuscaDados } from '../../hooks/useBuscaDados';
import { plural } from '../../utilitarios/indicadores';
import AlertaErro from '../../componentes/AlertaErro';
import CabecalhoPagina from '../../componentes/CabecalhoPagina';
import { EsqueletoCartoes } from '../../componentes/Esqueleto';
import ModalExclusao from '../../componentes/ModalExclusao';
import PainelLateral from '../../componentes/PainelLateral';

async function buscarDados() {
  const [cursos, disciplinas, alunos] = await Promise.all([listar('cursos'), listar('disciplinas'), listar('alunos')]);
  return { cursos, disciplinas, alunos };
}

export default function Cursos() {
  const { dados, carregando, erro, recarregar } = useBuscaDados(buscarDados);
  const [editando, setEditando] = useState(null);
  const [excluindo, setExcluindo] = useState(null);

  const acoes = (
    <button type="button" className="btn btn-primary" onClick={() => setEditando({})}>
      <i className="bi bi-plus-lg me-2" aria-hidden="true" />
      Novo curso
    </button>
  );

  if (carregando && !dados) {
    return (
      <>
        <CabecalhoPagina titulo="Cursos" acoes={acoes} />
        <EsqueletoCartoes />
      </>
    );
  }
  if (erro) return <AlertaErro mensagem={erro} aoTentarNovamente={recarregar} />;

  const { cursos, disciplinas, alunos } = dados;

  return (
    <>
      <CabecalhoPagina titulo="Cursos" subtitulo="Abra um curso para montar a matriz curricular: as disciplinas de cada etapa." acoes={acoes} />

      <div className="row g-3">
        {cursos.map((curso) => {
          const creditos = curso.matriz.reduce((soma, m) => soma + (disciplinas.find((d) => d.id === m.disciplinaId)?.creditos ?? 0), 0);
          const totalAlunos = alunos.filter((a) => a.cursoId === curso.id).length;
          return (
            <div className="col-md-6 col-xl-3" key={curso.id}>
              <div className="card card-link-app h-100">
                <Link to={`/instituicao/cursos/${curso.id}`} className="card-body d-flex flex-column gap-3 text-reset text-decoration-none">
                  <div className="d-flex align-items-center gap-3">
                    <span className="icone-bolha bg-primary-subtle text-primary-emphasis fw-bold small">{curso.sigla}</span>
                    <h2 className="h6 mb-0">{curso.nome}</h2>
                  </div>
                  <p className="small text-body-secondary mb-0">
                    {plural(curso.etapas, 'etapa', 'etapas')} ·{' '}
                    {curso.matriz.length === 0 ? (
                      <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis">Matriz vazia</span>
                    ) : (
                      `${plural(curso.matriz.length, 'disciplina', 'disciplinas')} · ${creditos} créditos`
                    )}
                  </p>
                  <p className="small mb-0 mt-auto">
                    <i className="bi bi-mortarboard me-1 text-body-secondary" aria-hidden="true" />
                    {plural(totalAlunos, 'aluno', 'alunos')}
                  </p>
                </Link>
                <div className="card-footer bg-transparent d-flex justify-content-end gap-1 py-2">
                  <button type="button" className="btn botao-icone" aria-label={`Editar ${curso.sigla}`} title="Editar curso" onClick={() => setEditando(curso)}>
                    <i className="bi bi-pencil" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="btn botao-icone text-danger"
                    aria-label={`Excluir ${curso.sigla}`}
                    title="Excluir curso"
                    onClick={() => setExcluindo({ id: curso.id, nome: curso.nome })}
                  >
                    <i className="bi bi-trash" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <PainelLateral
        aberto={Boolean(editando)}
        titulo={editando?.id ? `Editar ${editando.sigla}` : 'Novo curso'}
        subtitulo="O número de etapas é a duração do curso; a matriz é montada depois, na página do curso."
        aoFechar={() => setEditando(null)}
      >
        {editando && (
          <FormularioCurso
            key={editando.id ?? 'novo'}
            curso={editando.id ? editando : null}
            aoSalvar={() => {
              setEditando(null);
              recarregar();
            }}
            aoCancelar={() => setEditando(null)}
          />
        )}
      </PainelLateral>

      <ModalExclusao item={excluindo} recurso="cursos" aoFechar={() => setExcluindo(null)} aoExcluir={recarregar} />
    </>
  );
}

export function FormularioCurso({ curso, aoSalvar, aoCancelar }) {
  const { notificar } = useNotificacao();
  const [form, setForm] = useState({
    nome: curso?.nome ?? '',
    sigla: curso?.sigla ?? '',
    etapas: String(curso?.etapas ?? 8),
  });
  const [tentouSalvar, setTentouSalvar] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroServidor, setErroServidor] = useState('');

  const etapas = Number(form.etapas);
  const maiorEtapaUsada = Math.max(0, ...(curso?.matriz ?? []).map((m) => m.etapa));
  const erros = {
    nome: form.nome.trim().length < 3 && 'Informe o nome (mínimo de 3 letras)',
    sigla: !/^[A-Za-z]{2,5}$/.test(form.sigla.trim()) && 'Use de 2 a 5 letras (ex.: ADS)',
    etapas:
      !Number.isInteger(etapas) || etapas < 1 || etapas > 12
        ? 'Informe um inteiro entre 1 e 12'
        : etapas < maiorEtapaUsada && `A ${maiorEtapaUsada}ª etapa tem disciplinas; mova-as antes de reduzir`,
  };
  const valido = !Object.values(erros).some(Boolean);
  const classe = (campo) => (tentouSalvar && erros[campo] ? 'is-invalid' : '');

  function alterar(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
    setErroServidor('');
  }

  async function salvar(evento) {
    evento.preventDefault();
    setTentouSalvar(true);
    if (!valido) return;
    setSalvando(true);
    const payload = { nome: form.nome, sigla: form.sigla.trim().toUpperCase(), etapas };
    try {
      const salvo = curso ? await atualizar('cursos', curso.id, payload) : await criar('cursos', payload);
      notificar({ tipo: 'sucesso', titulo: `Curso ${salvo.sigla} ${curso ? 'atualizado' : 'cadastrado'}` });
      aoSalvar(salvo);
    } catch (e) {
      setErroServidor(e.message);
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} noValidate>
      <div className="offcanvas-body d-grid gap-3 align-content-start">
        <div>
          <label htmlFor="nome-curso" className="form-label fw-medium">Nome</label>
          <input id="nome-curso" className={`form-control ${classe('nome')}`} value={form.nome} onChange={(e) => alterar('nome', e.target.value)} />
          <div className="invalid-feedback">{erros.nome}</div>
        </div>
        <div className="row g-3">
          <div className="col-6">
            <label htmlFor="sigla-curso" className="form-label fw-medium">Sigla</label>
            <input id="sigla-curso" className={`form-control text-uppercase ${classe('sigla')}`} value={form.sigla} onChange={(e) => alterar('sigla', e.target.value)} />
            <div className="invalid-feedback">{erros.sigla}</div>
          </div>
          <div className="col-6">
            <label htmlFor="etapas-curso" className="form-label fw-medium">Etapas</label>
            <input
              id="etapas-curso"
              type="number"
              min={Math.max(1, maiorEtapaUsada)}
              max="12"
              className={`form-control ${classe('etapas')}`}
              value={form.etapas}
              onChange={(e) => alterar('etapas', e.target.value)}
            />
            <div className="invalid-feedback">{erros.etapas}</div>
          </div>
        </div>
        {curso && maiorEtapaUsada > 0 && <div className="form-text mt-n2">A matriz usa até a {maiorEtapaUsada}ª etapa.</div>}

        {erroServidor && (
          <div className="alert alert-danger small mb-0" role="alert">
            <i className="bi bi-exclamation-octagon me-1" aria-hidden="true" />
            {erroServidor}
          </div>
        )}
      </div>

      <div className="border-top p-3 d-flex gap-2">
        <button type="button" className="btn btn-neutro flex-fill" onClick={aoCancelar}>Cancelar</button>
        <button type="submit" className="btn btn-primary flex-fill" disabled={salvando}>
          {salvando && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
          {curso ? 'Salvar alterações' : 'Cadastrar curso'}
        </button>
      </div>
    </form>
  );
}
