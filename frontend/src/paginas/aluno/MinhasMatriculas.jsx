import { useState } from 'react';
import { Link } from 'react-router-dom';
import { buscarOfertasDoAluno, remover } from '../../api/cliente';
import { useNotificacao } from '../../contexto/notificacao';
import { useSessao } from '../../contexto/sessao';
import { useBuscaDados } from '../../hooks/useBuscaDados';
import { plural } from '../../utilitarios/indicadores';
import AlertaErro from '../../componentes/AlertaErro';
import BarraUso from '../../componentes/BarraUso';
import CabecalhoPagina from '../../componentes/CabecalhoPagina';
import EstadoVazio from '../../componentes/EstadoVazio';
import { EsqueletoLista } from '../../componentes/Esqueleto';
import ListaHorarios from '../../componentes/ListaHorarios';
import ModalConfirmacao from '../../componentes/ModalConfirmacao';

export default function MinhasMatriculas() {
  const { sessao } = useSessao();
  const { notificar } = useNotificacao();
  const { dados, carregando, erro, recarregar } = useBuscaDados(() => buscarOfertasDoAluno(sessao.id), [sessao.id]);
  const [cancelando, setCancelando] = useState(null);
  const [processando, setProcessando] = useState(false);

  async function confirmarCancelamento() {
    setProcessando(true);
    try {
      await remover(`/turmas/${cancelando.id}/matriculas/${sessao.id}`);
      notificar({ tipo: 'sucesso', titulo: 'Matrícula cancelada', mensagem: `Você saiu da turma ${cancelando.codigo}.` });
    } catch (e) {
      notificar({ tipo: 'erro', titulo: 'Não foi possível cancelar', mensagem: e.message });
    } finally {
      setProcessando(false);
      setCancelando(null);
      recarregar();
    }
  }

  if (carregando && !dados) {
    return (
      <>
        <CabecalhoPagina titulo="Minhas matrículas" />
        <EsqueletoLista linhas={3} />
      </>
    );
  }
  if (erro) return <AlertaErro mensagem={erro} aoTentarNovamente={recarregar} />;

  const { configuracoes, creditosMatriculados, ofertas } = dados;
  const matriculas = ofertas.filter((o) => o.matriculado).sort((a, b) => a.codigo.localeCompare(b.codigo));
  const periodoAberto = configuracoes.periodoMatriculaAberto;

  return (
    <>
      <CabecalhoPagina
        titulo="Minhas matrículas"
        subtitulo={`Semestre ${configuracoes.semestreAtual} · ${plural(matriculas.length, 'turma', 'turmas')}`}
        acoes={
          <Link to="/aluno/turmas" className="btn btn-primary">
            <i className="bi bi-plus-lg me-2" aria-hidden="true" />
            Adicionar turma
          </Link>
        }
      />

      {!periodoAberto && (
        <div className="alert alert-warning d-flex gap-2">
          <i className="bi bi-lock" aria-hidden="true" />
          <span>O período de matrícula está fechado. Não é possível cancelar matrículas agora.</span>
        </div>
      )}

      {matriculas.length === 0 ? (
        <div className="card">
          <EstadoVazio
            icone="bi-calendar-plus"
            titulo="Você ainda não está matriculado"
            descricao="Veja as turmas ofertadas neste semestre e escolha as suas."
            acao={<Link to="/aluno/turmas" className="btn btn-primary">Ver turmas ofertadas</Link>}
          />
        </div>
      ) : (
        <div className="row g-3">
          <div className="col-lg-8">
            <div className="card">
              <ul className="list-group list-group-flush">
                {matriculas.map((turma) => (
                  <li key={turma.id} className="list-group-item py-3 d-flex flex-wrap align-items-center gap-3">
                    <div className="flex-grow-1 min-w-0">
                      <span className="texto-pequeno fw-semibold text-body-secondary">{turma.codigo}</span>
                      <p className="fw-medium mb-1">{turma.disciplina.nome}</p>
                      <p className="small text-body-secondary mb-2">
                        Prof. {turma.professor.nome} · {turma.disciplina.creditos} créditos
                      </p>
                      <ListaHorarios horarios={turma.horarios} />
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      disabled={!periodoAberto}
                      onClick={() => setCancelando(turma)}
                    >
                      <i className="bi bi-x-lg me-1" aria-hidden="true" />
                      Cancelar matrícula
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card">
              <div className="card-body d-grid gap-3">
                <h2 className="h6 mb-0">Resumo do semestre</h2>
                <BarraUso
                  rotulo="Créditos"
                  valor={creditosMatriculados}
                  maximo={configuracoes.limiteCreditos}
                  detalhe={`${creditosMatriculados} de ${configuracoes.limiteCreditos}`}
                />
                <p className="small text-body-secondary mb-0">
                  {plural(matriculas.flatMap((t) => t.horarios).length, 'horário', 'horários')} por semana.
                </p>
                <Link to="/aluno/grade" className="btn btn-sm btn-neutro">
                  <i className="bi bi-calendar3 me-2" aria-hidden="true" />
                  Ver minha grade
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <ModalConfirmacao
        aberto={Boolean(cancelando)}
        icone="bi-x-circle"
        titulo={`Cancelar matrícula em ${cancelando?.codigo}?`}
        mensagem={cancelando && `Você sairá da turma de ${cancelando.disciplina.nome}. A vaga poderá ser ocupada por outro aluno.`}
        textoConfirmar="Cancelar matrícula"
        textoCancelar="Voltar"
        processando={processando}
        aoConfirmar={confirmarCancelamento}
        aoCancelar={() => setCancelando(null)}
      />
    </>
  );
}
