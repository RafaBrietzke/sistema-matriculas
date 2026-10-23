import { useState } from 'react';
import { Link } from 'react-router-dom';
import { buscarOfertasDoAluno, enviar } from '../../api/cliente';
import { useNotificacao } from '../../contexto/notificacao';
import { useSessao } from '../../contexto/sessao';
import { useBuscaDados } from '../../hooks/useBuscaDados';
import { DIAS, TURNOS, descreverHorario } from '../../utilitarios/horarios';
import { plural } from '../../utilitarios/indicadores';
import AlertaErro from '../../componentes/AlertaErro';
import BarraUso from '../../componentes/BarraUso';
import CabecalhoPagina from '../../componentes/CabecalhoPagina';
import EstadoVazio from '../../componentes/EstadoVazio';
import { EsqueletoCartoes } from '../../componentes/Esqueleto';
import ListaHorarios from '../../componentes/ListaHorarios';
import ModalConfirmacao from '../../componentes/ModalConfirmacao';

export default function TurmasOfertadas() {
  const { sessao } = useSessao();
  const { notificar } = useNotificacao();
  const { dados, carregando, erro, recarregar } = useBuscaDados(() => buscarOfertasDoAluno(sessao.id), [sessao.id]);
  const [busca, setBusca] = useState('');
  const [dia, setDia] = useState('');
  const [turno, setTurno] = useState('');
  const [soDisponiveis, setSoDisponiveis] = useState(false);
  const [escolhida, setEscolhida] = useState(null);
  const [processando, setProcessando] = useState(false);

  async function confirmarMatricula() {
    setProcessando(true);
    try {
      await enviar(`/turmas/${escolhida.id}/matriculas`, { alunoId: sessao.id });
      notificar({ tipo: 'sucesso', titulo: 'Matrícula confirmada', mensagem: `Você está matriculado em ${escolhida.codigo}.` });
    } catch (e) {
      notificar({ tipo: 'erro', titulo: 'Não foi possível matricular', mensagem: e.message });
    } finally {
      setProcessando(false);
      setEscolhida(null);
      recarregar();
    }
  }

  if (carregando && !dados) {
    return (
      <>
        <CabecalhoPagina titulo="Turmas ofertadas" />
        <EsqueletoCartoes quantidade={6} />
      </>
    );
  }
  if (erro) return <AlertaErro mensagem={erro} aoTentarNovamente={recarregar} />;

  const { configuracoes, creditosMatriculados, ofertas } = dados;
  const termo = busca.trim().toLowerCase();
  const filtradas = ofertas
    .filter(
      (o) =>
        `${o.codigo} ${o.disciplina.nome} ${o.professor.nome}`.toLowerCase().includes(termo) &&
        (!dia || o.horarios.some((h) => h[0] === dia)) &&
        (!turno || o.horarios.some((h) => h[1] === turno)) &&
        (!soDisponiveis || (!o.matriculado && o.bloqueios.length === 0)),
    )
    .sort((a, b) => a.codigo.localeCompare(b.codigo));
  const disponiveis = ofertas.filter((o) => !o.matriculado && o.bloqueios.length === 0).length;

  return (
    <>
      <CabecalhoPagina
        titulo="Turmas ofertadas"
        subtitulo={`Semestre ${configuracoes.semestreAtual} · ${plural(disponiveis, 'turma disponível', 'turmas disponíveis')} para você`}
        acoes={
          <Link to="/aluno/matriculas" className="btn btn-neutro">
            <i className="bi bi-check2-square me-2" aria-hidden="true" />
            Minhas matrículas
          </Link>
        }
      />

      {!configuracoes.periodoMatriculaAberto && (
        <div className="alert alert-warning d-flex gap-2">
          <i className="bi bi-lock" aria-hidden="true" />
          <span>
            <strong>O período de matrícula está fechado.</strong> Você pode consultar a oferta, mas não pode se matricular
            nem cancelar matrículas.
          </span>
        </div>
      )}

      <div className="card mb-3">
        <div className="card-body row g-3 align-items-center">
          <div className="col-lg-4">
            <BarraUso
              rotulo="Créditos no semestre"
              valor={creditosMatriculados}
              maximo={configuracoes.limiteCreditos}
              detalhe={`${creditosMatriculados} de ${configuracoes.limiteCreditos}`}
            />
          </div>
          <div className="col-lg-8 row g-2 m-0">
            <div className="col-md-5">
              <input
                type="search"
                className="form-control"
                placeholder="Buscar turma ou professor"
                aria-label="Buscar turma"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <div className="col-6 col-md-2">
              <select className="form-select" aria-label="Filtrar por dia" value={dia} onChange={(e) => setDia(e.target.value)}>
                <option value="">Dia</option>
                {Object.entries(DIAS).map(([codigo, nome]) => (
                  <option key={codigo} value={codigo}>{nome}</option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-2">
              <select className="form-select" aria-label="Filtrar por turno" value={turno} onChange={(e) => setTurno(e.target.value)}>
                <option value="">Turno</option>
                {Object.entries(TURNOS).map(([codigo, nome]) => (
                  <option key={codigo} value={codigo}>{nome}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3 d-flex align-items-center">
              <div className="form-check form-switch mb-0">
                <input
                  id="so-disponiveis"
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  checked={soDisponiveis}
                  onChange={(e) => setSoDisponiveis(e.target.checked)}
                />
                <label className="form-check-label small" htmlFor="so-disponiveis">Só disponíveis</label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {filtradas.length === 0 ? (
        <div className="card">
          <EstadoVazio icone="bi-search" titulo="Nenhuma turma encontrada" descricao="Ajuste a busca ou os filtros." />
        </div>
      ) : (
        <div className="row g-3">
          {filtradas.map((oferta) => (
            <div className="col-md-6 col-xxl-4" key={oferta.id}>
              <CartaoOferta oferta={oferta} aoMatricular={() => setEscolhida(oferta)} />
            </div>
          ))}
        </div>
      )}

      <ModalConfirmacao
        aberto={Boolean(escolhida)}
        icone="bi-journal-plus"
        variante="primary"
        titulo={`Matricular em ${escolhida?.codigo}?`}
        mensagem={
          escolhida &&
          `${escolhida.disciplina.nome} com ${escolhida.professor.nome}, ` +
            `${escolhida.horarios.map((h) => descreverHorario(h, true)).join(' e ')}. ` +
            `Seus créditos passarão de ${creditosMatriculados} para ${creditosMatriculados + escolhida.disciplina.creditos} ` +
            `(limite ${configuracoes.limiteCreditos}).`
        }
        textoConfirmar="Confirmar matrícula"
        processando={processando}
        aoConfirmar={confirmarMatricula}
        aoCancelar={() => setEscolhida(null)}
      />
    </>
  );
}

function CartaoOferta({ oferta, aoMatricular }) {
  const restantes = oferta.vagas - oferta.matriculados;
  const disponivel = !oferta.matriculado && oferta.bloqueios.length === 0;

  let status = { texto: 'Indisponível', classe: 'text-bg-secondary', icone: 'bi-slash-circle' };
  if (oferta.matriculado) status = { texto: 'Matriculado', classe: 'text-bg-success', icone: 'bi-check-circle' };
  else if (disponivel) status = { texto: 'Disponível', classe: 'text-bg-primary', icone: 'bi-circle' };

  return (
    <div className={`card h-100 ${oferta.matriculado ? 'border-success-subtle' : ''}`}>
      <div className="card-body d-flex flex-column gap-3">
        <div className="d-flex justify-content-between align-items-start gap-2">
          <div className="min-w-0">
            <span className="texto-pequeno fw-semibold text-body-secondary">{oferta.codigo}</span>
            <h2 className="h6 mb-0">{oferta.disciplina.nome}</h2>
          </div>
          <span className={`badge rounded-pill ${status.classe}`}>
            <i className={`bi ${status.icone} me-1`} aria-hidden="true" />
            {status.texto}
          </span>
        </div>

        <p className="small text-body-secondary mb-0">
          <i className="bi bi-person me-1" aria-hidden="true" />
          {oferta.professor.nome} · {oferta.disciplina.creditos} créditos
        </p>

        <ListaHorarios horarios={oferta.horarios} />

        <BarraUso
          valor={oferta.matriculados}
          maximo={oferta.vagas}
          detalhe={restantes > 0 ? plural(restantes, 'vaga restante', 'vagas restantes') : 'Sem vagas'}
        />

        {oferta.bloqueios.length > 0 && (
          <ul className="list-unstyled small mb-0 d-grid gap-1">
            {oferta.bloqueios.map((bloqueio) => (
              <li key={bloqueio.tipo + bloqueio.mensagem} className="text-danger-emphasis">
                <i className="bi bi-x-circle me-1" aria-hidden="true" />
                {bloqueio.mensagem}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto">
          {oferta.matriculado ? (
            <Link to="/aluno/matriculas" className="btn btn-sm btn-neutro w-100">
              Ver minhas matrículas
            </Link>
          ) : disponivel ? (
            <button type="button" className="btn btn-sm btn-primary w-100" onClick={aoMatricular}>
              <i className="bi bi-plus-lg me-1" aria-hidden="true" />
              Matricular
            </button>
          ) : (
            <button type="button" className="btn btn-sm btn-neutro w-100" disabled>
              <i className="bi bi-lock me-1" aria-hidden="true" />
              Indisponível
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
