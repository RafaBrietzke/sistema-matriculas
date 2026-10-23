import { useState } from 'react';
import { Link } from 'react-router-dom';
import { listar, remover } from '../../api/cliente';
import { SEMESTRE_ATUAL } from '../../constantes';
import { useNotificacao } from '../../contexto/notificacao';
import { useBuscaDados } from '../../hooks/useBuscaDados';
import { TURNOS } from '../../utilitarios/horarios';
import { plural } from '../../utilitarios/indicadores';
import AlertaErro from '../../componentes/AlertaErro';
import BarraUso from '../../componentes/BarraUso';
import CabecalhoPagina from '../../componentes/CabecalhoPagina';
import EstadoVazio from '../../componentes/EstadoVazio';
import { EsqueletoLista } from '../../componentes/Esqueleto';
import ListaHorarios from '../../componentes/ListaHorarios';
import ModalConfirmacao from '../../componentes/ModalConfirmacao';

async function buscarDados() {
  const [turmas, disciplinas, professores] = await Promise.all([
    listar('turmas'),
    listar('disciplinas'),
    listar('professores'),
  ]);
  return { turmas, disciplinas, professores };
}

export default function Turmas() {
  const { notificar } = useNotificacao();
  const { dados, carregando, erro, recarregar } = useBuscaDados(buscarDados);
  const [busca, setBusca] = useState('');
  const [professorId, setProfessorId] = useState('');
  const [turno, setTurno] = useState('');
  const [excluindo, setExcluindo] = useState(null);
  const [processando, setProcessando] = useState(false);

  async function confirmarExclusao() {
    setProcessando(true);
    try {
      await remover(`/turmas/${excluindo.id}`);
      notificar({ tipo: 'sucesso', titulo: `Turma ${excluindo.codigo} excluída` });
    } catch (e) {
      notificar({ tipo: 'erro', titulo: 'Não foi possível excluir', mensagem: e.message });
    } finally {
      setProcessando(false);
      setExcluindo(null);
      recarregar();
    }
  }

  const acoes = (
    <Link to="/instituicao/turmas/nova" className="btn btn-primary">
      <i className="bi bi-plus-lg me-2" aria-hidden="true" />
      Nova turma
    </Link>
  );

  if (carregando && !dados) {
    return (
      <>
        <CabecalhoPagina titulo="Oferta de turmas" acoes={acoes} />
        <EsqueletoLista linhas={6} />
      </>
    );
  }
  if (erro) return <AlertaErro mensagem={erro} aoTentarNovamente={recarregar} />;

  const disciplinaPorId = (id) => dados.disciplinas.find((d) => d.id === id);
  const professorPorId = (id) => dados.professores.find((p) => p.id === id);

  const termo = busca.trim().toLowerCase();
  const turmas = dados.turmas
    .filter((t) => {
      const disciplina = disciplinaPorId(t.disciplinaId);
      const professor = professorPorId(t.professorId);
      const texto = `${t.codigo} ${disciplina?.nome} ${professor?.nome}`.toLowerCase();
      return (
        texto.includes(termo) &&
        (!professorId || t.professorId === Number(professorId)) &&
        (!turno || t.horarios.some((h) => h[1] === turno))
      );
    })
    .sort((a, b) => a.codigo.localeCompare(b.codigo));

  return (
    <>
      <CabecalhoPagina
        titulo="Oferta de turmas"
        subtitulo={`${plural(dados.turmas.length, 'turma ofertada', 'turmas ofertadas')} em ${SEMESTRE_ATUAL}`}
        acoes={acoes}
      />

      <div className="card mb-3">
        <div className="card-body row g-2">
          <div className="col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-transparent">
                <i className="bi bi-search" aria-hidden="true" />
              </span>
              <input
                type="search"
                className="form-control"
                placeholder="Buscar por código, disciplina ou professor"
                aria-label="Buscar turma"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>
          <div className="col-sm-6 col-md-3">
            <select className="form-select" aria-label="Filtrar por professor" value={professorId} onChange={(e) => setProfessorId(e.target.value)}>
              <option value="">Todos os professores</option>
              {dados.professores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="col-sm-6 col-md-3">
            <select className="form-select" aria-label="Filtrar por turno" value={turno} onChange={(e) => setTurno(e.target.value)}>
              <option value="">Todos os turnos</option>
              {Object.entries(TURNOS).map(([codigo, nome]) => (
                <option key={codigo} value={codigo}>
                  {nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        {turmas.length === 0 ? (
          <EstadoVazio
            icone="bi-search"
            titulo="Nenhuma turma encontrada"
            descricao={dados.turmas.length ? 'Ajuste a busca ou os filtros.' : 'Comece ofertando a primeira turma do semestre.'}
            acao={!dados.turmas.length && acoes}
          />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr className="texto-pequeno text-body-secondary">
                  <th scope="col" className="ps-3">Turma</th>
                  <th scope="col">Professor</th>
                  <th scope="col">Horários</th>
                  <th scope="col" style={{ minWidth: 150 }}>Ocupação</th>
                  <th scope="col" className="text-end pe-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {turmas.map((turma) => (
                  <tr key={turma.id}>
                    <td className="ps-3">
                      <span className="fw-semibold">{turma.codigo}</span>
                      <span className="d-block small text-body-secondary">{disciplinaPorId(turma.disciplinaId)?.nome}</span>
                    </td>
                    <td className="text-nowrap">
                      <Link to={`/instituicao/professores/${turma.professorId}`} className="link-nome">
                        {professorPorId(turma.professorId)?.nome}
                      </Link>
                    </td>
                    <td>
                      <ListaHorarios horarios={turma.horarios} />
                    </td>
                    <td>
                      <BarraUso valor={turma.alunos.length} maximo={turma.vagas} detalhe={`${turma.alunos.length}/${turma.vagas} vagas`} />
                    </td>
                    <td className="text-end pe-3 text-nowrap">
                      <Link
                        to={`/instituicao/turmas/${turma.id}/editar`}
                        className="btn botao-icone"
                        title={`Editar ${turma.codigo}`}
                        aria-label={`Editar ${turma.codigo}`}
                      >
                        <i className="bi bi-pencil" aria-hidden="true" />
                      </Link>
                      <button
                        type="button"
                        className="btn botao-icone text-danger"
                        title={`Excluir ${turma.codigo}`}
                        aria-label={`Excluir ${turma.codigo}`}
                        onClick={() => setExcluindo(turma)}
                      >
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

      <ModalConfirmacao
        aberto={Boolean(excluindo)}
        icone="bi-trash"
        titulo={`Excluir ${excluindo?.codigo}?`}
        mensagem={
          excluindo?.alunos.length
            ? `${plural(excluindo.alunos.length, 'aluno será desmatriculado', 'alunos serão desmatriculados')}. Esta ação não pode ser desfeita.`
            : 'A turma ainda não tem alunos. Esta ação não pode ser desfeita.'
        }
        textoConfirmar="Excluir"
        processando={processando}
        aoConfirmar={confirmarExclusao}
        aoCancelar={() => setExcluindo(null)}
      />
    </>
  );
}
