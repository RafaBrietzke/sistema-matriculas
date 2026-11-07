import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { atualizar, criar, listar } from '../../api/cliente';
import { useNotificacao } from '../../contexto/notificacao';
import { useBuscaDados } from '../../hooks/useBuscaDados';
import { cargaDoProfessor, percentual, plural } from '../../utilitarios/indicadores';
import AlertaErro from '../../componentes/AlertaErro';
import BarraUso from '../../componentes/BarraUso';
import CabecalhoPagina from '../../componentes/CabecalhoPagina';
import EstadoVazio from '../../componentes/EstadoVazio';
import { EsqueletoTexto } from '../../componentes/Esqueleto';
import ListaHorarios from '../../componentes/ListaHorarios';
import SeletorHorarios from '../../componentes/SeletorHorarios';

async function buscarDados() {
  const [turmas, disciplinas, professores] = await Promise.all([
    listar('turmas'),
    listar('disciplinas'),
    listar('professores'),
  ]);
  return { turmas, disciplinas, professores };
}

export default function FormularioTurma() {
  const { id } = useParams();
  const { dados, carregando, erro, recarregar } = useBuscaDados(buscarDados);
  const titulo = id ? 'Editar turma' : 'Nova turma';

  if (carregando) {
    return (
      <>
        <CabecalhoPagina titulo={titulo} />
        <div className="card card-body">
          <EsqueletoTexto linhas={6} />
        </div>
      </>
    );
  }
  if (erro) return <AlertaErro mensagem={erro} aoTentarNovamente={recarregar} />;

  const turma = id ? dados.turmas.find((t) => t.id === Number(id)) : null;
  if (id && !turma) {
    return (
      <div className="card">
        <EstadoVazio
          icone="bi-question-circle"
          cor="danger"
          titulo="Turma não encontrada"
          descricao="Ela pode ter sido excluída."
          acao={<Link to="/instituicao/turmas" className="btn btn-primary">Voltar para a oferta</Link>}
        />
      </div>
    );
  }

  return <Formulario key={id ?? 'nova'} titulo={titulo} turma={turma} {...dados} />;
}

