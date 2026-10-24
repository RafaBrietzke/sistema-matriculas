import { useState } from 'react';
import { Link } from 'react-router-dom';
import { atualizar, criar, listar, requisicao } from '../../api/cliente';
import { useNotificacao } from '../../contexto/notificacao';
import { useBuscaDados } from '../../hooks/useBuscaDados';
import { plural } from '../../utilitarios/indicadores';
import { etapaNoCurso } from '../../utilitarios/disciplinas';
import AlertaErro from '../../componentes/AlertaErro';
import Avatar from '../../componentes/Avatar';
import BarraUso from '../../componentes/BarraUso';
import CabecalhoPagina from '../../componentes/CabecalhoPagina';
import ChecklistDisciplinas from '../../componentes/ChecklistDisciplinas';
import EstadoVazio from '../../componentes/EstadoVazio';
import { EsqueletoLista } from '../../componentes/Esqueleto';
import ModalExclusao from '../../componentes/ModalExclusao';
import PainelLateral from '../../componentes/PainelLateral';

async function buscarDados() {
  const [alunos, cursos, disciplinas, turmas] = await Promise.all([
    listar('alunos'),
    listar('cursos'),
    listar('disciplinas'),
    listar('turmas'),
  ]);
  return { alunos, cursos, disciplinas, turmas };
}

