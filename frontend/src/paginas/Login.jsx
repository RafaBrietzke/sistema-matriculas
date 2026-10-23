import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { listar } from '../api/cliente';
import { SEMESTRE_ATUAL } from '../constantes';
import { useNotificacao } from '../contexto/notificacao';
import { rotaInicial, useSessao } from '../contexto/sessao';
import { useBuscaDados } from '../hooks/useBuscaDados';
import AlertaErro from '../componentes/AlertaErro';
import Avatar from '../componentes/Avatar';
import BotaoTema from '../componentes/BotaoTema';
import EstadoVazio from '../componentes/EstadoVazio';
import FormNovaMatricula from '../componentes/FormNovaMatricula';
import { EsqueletoLista } from '../componentes/Esqueleto';

const beneficios = [
  'Oferta de turmas com controle de carga dos professores',
  'Validação automática de pré-requisitos e vagas',
  'Grade horária visual, sem choque de horários',
];

export default function Login() {
  const { sessao, entrar } = useSessao();
  const { notificar } = useNotificacao();
  const [aba, setAba] = useState('aluno');
  const [busca, setBusca] = useState('');
  const [cadastrando, setCadastrando] = useState(false);
  const { dados: alunos, carregando, erro, recarregar } = useBuscaDados(() => listar('alunos'));

  if (sessao) {
    return <Navigate to={rotaInicial(sessao.perfil)} replace />;
  }

  function entrarComo(novaSessao) {
    entrar(novaSessao);
    notificar({ tipo: 'sucesso', titulo: `Bem-vindo(a), ${novaSessao.nome.split(' ')[0]}!`, mensagem: 'Sessão iniciada.' });
  }

  const termo = busca.trim().toLowerCase();
  const alunosFiltrados = (alunos ?? []).filter(
    (aluno) => aluno.nome.toLowerCase().includes(termo) || aluno.matricula.includes(termo),
  );

  return (
    <div className="login">
      <section className="login-marca d-none d-lg-flex flex-column">
        <div className="app-marca">
          <span className="app-marca-icone">
            <i className="bi bi-mortarboard-fill" aria-hidden="true" />
          </span>
          MatrículaWeb
        </div>

        <div className="my-auto py-5">
          <span className="badge rounded-pill text-bg-light bg-opacity-10 mb-3">Semestre {SEMESTRE_ATUAL}</span>
          <h2 className="fw-bold mb-3">Matrículas organizadas, sem choque de horário.</h2>
          <p className="fs-5 mb-4 opacity-75">
            A instituição monta a oferta de turmas e os alunos se matriculam com todas as regras verificadas na hora.
          </p>
          <ul className="list-unstyled d-grid gap-3 mb-0">
            {beneficios.map((beneficio) => (
              <li key={beneficio} className="login-beneficio d-flex gap-2">
                <i className="bi bi-check2-circle fs-5" aria-hidden="true" />
                {beneficio}
              </li>
            ))}
          </ul>
        </div>

        <div className="login-aviso d-flex gap-2 p-3 small">
          <i className="bi bi-info-circle" aria-hidden="true" />
          <span>
            <strong className="text-white">Ambiente de demonstração.</strong> O login é simulado: escolha um perfil para
            entrar, sem senha.
          </span>
        </div>
      </section>

      {/* Coluna do formulário */}
      <section className="login-formulario">
        <div className="d-flex justify-content-between align-items-center">
          <div className="app-marca text-body d-lg-none">
            <span className="app-marca-icone">
              <i className="bi bi-mortarboard-fill" aria-hidden="true" />
            </span>
            MatrículaWeb
          </div>
          <BotaoTema className="ms-auto" />
        </div>

        <div className="login-caixa py-4">
          <h1 className="h3 mb-1">Acessar o sistema</h1>
          <p className="text-body-secondary mb-4">Escolha com qual perfil você quer entrar.</p>

          <ul className="nav nav-pills nav-fill abas-segmentadas mb-4" role="tablist">
            {[
              { id: 'aluno', texto: 'Aluno', icone: 'bi-mortarboard' },
              { id: 'instituicao', texto: 'Instituição', icone: 'bi-building' },
            ].map((item) => (
              <li className="nav-item" role="presentation" key={item.id}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={aba === item.id}
                  className={`nav-link ${aba === item.id ? 'active' : ''}`}
                  onClick={() => setAba(item.id)}
                >
                  <i className={`bi ${item.icone} me-2`} aria-hidden="true" />
                  {item.texto}
                </button>
              </li>
            ))}
          </ul>

          {aba === 'instituicao' && (
            <div className="card">
              <div className="card-body p-4">
                <div className="d-flex gap-3 mb-3">
                  <span className="icone-bolha bg-primary-subtle text-primary-emphasis">
                    <i className="bi bi-building" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="h6 mb-1">Secretaria Acadêmica</h2>
                    <p className="small text-body-secondary mb-0">Visão institucional</p>
                  </div>
                </div>
                <ul className="small text-body-secondary ps-3 mb-4">
                  <li>Cadastrar disciplinas, professores e alunos</li>
                  <li>Montar a oferta de turmas do semestre</li>
                  <li>Acompanhar a grade geral e a carga dos professores</li>
                </ul>
                <button
                  type="button"
                  className="btn btn-primary w-100"
                  onClick={() => entrarComo({ perfil: 'instituicao', id: null, nome: 'Secretaria Acadêmica' })}
                >
                  Entrar como Instituição
                  <i className="bi bi-arrow-right ms-2" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {aba === 'aluno' && cadastrando && (
            <FormNovaMatricula
              aoCancelar={() => setCadastrando(false)}
              aoCriar={(aluno) => entrarComo({ perfil: 'aluno', id: aluno.id, nome: aluno.nome })}
            />
          )}

          {aba === 'aluno' && !cadastrando && (
            <>
              <div className="input-group mb-3">
                <span className="input-group-text bg-transparent">
                  <i className="bi bi-search" aria-hidden="true" />
                </span>
                <input
                  type="search"
                  className="form-control"
                  placeholder="Buscar por nome ou matrícula"
                  aria-label="Buscar aluno"
                  value={busca}
                  onChange={(evento) => setBusca(evento.target.value)}
                />
              </div>

              {carregando && <EsqueletoLista linhas={5} />}
              {erro && <AlertaErro compacto mensagem={erro} aoTentarNovamente={recarregar} />}

              {alunos?.length === 0 && (
                <div className="card">
                  <EstadoVazio
                    compacto
                    icone="bi-people"
                    titulo="Nenhum aluno cadastrado"
                    descricao="Use &quot;Adicionar matrícula&quot; abaixo para se cadastrar."
                  />
                </div>
              )}

              {alunos?.length > 0 && alunosFiltrados.length === 0 && (
                <div className="card">
                  <EstadoVazio
                    compacto
                    icone="bi-search"
                    titulo="Nenhum aluno encontrado"
                    descricao={`Não há alunos com "${busca}" no nome ou na matrícula.`}
                  />
                </div>
              )}

              {alunosFiltrados.length > 0 && (
                <div className="list-group lista-alunos shadow-sm">
                  {alunosFiltrados.map((aluno) => (
                    <button
                      type="button"
                      key={aluno.id}
                      className="list-group-item list-group-item-action"
                      onClick={() => entrarComo({ perfil: 'aluno', id: aluno.id, nome: aluno.nome })}
                    >
                      <Avatar nome={aluno.nome} />
                      <span className="flex-grow-1 text-start lh-sm">
                        <span className="d-block fw-medium text-body">{aluno.nome}</span>
                        <span className="texto-pequeno text-body-secondary">Matrícula {aluno.matricula}</span>
                      </span>
                      <i className="bi bi-chevron-right" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              )}

              {!carregando && !erro && (
                <button type="button" className="btn btn-link w-100 mt-3" onClick={() => setCadastrando(true)}>
                  <i className="bi bi-person-plus me-2" aria-hidden="true" />
                  Adicionar matrícula
                </button>
              )}
            </>
          )}
        </div>

        <p className="text-center texto-pequeno text-body-secondary mb-0">
          Desafio de Programação Front-End · UNISINOS
        </p>
      </section>
    </div>
  );
}