function Formulario({ titulo, turma, turmas, disciplinas, professores }) {
  const navegar = useNavigate();
  const { notificar } = useNotificacao();
  const [parametros] = useSearchParams();
  const horarioSugerido = parametros.get('horario');
  const professorSugerido = professores.find((p) => p.id === Number(parametros.get('professor')));
  const [form, setForm] = useState({
    disciplinaId: turma ? String(turma.disciplinaId) : '',
    professorId: turma ? String(turma.professorId) : professorSugerido ? String(professorSugerido.id) : '',
    vagas: turma ? String(turma.vagas) : '30',
    horarios: turma ? [...turma.horarios] : /^[2-7][1-3]$/.test(horarioSugerido ?? '') ? [horarioSugerido] : [],
  });
  const [tentouSalvar, setTentouSalvar] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroServidor, setErroServidor] = useState('');

  const matriculados = turma?.alunos.length ?? 0;
  const protegida = matriculados > 0;
  const outrasTurmas = turmas.filter((t) => t.id !== turma?.id);

  const comCarga = professores
    .map((p) => {
      const carga = cargaDoProfessor(p.id, outrasTurmas);
      return { ...p, carga, uso: percentual(carga, p.cargaMaxima) };
    })
    .sort((a, b) => a.uso - b.uso || a.nome.localeCompare(b.nome));
  const usoMedio = comCarga.reduce((soma, p) => soma + p.uso, 0) / (comCarga.length || 1);

  const professor = comCarga.find((p) => p.id === Number(form.professorId));
  const disciplina = disciplinas.find((d) => d.id === Number(form.disciplinaId));

  const ocupados = Object.fromEntries(
    outrasTurmas
      .filter((t) => t.professorId === professor?.id)
      .flatMap((t) => t.horarios.map((h) => [h, `${professor.nome.split(' ')[0]} já leciona ${t.codigo}`])),
  );
  const horariosEmChoque = form.horarios.filter((h) => ocupados[h]);
  const cargaProjetada = (professor?.carga ?? 0) + form.horarios.length;
  const excedeCarga = professor && cargaProjetada > professor.cargaMaxima;
  const usoProjetado = professor ? percentual(cargaProjetada, professor.cargaMaxima) : 0;
  const sugestao = comCarga.find(
    (p) =>
      p.id !== professor?.id &&
      p.carga + form.horarios.length <= p.cargaMaxima &&
      !outrasTurmas.some((t) => t.professorId === p.id && t.horarios.some((h) => form.horarios.includes(h))),
  );
  const usoSugestao = sugestao ? percentual(sugestao.carga + form.horarios.length, sugestao.cargaMaxima) : 0;
  const acimaDaMedia =
    professor && form.horarios.length > 0 && !excedeCarga && usoProjetado > usoMedio && sugestao && usoSugestao < usoProjetado;
  const textoSugestao = sugestao && (
    <>
      {' '}Sugestão: <strong>{sugestao.nome}</strong> ({sugestao.carga}/{sugestao.cargaMaxima} horários).
    </>
  );

  const vagas = Number(form.vagas);
  const erros = {
    disciplinaId: !form.disciplinaId && 'Selecione a disciplina',
    professorId: !form.professorId && 'Selecione o professor',
    vagas:
      (!Number.isInteger(vagas) || vagas < 1 || vagas > 200)
        ? 'Informe um número inteiro entre 1 e 200'
        : vagas < matriculados && `A turma já tem ${matriculados} alunos matriculados`,
    horarios: form.horarios.length === 0 && 'Escolha pelo menos um horário',
  };
  const formularioValido = !Object.values(erros).some(Boolean) && !excedeCarga && horariosEmChoque.length === 0;

  function alterar(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
    setErroServidor('');
  }

  async function salvar(evento) {
    evento.preventDefault();
    setTentouSalvar(true);
    if (!formularioValido) return;

    setSalvando(true);
    const payload = {
      disciplinaId: Number(form.disciplinaId),
      professorId: Number(form.professorId),
      horarios: form.horarios,
      vagas,
    };
    try {
      const salva = turma ? await atualizar('turmas', turma.id, payload) : await criar('turmas', payload);
      notificar({ tipo: 'sucesso', titulo: `Turma ${salva.codigo} ${turma ? 'atualizada' : 'ofertada'}` });
      navegar('/instituicao/turmas');
    } catch (e) {
      setErroServidor(e.message);
      setSalvando(false);
    }
  }

  const classeCampo = (campo) => `${tentouSalvar && erros[campo] ? 'is-invalid' : ''}`;

  return (
    <>
      <CabecalhoPagina
        titulo={turma ? `${titulo} ${turma.codigo}` : titulo}
        subtitulo={turma ? 'Altere os dados da turma ofertada.' : 'Escolha a disciplina, o professor e os horários da nova turma.'}
      />

      <form className="row g-3" onSubmit={salvar} noValidate>
        <div className="col-lg-8">
          <div className="card">
            <div className="card-body p-4 d-grid gap-4">
              {protegida && (
                <div className="alert alert-info d-flex gap-2 mb-0">
                  <i className="bi bi-lock" aria-hidden="true" />
                  <span>
                    Esta turma tem {plural(matriculados, 'aluno matriculado', 'alunos matriculados')}: a disciplina e os
                    horários não podem ser alterados. Você ainda pode trocar o professor e ajustar as vagas.
                  </span>
                </div>
              )}

              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="disciplina" className="form-label fw-medium">Disciplina</label>
                  <select
                    id="disciplina"
                    className={`form-select ${classeCampo('disciplinaId')}`}
                    value={form.disciplinaId}
                    disabled={protegida}
                    onChange={(e) => alterar('disciplinaId', e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {disciplinas.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.codigo} — {d.nome}
                      </option>
                    ))}
                  </select>
                  <div className="invalid-feedback">{erros.disciplinaId}</div>
                </div>

                <div className="col-md-6">
                  <label htmlFor="professor" className="form-label fw-medium">Professor</label>
                  <select
                    id="professor"
                    className={`form-select ${classeCampo('professorId')}`}
                    value={form.professorId}
                    onChange={(e) => alterar('professorId', e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {comCarga.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} — {p.carga}/{p.cargaMaxima} horários
                      </option>
                    ))}
                  </select>
                  <div className="form-text">Ordenados da menor para a maior carga.</div>
                  <div className="invalid-feedback">{erros.professorId}</div>
                </div>

                <div className="col-md-4">
                  <label htmlFor="vagas" className="form-label fw-medium">Vagas</label>
                  <input
                    id="vagas"
                    type="number"
                    min={Math.max(1, matriculados)}
                    max="200"
                    className={`form-control ${classeCampo('vagas')}`}
                    value={form.vagas}
                    onChange={(e) => alterar('vagas', e.target.value)}
                  />
                  <div className="invalid-feedback">{erros.vagas}</div>
                </div>
              </div>

              <div>
                <p className="form-label fw-medium mb-1">Horários</p>
                <p className="small text-body-secondary mb-2">
                  {professor
                    ? 'Clique nos horários da turma. Os horários em que o professor já dá aula estão bloqueados.'
                    : 'Selecione um professor para ver os horários em que ele já dá aula.'}
                </p>
                <SeletorHorarios
                  selecionados={form.horarios}
                  aoAlterar={(horarios) => alterar('horarios', horarios)}
                  ocupados={ocupados}
                  desabilitado={protegida}
                />
                {tentouSalvar && erros.horarios && <div className="text-danger small mt-2">{erros.horarios}</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card position-sticky" style={{ top: 88 }}>
            <div className="card-header py-3">
              <h2 className="h6 mb-0">Resumo</h2>
            </div>
            <div className="card-body d-grid gap-3">
              <div>
                <p className="texto-pequeno text-body-secondary mb-1">Disciplina</p>
                <p className="fw-medium mb-0">{disciplina ? `${disciplina.nome} (${disciplina.creditos} créditos)` : '—'}</p>
              </div>
              <div>
                <p className="texto-pequeno text-body-secondary mb-1">Horários</p>
                {form.horarios.length ? <ListaHorarios horarios={form.horarios} /> : <p className="mb-0">—</p>}
              </div>

              {professor && (
                <BarraUso
                  rotulo={`Carga de ${professor.nome}`}
                  valor={cargaProjetada}
                  maximo={professor.cargaMaxima}
                  detalhe={`${cargaProjetada}/${professor.cargaMaxima} horários`}
                />
              )}

              {excedeCarga && (
                <div className="alert alert-danger small mb-0">
                  <i className="bi bi-x-circle me-1" aria-hidden="true" />
                  {professor.nome} passaria da carga máxima ({cargaProjetada} de {professor.cargaMaxima} horários).
                  {textoSugestao}
                </div>
              )}
              {horariosEmChoque.length > 0 && (
                <div className="alert alert-danger small mb-0">
                  <i className="bi bi-x-circle me-1" aria-hidden="true" />
                  {professor.nome} já dá aula em {horariosEmChoque.length === 1 ? 'um dos horários' : 'alguns dos horários'} escolhidos.
                  {textoSugestao}
                </div>
              )}
              {acimaDaMedia && (
                <div className="alert alert-warning small mb-0">
                  <i className="bi bi-exclamation-triangle me-1" aria-hidden="true" />
                  {professor.nome} ficará com {usoProjetado}% da carga, acima da média ({Math.round(usoMedio)}%).
                  {textoSugestao}
                </div>
              )}
              {erroServidor && (
                <div className="alert alert-danger small mb-0" role="alert">
                  <i className="bi bi-exclamation-octagon me-1" aria-hidden="true" />
                  {erroServidor}
                </div>
              )}

              <div className="d-flex gap-2">
                <Link to="/instituicao/turmas" className="btn btn-neutro flex-fill">
                  Cancelar
                </Link>
                <button type="submit" className="btn btn-primary flex-fill" disabled={salvando || excedeCarga || horariosEmChoque.length > 0 || (tentouSalvar && !formularioValido)}>
                  {salvando && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
                  {turma ? 'Salvar' : 'Ofertar turma'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
