import { Link } from 'react-router-dom';
import { buscar, listar } from '../../api/cliente';
import { SEMESTRE_ATUAL } from '../../constantes';
import { useSessao } from '../../contexto/sessao';
import { useBuscaDados } from '../../hooks/useBuscaDados';
import { percentual, plural } from '../../utilitarios/indicadores';
import AlertaErro from '../../componentes/AlertaErro';
import Avatar from '../../componentes/Avatar';
import ListaHorarios from '../../componentes/ListaHorarios';
import CartaoIndicador from '../../componentes/CartaoIndicador';
import EstadoVazio from '../../componentes/EstadoVazio';
import { EsqueletoCartoes, EsqueletoLista } from '../../componentes/Esqueleto';

const atalhos = [
  { para: '/aluno/turmas', titulo: 'Turmas ofertadas', descricao: 'Encontre turmas e faça sua matrícula', icone: 'bi-search' },
  { para: '/aluno/matriculas', titulo: 'Minhas matrículas', descricao: 'Confira ou cancele matrículas', icone: 'bi-check2-square' },
  { para: '/aluno/grade', titulo: 'Minha grade', descricao: 'Seus horários na semana', icone: 'bi-calendar3' },
];

async function buscarDadosDoAluno(id) {
  const [aluno, turmas, disciplinas, professores] = await Promise.all([
    buscar('alunos', id),
    listar('turmas'),
    listar('disciplinas'),
    listar('professores'),
  ]);
  return { aluno, turmas, disciplinas, professores };
}

export default function InicioAluno() {
  const { sessao } = useSessao();
  const { dados, carregando, erro, recarregar } = useBuscaDados(() => buscarDadosDoAluno(sessao.id), [sessao.id]);

  if (carregando) {
    return (
      <>
        <div className="placeholder-glow mb-4" aria-hidden="true">
          <span className="placeholder col-4 col-md-3 placeholder-lg d-block mb-2" />
          <span className="placeholder col-6 col-md-4" />
        </div>
        <EsqueletoCartoes quantidade={3} />
        <div className="mt-4">
          <EsqueletoLista linhas={2} />
        </div>
      </>
    );
  }
  if (erro) return <AlertaErro mensagem={erro} aoTentarNovamente={recarregar} />;

  const { aluno, turmas, disciplinas, professores } = dados;
  const disciplinaPorId = (id) => disciplinas.find((d) => d.id === id);
  const professorPorId = (id) => professores.find((p) => p.id === id);

  const minhasTurmas = turmas.filter((t) => t.alunos.includes(aluno.id));
  const creditos = minhasTurmas.reduce((soma, t) => soma + (disciplinaPorId(t.disciplinaId)?.creditos ?? 0), 0);
  const progresso = percentual(aluno.aprovadas.length, disciplinas.length);

  return (
    <>
      <div className="d-flex align-items-center gap-3 mb-4">
        <Avatar nome={aluno.nome} tamanho={56} />
        <div>
          <h1 className="h3 mb-1">Olá, {aluno.nome.split(' ')[0]}!</h1>
          <p className="text-body-secondary mb-0">
            {aluno.curso} · <span className="text-nowrap">Matrícula {aluno.matricula}</span>
          </p>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-4">
          <CartaoIndicador
            icone="bi-collection"
            rotulo={`Turmas em ${SEMESTRE_ATUAL}`}
            valor={minhasTurmas.length}
            detalhe={`${plural(minhasTurmas.flatMap((t) => t.horarios).length, 'horário')} por semana`}
          />
        </div>
        <div className="col-md-4">
          <CartaoIndicador icone="bi-award" cor="info" rotulo="Créditos no semestre" valor={creditos} detalhe="Soma das disciplinas matriculadas" />
        </div>
        <div className="col-md-4">
          <CartaoIndicador
            icone="bi-graph-up-arrow"
            cor="success"
            rotulo="Progresso no curso"
            valor={`${progresso}%`}
            detalhe={`${aluno.aprovadas.length} de ${disciplinas.length} disciplinas aprovadas`}
          >
            <div className="progress mt-2" role="progressbar" aria-label="Progresso no curso" aria-valuenow={progresso} aria-valuemin="0" aria-valuemax="100">
              <div className="progress-bar bg-success" style={{ width: `${progresso}%` }} />
            </div>
          </CartaoIndicador>
        </div>
      </div>

      <div className="row g-3 mt-1">
        <div className="col-lg-8">
          <div className="card h-100">
            <div className="card-header py-3 d-flex justify-content-between align-items-center">
              <h2 className="h6 mb-0">Suas turmas em {SEMESTRE_ATUAL}</h2>
              {minhasTurmas.length > 0 && (
                <Link to="/aluno/grade" className="small text-decoration-none">
                  Ver grade <i className="bi bi-arrow-right" aria-hidden="true" />
                </Link>
              )}
            </div>
            {minhasTurmas.length === 0 ? (
              <EstadoVazio
                compacto
                icone="bi-calendar-plus"
                titulo="Você ainda não está matriculado"
                descricao="Veja as turmas ofertadas neste semestre e escolha as suas."
                acao={
                  <Link to="/aluno/turmas" className="btn btn-primary btn-sm">
                    Ver turmas ofertadas
                  </Link>
                }
              />
            ) : (
              <ul className="list-group list-group-flush">
                {minhasTurmas.map((turma) => {
                  const disciplina = disciplinaPorId(turma.disciplinaId);
                  return (
                    <li key={turma.id} className="list-group-item py-3">
                      <div className="d-flex flex-wrap justify-content-between gap-2">
                        <div>
                          <span className="fw-medium">{disciplina?.nome}</span>
                          <span className="d-block small text-body-secondary">
                            {disciplina?.codigo} · Prof. {professorPorId(turma.professorId)?.nome}
                          </span>
                        </div>
                        <ListaHorarios horarios={turma.horarios} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-header py-3">
              <h2 className="h6 mb-0">Ações rápidas</h2>
            </div>
            <div className="list-group list-group-flush">
              {atalhos.map((atalho) => (
                <Link key={atalho.para} to={atalho.para} className="list-group-item list-group-item-action d-flex align-items-center gap-3 py-3">
                  <span className="icone-bolha bg-primary-subtle text-primary-emphasis">
                    <i className={`bi ${atalho.icone}`} aria-hidden="true" />
                  </span>
                  <span className="flex-grow-1">
                    <span className="d-block fw-medium">{atalho.titulo}</span>
                    <span className="small text-body-secondary">{atalho.descricao}</span>
                  </span>
                  <i className="bi bi-chevron-right text-body-secondary" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
