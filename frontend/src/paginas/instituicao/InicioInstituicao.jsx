import { Link } from 'react-router-dom';
import { listar } from '../../api/cliente';
import { SEMESTRE_ATUAL } from '../../constantes';
import { useBuscaDados } from '../../hooks/useBuscaDados';
import { cargaDoProfessor, percentual, pontosDeAtencao } from '../../utilitarios/indicadores';
import AlertaErro from '../../componentes/AlertaErro';
import BarraUso from '../../componentes/BarraUso';
import ConfiguracoesMatricula from './ConfiguracoesMatricula';
import CabecalhoPagina from '../../componentes/CabecalhoPagina';
import CartaoIndicador from '../../componentes/CartaoIndicador';
import EstadoVazio from '../../componentes/EstadoVazio';
import { EsqueletoCartoes, EsqueletoTexto } from '../../componentes/Esqueleto';

// Busca as 4 coleções em paralelo.
async function buscarDadosDoPainel() {
  const [disciplinas, professores, alunos, turmas] = await Promise.all([
    listar('disciplinas'),
    listar('professores'),
    listar('alunos'),
    listar('turmas'),
  ]);
  return { disciplinas, professores, alunos, turmas };
}

export default function InicioInstituicao() {
  const { dados, carregando, erro, recarregar } = useBuscaDados(buscarDadosDoPainel);

  return (
    <>
      <CabecalhoPagina
        titulo="Painel da instituição"
        subtitulo={`Visão geral dos cadastros e da oferta do semestre ${SEMESTRE_ATUAL}.`}
        acoes={
          <Link to="/instituicao/turmas" className="btn btn-primary">
            <i className="bi bi-plus-lg me-2" aria-hidden="true" />
            Ofertar turma
          </Link>
        }
      />

      {carregando && (
        <>
          <EsqueletoCartoes />
          <div className="row g-3 mt-1">
            <div className="col-lg-7">
              <div className="card card-body"><EsqueletoTexto linhas={5} /></div>
            </div>
            <div className="col-lg-5">
              <div className="card card-body"><EsqueletoTexto linhas={5} /></div>
            </div>
          </div>
        </>
      )}
      {erro && <AlertaErro mensagem={erro} aoTentarNovamente={recarregar} />}
      {dados && <ConteudoPainel {...dados} />}
    </>
  );
}

function ConteudoPainel({ disciplinas, professores, alunos, turmas }) {
  const comPreRequisito = disciplinas.filter((d) => d.preRequisitos.length > 0).length;
  const matriculados = new Set(turmas.flatMap((t) => t.alunos)).size;
  const vagasLivres = turmas.reduce((soma, t) => soma + (t.vagas - t.alunos.length), 0);
  const cargas = professores.map((p) => ({ ...p, carga: cargaDoProfessor(p.id, turmas) }));
  const usoMedio = percentual(
    cargas.reduce((soma, p) => soma + p.carga, 0),
    cargas.reduce((soma, p) => soma + p.cargaMaxima, 0),
  );
  const atencao = pontosDeAtencao({ turmas, professores, disciplinas });

  return (
    <>
      <div className="row g-3">
        <div className="col-sm-6 col-xl-3">
          <CartaoIndicador
            icone="bi-journal-bookmark"
            rotulo="Disciplinas"
            valor={disciplinas.length}
            detalhe={`${comPreRequisito} com pré-requisitos`}
            para="/instituicao/disciplinas"
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <CartaoIndicador
            icone="bi-person-badge"
            cor="info"
            rotulo="Professores"
            valor={professores.length}
            detalhe={`${usoMedio}% da carga total em uso`}
            para="/instituicao/professores"
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <CartaoIndicador
            icone="bi-mortarboard"
            cor="success"
            rotulo="Alunos"
            valor={alunos.length}
            detalhe={`${matriculados} matriculados em ${SEMESTRE_ATUAL}`}
            para="/instituicao/alunos"
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <CartaoIndicador
            icone="bi-collection"
            cor="warning"
            rotulo="Turmas ofertadas"
            valor={turmas.length}
            detalhe={`${vagasLivres} vagas livres`}
            para="/instituicao/turmas"
          />
        </div>
      </div>

      <div className="row g-3 mt-1">
        <div className="col-lg-7">
          <div className="card h-100">
            <div className="card-header d-flex align-items-center justify-content-between py-3">
              <h2 className="h6 mb-0">
                <i className="bi bi-bell me-2 text-warning" aria-hidden="true" />
                Precisa de atenção
              </h2>
              {atencao.length > 0 && <span className="badge rounded-pill text-bg-warning">{atencao.length}</span>}
            </div>
            {atencao.length === 0 ? (
              <EstadoVazio compacto icone="bi-check2-circle" cor="success" titulo="Tudo certo por aqui" descricao="Nenhuma turma lotada e nenhum professor no limite." />
            ) : (
              <ul className="list-group list-group-flush">
                {atencao.map((ponto) => (
                  <li key={ponto.titulo + ponto.detalhe} className="list-group-item d-flex align-items-center gap-3 py-3">
                    <span className={`icone-bolha bg-${ponto.nivel}-subtle text-${ponto.nivel}-emphasis`}>
                      <i className={`bi ${ponto.icone}`} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="d-block fw-medium text-truncate">{ponto.titulo}</span>
                      <span className="small text-body-secondary">{ponto.detalhe}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="col-lg-5 d-grid gap-3 align-content-start">
          <ConfiguracoesMatricula />
          <div className="card">
            <div className="card-header py-3">
              <h2 className="h6 mb-0">
                <i className="bi bi-speedometer2 me-2 text-primary" aria-hidden="true" />
                Carga dos professores
              </h2>
            </div>
            <div className="card-body d-grid gap-3">
              {cargas.map((professor) => (
                <BarraUso
                  key={professor.id}
                  rotulo={professor.nome}
                  valor={professor.carga}
                  maximo={professor.cargaMaxima}
                  detalhe={`${professor.carga}/${professor.cargaMaxima} horários`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
