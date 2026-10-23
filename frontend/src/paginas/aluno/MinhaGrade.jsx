import { useState } from 'react';
import { Link } from 'react-router-dom';
import { buscar, buscarOfertasDoAluno } from '../../api/cliente';
import { useSessao } from '../../contexto/sessao';
import { useBuscaDados } from '../../hooks/useBuscaDados';
import { corDaDisciplina } from '../../utilitarios/cores';
import { descreverHorario } from '../../utilitarios/horarios';
import { plural } from '../../utilitarios/indicadores';
import AlertaErro from '../../componentes/AlertaErro';
import CabecalhoPagina from '../../componentes/CabecalhoPagina';
import EstadoVazio from '../../componentes/EstadoVazio';
import { EsqueletoTexto } from '../../componentes/Esqueleto';
import GradeHoraria from '../../componentes/GradeHoraria';

async function buscarDados(alunoId) {
  const [aluno, resultado] = await Promise.all([buscar('alunos', alunoId), buscarOfertasDoAluno(alunoId)]);
  return { aluno, ...resultado };
}

// A impressão sempre usa o tema claro; window.print() bloqueia até a janela fechar.
function imprimirComprovante() {
  const html = document.documentElement;
  const temaAtual = html.getAttribute('data-bs-theme');
  html.setAttribute('data-bs-theme', 'light');
  window.print();
  html.setAttribute('data-bs-theme', temaAtual);
}

export default function MinhaGrade() {
  const { sessao } = useSessao();
  const { dados, carregando, erro, recarregar } = useBuscaDados(() => buscarDados(sessao.id), [sessao.id]);
  const [emitidoEm] = useState(() => new Date().toLocaleString('pt-BR'));

  if (carregando && !dados) {
    return (
      <>
        <CabecalhoPagina titulo="Minha grade" />
        <div className="card card-body">
          <EsqueletoTexto linhas={6} />
        </div>
      </>
    );
  }
  if (erro) return <AlertaErro mensagem={erro} aoTentarNovamente={recarregar} />;

  const { aluno, configuracoes, creditosMatriculados, ofertas } = dados;
  const matriculadas = ofertas.filter((o) => o.matriculado).sort((a, b) => a.horarios[0].localeCompare(b.horarios[0]));
  const eventos = matriculadas.map((o) => ({
    id: o.id,
    horarios: o.horarios,
    titulo: o.codigo,
    subtitulo: o.disciplina.nome,
    detalhe: o.professor.nome,
    cor: corDaDisciplina(o.disciplina.id),
  }));

  return (
    <>
      <div className="so-impressao mb-4">
        <div className="d-flex justify-content-between align-items-end border-bottom pb-3">
          <div>
            <p className="fs-4 fw-bold mb-0">
              <i className="bi bi-mortarboard-fill me-2" aria-hidden="true" />
              MatrículaWeb
            </p>
            <p className="mb-0">Comprovante de matrícula · Semestre {configuracoes.semestreAtual}</p>
          </div>
          <p className="small mb-0">Emitido em {emitidoEm}</p>
        </div>
        <div className="d-flex flex-wrap gap-4 mt-3">
          <span>Aluno: <strong>{aluno.nome}</strong></span>
          <span>Matrícula: <strong>{aluno.matricula}</strong></span>
          <span>Curso: <strong>{aluno.curso}</strong></span>
        </div>
      </div>

      <div className="nao-imprimir">
        <CabecalhoPagina
          titulo="Minha grade"
          subtitulo={`Semestre ${configuracoes.semestreAtual} · ${plural(matriculadas.length, 'turma', 'turmas')} · ${creditosMatriculados} créditos`}
          acoes={
            matriculadas.length > 0 && (
              <button type="button" className="btn btn-primary" onClick={imprimirComprovante}>
                <i className="bi bi-printer me-2" aria-hidden="true" />
                Imprimir comprovante
              </button>
            )
          }
        />
      </div>

      {matriculadas.length === 0 ? (
        <div className="card">
          <EstadoVazio
            icone="bi-calendar-week"
            titulo="Sua grade está vazia"
            descricao="Matricule-se em turmas para ver seus horários da semana aqui."
            acao={<Link to="/aluno/turmas" className="btn btn-primary">Ver turmas ofertadas</Link>}
          />
        </div>
      ) : (
        <>
          <div className="card mb-3">
            <div className="card-body">
              <GradeHoraria eventos={eventos} />
            </div>
          </div>

          <div className="card">
            <div className="card-header py-3">
              <h2 className="h6 mb-0">Turmas matriculadas</h2>
            </div>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr className="texto-pequeno text-body-secondary">
                    <th scope="col" className="ps-3">Turma</th>
                    <th scope="col">Disciplina</th>
                    <th scope="col" className="d-none d-md-table-cell">Professor</th>
                    <th scope="col" className="d-none d-md-table-cell">Horários</th>
                    <th scope="col" className="text-end pe-3">Créditos</th>
                  </tr>
                </thead>
                <tbody>
                  {matriculadas.map((o) => (
                    <tr key={o.id}>
                      <td className="ps-3 fw-semibold text-nowrap">
                        <span className="legenda-horario" style={{ backgroundColor: corDaDisciplina(o.disciplina.id) }} />
                        {o.codigo}
                      </td>
                      <td>{o.disciplina.nome}</td>
                      <td className="text-nowrap d-none d-md-table-cell">{o.professor.nome}</td>
                      <td className="small d-none d-md-table-cell">{o.horarios.map((h) => descreverHorario(h)).join(', ')}</td>
                      <td className="text-end pe-3">{o.disciplina.creditos}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row" colSpan={4} className="text-end d-none d-md-table-cell">Total</th>
                    <th scope="row" colSpan={2} className="text-end d-md-none">Total</th>
                    <th className="text-end pe-3">
                      {creditosMatriculados} de {configuracoes.limiteCreditos}
                    </th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <p className="so-impressao small mt-4 mb-0">Documento gerado pelo MatrículaWeb · ambiente de demonstração.</p>
        </>
      )}
    </>
  );
}