export default function Alunos() {
  const { dados, carregando, erro, recarregar } = useBuscaDados(buscarDados);
  const [busca, setBusca] = useState('');
  const [curso, setCurso] = useState('');
  const [editando, setEditando] = useState(null);
  const [excluindo, setExcluindo] = useState(null);

  const acoes = (
    <button type="button" className="btn btn-primary" onClick={() => setEditando({})}>
      <i className="bi bi-plus-lg me-2" aria-hidden="true" />
      Novo aluno
    </button>
  );

  if (carregando && !dados) {
    return (
      <>
        <CabecalhoPagina titulo="Alunos" acoes={acoes} />
        <EsqueletoLista linhas={6} />
      </>
    );
  }
  if (erro) return <AlertaErro mensagem={erro} aoTentarNovamente={recarregar} />;

  const { alunos, cursos, disciplinas, turmas } = dados;
  const termo = busca.trim().toLowerCase();
  const filtrados = alunos
    .filter((a) => `${a.nome} ${a.matricula}`.toLowerCase().includes(termo) && (!curso || a.cursoId === Number(curso)))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <>
      <CabecalhoPagina titulo="Alunos" subtitulo={plural(alunos.length, 'aluno cadastrado', 'alunos cadastrados')} acoes={acoes} />

      <div className="card">
        <div className="card-body border-bottom row g-2 m-0">
          <div className="col-md-7 ps-md-0">
            <input
              type="search"
              className="form-control"
              placeholder="Buscar por nome ou matrícula"
              aria-label="Buscar aluno"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <div className="col-md-5 pe-md-0">
            <select className="form-select" aria-label="Filtrar por curso" value={curso} onChange={(e) => setCurso(e.target.value)}>
              <option value="">Todos os cursos</option>
              {cursos.map((c) => (
                <option key={c.id} value={c.id}>{c.sigla} — {c.nome}</option>
              ))}
            </select>
          </div>
        </div>
        {filtrados.length === 0 ? (
          <EstadoVazio icone="bi-person-x" titulo="Nenhum aluno encontrado" descricao="Ajuste a busca ou o filtro de curso." />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr className="texto-pequeno text-body-secondary">
                  <th scope="col" className="ps-3">Aluno</th>
                  <th scope="col">Curso</th>
                  <th scope="col" className="text-center" title="Aprovadas na matriz do curso">Aprovadas</th>
                  <th scope="col" className="text-center">Turmas no semestre</th>
                  <th scope="col" className="text-end pe-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((a) => {
                  const cursoDoAluno = cursos.find((c) => c.id === a.cursoId);
                  const naMatriz = a.aprovadas.filter((id) => etapaNoCurso(cursoDoAluno, id) !== null).length;
                  return (
                    <tr key={a.id}>
                      <td className="ps-3">
                        <span className="d-flex align-items-center gap-2">
                          <Avatar nome={a.nome} tamanho={32} />
                          <span className="lh-sm">
                            <Link to={`/instituicao/alunos/${a.id}`} className="d-block fw-medium text-nowrap link-nome">{a.nome}</Link>
                            <span className="texto-pequeno text-body-secondary">{a.matricula}</span>
                          </span>
                        </span>
                      </td>
                      <td className="small">
                        <span className="badge rounded-pill bg-info-subtle text-info-emphasis me-1">{cursoDoAluno?.sigla}</span>
                        {cursoDoAluno?.nome}
                      </td>
                      <td className="text-center">{naMatriz}/{cursoDoAluno?.matriz.length ?? 0}</td>
                      <td className="text-center">{turmas.filter((t) => t.alunos.includes(a.id)).length}</td>
                      <td className="text-end pe-3 text-nowrap">
                        <button type="button" className="btn botao-icone" aria-label={`Editar ${a.nome}`} title="Editar" onClick={() => setEditando(a)}>
                          <i className="bi bi-pencil" aria-hidden="true" />
                        </button>
                        <button type="button" className="btn botao-icone text-danger" aria-label={`Excluir ${a.nome}`} title="Excluir" onClick={() => setExcluindo({ id: a.id, nome: a.nome })}>
                          <i className="bi bi-trash" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PainelLateral
        aberto={Boolean(editando)}
        titulo={editando?.id ? `Editar ${editando.nome}` : 'Novo aluno'}
        subtitulo="O histórico de aprovadas é usado na regra de pré-requisitos da matrícula."
        aoFechar={() => setEditando(null)}
      >
        {editando && (
          <FormularioAluno
            key={editando.id ?? 'novo'}
            aluno={editando.id ? editando : null}
            cursos={cursos}
            disciplinas={disciplinas}
            aoSalvar={() => {
              setEditando(null);
              recarregar();
            }}
            aoCancelar={() => setEditando(null)}
          />
        )}
      </PainelLateral>

      <ModalExclusao item={excluindo} recurso="alunos" aoFechar={() => setExcluindo(null)} aoExcluir={recarregar} />
    </>
  );
}

export function FormularioAluno({ aluno, cursos, disciplinas, aoSalvar, aoCancelar }) {
  const { notificar } = useNotificacao();
  const { dados: previa } = useBuscaDados(() => (aluno ? Promise.resolve(null) : requisicao('/alunos/proxima-matricula')));
  const [form, setForm] = useState({
    nome: aluno?.nome ?? '',
    cursoId: aluno ? String(aluno.cursoId) : '',
    aprovadas: aluno?.aprovadas ?? [],
  });
  const [tentouSalvar, setTentouSalvar] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroServidor, setErroServidor] = useState('');

  const erros = {
    nome: form.nome.trim().length < 3 && 'Informe o nome completo (mínimo de 3 letras)',
    cursoId: !form.cursoId && 'Selecione o curso',
  };
  const valido = !Object.values(erros).some(Boolean);
  const classe = (campo) => (tentouSalvar && erros[campo] ? 'is-invalid' : '');
  const nomeDe = (id) => disciplinas.find((d) => d.id === id)?.nome;
  const curso = cursos.find((c) => c.id === Number(form.cursoId));
  const aprovadasNaMatriz = form.aprovadas.filter((id) => etapaNoCurso(curso, id) !== null).length;

  function alterar(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
    setErroServidor('');
  }

  function motivoBloqueio(d, marcada) {
    if (marcada) {
      const dependentes = disciplinas.filter((x) => form.aprovadas.includes(x.id) && x.preRequisitos.includes(d.id));
      return dependentes.length ? `Necessária para: ${dependentes.map((x) => x.nome).join(', ')}` : null;
    }
    const faltando = d.preRequisitos.filter((id) => !form.aprovadas.includes(id));
    return faltando.length ? `Requer: ${faltando.map(nomeDe).join(', ')}` : null;
  }

  async function salvar(evento) {
    evento.preventDefault();
    setTentouSalvar(true);
    if (!valido) return;
    setSalvando(true);
    try {
      const payload = { ...form, cursoId: Number(form.cursoId) };
      const salvo = aluno ? await atualizar('alunos', aluno.id, payload) : await criar('alunos', payload);
      notificar({ tipo: 'sucesso', titulo: `${salvo.nome} ${aluno ? 'atualizado(a)' : 'cadastrado(a)'}`, mensagem: `Matrícula ${salvo.matricula}` });
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
          <label htmlFor="matricula-aluno" className="form-label fw-medium">Matrícula</label>
          <input id="matricula-aluno" className="form-control" value={aluno?.matricula ?? previa?.matricula ?? 'Gerando…'} readOnly disabled />
          <div className="form-text">{aluno ? 'A matrícula não pode ser alterada.' : 'Gerada automaticamente pelo sistema.'}</div>
        </div>
        <div>
          <label htmlFor="nome-aluno" className="form-label fw-medium">Nome completo</label>
          <input id="nome-aluno" className={`form-control ${classe('nome')}`} value={form.nome} onChange={(e) => alterar('nome', e.target.value)} />
          <div className="invalid-feedback">{erros.nome}</div>
        </div>
        <div>
          <label htmlFor="curso-aluno" className="form-label fw-medium">Curso</label>
          <select id="curso-aluno" className={`form-select ${classe('cursoId')}`} value={form.cursoId} onChange={(e) => alterar('cursoId', e.target.value)}>
            <option value="">Selecione o curso</option>
            {cursos.map((c) => (
              <option key={c.id} value={c.id}>{c.sigla} — {c.nome}</option>
            ))}
          </select>
          <div className="invalid-feedback">{erros.cursoId}</div>
        </div>
        <div>
          <p className="form-label fw-medium mb-2">Histórico de aprovadas</p>
          <div className="mb-2">
            {curso ? (
              <BarraUso
                valor={aprovadasNaMatriz}
                maximo={curso.matriz.length}
                detalhe={`${aprovadasNaMatriz} de ${curso.matriz.length} disciplinas da matriz de ${curso.sigla}`}
                cor="success"
              />
            ) : (
              <p className="small text-body-secondary mb-0">Selecione o curso para ver o histórico organizado pela matriz.</p>
            )}
          </div>
          <ChecklistDisciplinas
            disciplinas={disciplinas}
            selecionadas={form.aprovadas}
            aoAlterar={(lista) => alterar('aprovadas', lista)}
            motivoBloqueio={motivoBloqueio}
            etapaDe={curso ? (d) => etapaNoCurso(curso, d.id) : undefined}
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
          {aluno ? 'Salvar alterações' : 'Cadastrar aluno'}
        </button>
      </div>
    </form>
  );
}
