import { useState } from 'react';
import { atualizar, criar, listar } from '../../api/cliente';
import { useNotificacao } from '../../contexto/notificacao';
import { useBuscaDados } from '../../hooks/useBuscaDados';
import { cursosDaDisciplina, dependeDe } from '../../utilitarios/disciplinas';
import { plural } from '../../utilitarios/indicadores';
import AlertaErro from '../../componentes/AlertaErro';
import BadgesCursos from '../../componentes/BadgesCursos';
import CabecalhoPagina from '../../componentes/CabecalhoPagina';
import ChecklistDisciplinas from '../../componentes/ChecklistDisciplinas';
import EstadoVazio from '../../componentes/EstadoVazio';
import { EsqueletoLista } from '../../componentes/Esqueleto';
import ModalExclusao from '../../componentes/ModalExclusao';
import PainelLateral from '../../componentes/PainelLateral';

async function buscarDados() {
  const [disciplinas, turmas, cursos] = await Promise.all([listar('disciplinas'), listar('turmas'), listar('cursos')]);
  return { disciplinas, turmas, cursos };
}

export default function Disciplinas() {
  const { dados, carregando, erro, recarregar } = useBuscaDados(buscarDados);
  const [busca, setBusca] = useState('');
  const [cursoId, setCursoId] = useState('');
  const [editando, setEditando] = useState(null);
  const [excluindo, setExcluindo] = useState(null);

  const acoes = (
    <button type="button" className="btn btn-primary" onClick={() => setEditando({})}>
      <i className="bi bi-plus-lg me-2" aria-hidden="true" />
      Nova disciplina
    </button>
  );

  if (carregando && !dados) {
    return (
      <>
        <CabecalhoPagina titulo="Disciplinas" acoes={acoes} />
        <EsqueletoLista linhas={6} />
      </>
    );
  }
  if (erro) return <AlertaErro mensagem={erro} aoTentarNovamente={recarregar} />;

  const { disciplinas, turmas, cursos } = dados;
  const codigoDe = (id) => disciplinas.find((d) => d.id === id)?.codigo;
  const termo = busca.trim().toLowerCase();
  const filtradas = disciplinas
    .filter((d) => `${d.codigo} ${d.nome}`.toLowerCase().includes(termo))
    .filter((d) => !cursoId || cursosDaDisciplina(d.id, cursos).some((c) => c.id === Number(cursoId)))
    .sort((a, b) => a.codigo.localeCompare(b.codigo));

  return (
    <>
      <CabecalhoPagina titulo="Disciplinas" subtitulo={`${plural(disciplinas.length, 'disciplina cadastrada', 'disciplinas cadastradas')}`} acoes={acoes} />

      <div className="card">
        <div className="card-body border-bottom row g-2 m-0">
          <div className="col-md-7 ps-md-0">
            <input
              type="search"
              className="form-control"
              placeholder="Buscar por código ou nome"
              aria-label="Buscar disciplina"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <div className="col-md-5 pe-md-0">
            <select className="form-select" aria-label="Filtrar por curso" value={cursoId} onChange={(e) => setCursoId(e.target.value)}>
              <option value="">Todos os cursos</option>
              {cursos.map((c) => (
                <option key={c.id} value={c.id}>{c.sigla} — {c.nome}</option>
              ))}
            </select>
          </div>
        </div>
        {filtradas.length === 0 ? (
          <EstadoVazio icone="bi-journal-x" titulo="Nenhuma disciplina encontrada" descricao="Ajuste a busca ou cadastre uma nova disciplina." />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr className="texto-pequeno text-body-secondary">
                  <th scope="col" className="ps-3">Disciplina</th>
                  <th scope="col">Cursos</th>
                  <th scope="col" className="text-center">Créditos</th>
                  <th scope="col">Pré-requisitos</th>
                  <th scope="col" className="text-center">Turmas</th>
                  <th scope="col" className="text-end pe-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((d) => (
                  <tr key={d.id}>
                    <td className="ps-3">
                      <span className="fw-semibold">{d.codigo}</span>
                      <span className="d-block small text-body-secondary">{d.nome}</span>
                    </td>
                    <td><BadgesCursos cursos={cursosDaDisciplina(d.id, cursos)} /></td>
                    <td className="text-center">{d.creditos}</td>
                    <td>
                      {d.preRequisitos.length === 0 ? (
                        <span className="small text-body-secondary">—</span>
                      ) : (
                        <div className="d-flex flex-wrap gap-1">
                          {d.preRequisitos.map((id) => (
                            <span key={id} className="badge rounded-pill bg-secondary-subtle text-secondary-emphasis fw-medium">{codigoDe(id)}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="text-center">{turmas.filter((t) => t.disciplinaId === d.id).length}</td>
                    <td className="text-end pe-3 text-nowrap">
                      <button type="button" className="btn botao-icone" aria-label={`Editar ${d.codigo}`} title="Editar" onClick={() => setEditando(d)}>
                        <i className="bi bi-pencil" aria-hidden="true" />
                      </button>
                      <button type="button" className="btn botao-icone text-danger" aria-label={`Excluir ${d.codigo}`} title="Excluir" onClick={() => setExcluindo({ id: d.id, nome: d.nome })}>
                        <i className="bi bi-trash" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PainelLateral
        aberto={Boolean(editando)}
        titulo={editando?.id ? `Editar ${editando.codigo}` : 'Nova disciplina'}
        subtitulo="Defina o código, os créditos e os pré-requisitos."
        aoFechar={() => setEditando(null)}
      >
        {editando && (
          <FormularioDisciplina
            key={editando.id ?? 'nova'}
            disciplina={editando.id ? editando : null}
            disciplinas={disciplinas}
            temTurmas={turmas.some((t) => t.disciplinaId === editando.id)}
            aoSalvar={() => {
              setEditando(null);
              recarregar();
            }}
            aoCancelar={() => setEditando(null)}
          />
        )}
      </PainelLateral>

      <ModalExclusao item={excluindo} recurso="disciplinas" aoFechar={() => setExcluindo(null)} aoExcluir={recarregar} />
    </>
  );
}

function FormularioDisciplina({ disciplina, disciplinas, temTurmas, aoSalvar, aoCancelar }) {
  const { notificar } = useNotificacao();
  const [form, setForm] = useState({
    codigo: disciplina?.codigo ?? '',
    nome: disciplina?.nome ?? '',
    creditos: String(disciplina?.creditos ?? 4),
    preRequisitos: disciplina?.preRequisitos ?? [],
  });
  const [tentouSalvar, setTentouSalvar] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroServidor, setErroServidor] = useState('');

  const creditos = Number(form.creditos);
  const erros = {
    codigo: !/^[A-Za-z]{2,4}\d{3}$/.test(form.codigo.trim()) && 'Use o formato AAA999 (ex.: ADS101)',
    nome: form.nome.trim().length < 3 && 'Informe o nome (mínimo de 3 letras)',
    creditos: (!Number.isInteger(creditos) || creditos < 1 || creditos > 12) && 'Informe um inteiro entre 1 e 12',
  };
  const valido = !Object.values(erros).some(Boolean);
  const classe = (campo) => (tentouSalvar && erros[campo] ? 'is-invalid' : '');

  function alterar(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
    setErroServidor('');
  }

  function motivoBloqueio(d) {
    if (disciplina && dependeDe(d.id, disciplina.id, disciplinas)) return `Criaria um ciclo: depende de ${disciplina.codigo}`;
    return null;
  }

  async function salvar(evento) {
    evento.preventDefault();
    setTentouSalvar(true);
    if (!valido) return;
    setSalvando(true);
    const payload = { ...form, codigo: form.codigo.trim().toUpperCase(), creditos };
    try {
      const salva = disciplina ? await atualizar('disciplinas', disciplina.id, payload) : await criar('disciplinas', payload);
      notificar({ tipo: 'sucesso', titulo: `Disciplina ${salva.codigo} ${disciplina ? 'atualizada' : 'cadastrada'}` });
      aoSalvar();
    } catch (e) {
      setErroServidor(e.message);
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} noValidate>
      <div className="offcanvas-body d-grid gap-3">
        <div className="row g-3">
          <div className="col-7">
            <label htmlFor="codigo" className="form-label fw-medium">Código</label>
            <input id="codigo" className={`form-control text-uppercase ${classe('codigo')}`} value={form.codigo} disabled={temTurmas} onChange={(e) => alterar('codigo', e.target.value)} />
            <div className="invalid-feedback">{erros.codigo}</div>
            {temTurmas && <div className="form-text">Já tem turmas ofertadas: o código não pode mudar.</div>}
          </div>
          <div className="col-5">
            <label htmlFor="creditos" className="form-label fw-medium">Créditos</label>
            <input id="creditos" type="number" min="1" max="12" className={`form-control ${classe('creditos')}`} value={form.creditos} onChange={(e) => alterar('creditos', e.target.value)} />
            <div className="invalid-feedback">{erros.creditos}</div>
          </div>
        </div>

        <div>
          <label htmlFor="nome" className="form-label fw-medium">Nome</label>
          <input id="nome" className={`form-control ${classe('nome')}`} value={form.nome} onChange={(e) => alterar('nome', e.target.value)} />
          <div className="invalid-feedback">{erros.nome}</div>
        </div>

        <div>
          <p className="form-label fw-medium mb-1">Pré-requisitos</p>
          <p className="small text-body-secondary mb-2">Disciplinas que o aluno precisa ter aprovado antes de cursar esta. Os cursos e as etapas são definidos na tela Cursos.</p>
          <ChecklistDisciplinas
            disciplinas={disciplinas.filter((d) => d.id !== disciplina?.id)}
            selecionadas={form.preRequisitos}
            aoAlterar={(lista) => alterar('preRequisitos', lista)}
            motivoBloqueio={motivoBloqueio}
          />
        </div>

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
          {disciplina ? 'Salvar alterações' : 'Cadastrar disciplina'}
        </button>
      </div>
    </form>
  );
}
