import { useState } from 'react';
import { buscarConfiguracoes, salvarConfiguracoes } from '../../api/cliente';
import { useNotificacao } from '../../contexto/notificacao';
import { useBuscaDados } from '../../hooks/useBuscaDados';
import AlertaErro from '../../componentes/AlertaErro';
import { EsqueletoTexto } from '../../componentes/Esqueleto';

export default function ConfiguracoesMatricula() {
  const { dados, carregando, erro, recarregar } = useBuscaDados(buscarConfiguracoes);

  return (
    <div className="card">
      <div className="card-header py-3 d-flex justify-content-between align-items-center">
        <h2 className="h6 mb-0">
          <i className="bi bi-sliders me-2 text-primary" aria-hidden="true" />
          Matrículas {dados?.semestreAtual}
        </h2>
        {dados && (
          <span className={`badge rounded-pill ${dados.periodoMatriculaAberto ? 'text-bg-success' : 'text-bg-secondary'}`}>
            {dados.periodoMatriculaAberto ? 'Período aberto' : 'Período fechado'}
          </span>
        )}
      </div>
      <div className="card-body">
        {carregando && <EsqueletoTexto linhas={3} />}
        {erro && <AlertaErro compacto mensagem={erro} aoTentarNovamente={recarregar} />}
        {dados && <FormularioConfiguracoes key={JSON.stringify(dados)} configuracoes={dados} aoSalvar={recarregar} />}
      </div>
    </div>
  );
}

function FormularioConfiguracoes({ configuracoes, aoSalvar }) {
  const { notificar } = useNotificacao();
  const [aberto, setAberto] = useState(configuracoes.periodoMatriculaAberto);
  const [limite, setLimite] = useState(String(configuracoes.limiteCreditos));
  const [salvando, setSalvando] = useState(false);

  const limiteNumero = Number(limite);
  const limiteValido = Number.isInteger(limiteNumero) && limiteNumero >= 4 && limiteNumero <= 40;
  const alterado = aberto !== configuracoes.periodoMatriculaAberto || limiteNumero !== configuracoes.limiteCreditos;

  async function salvar(evento) {
    evento.preventDefault();
    setSalvando(true);
    try {
      await salvarConfiguracoes({ periodoMatriculaAberto: aberto, limiteCreditos: limiteNumero });
      notificar({
        tipo: 'sucesso',
        titulo: 'Configurações salvas',
        mensagem: aberto ? 'Os alunos já podem se matricular.' : 'Os alunos só podem consultar a oferta.',
      });
      aoSalvar();
    } catch (e) {
      notificar({ tipo: 'erro', titulo: 'Não foi possível salvar', mensagem: e.message });
      setSalvando(false);
    }
  }

  return (
    <form className="d-grid gap-3" onSubmit={salvar}>
      <div className="form-check form-switch">
        <input
          id="periodo-aberto"
          className="form-check-input"
          type="checkbox"
          role="switch"
          checked={aberto}
          onChange={(e) => setAberto(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="periodo-aberto">
          Período de matrícula aberto
        </label>
      </div>

      <div>
        <label htmlFor="limite-creditos" className="form-label small fw-medium">
          Limite de créditos por aluno
        </label>
        <input
          id="limite-creditos"
          type="number"
          min="4"
          max="40"
          className={`form-control ${limiteValido ? '' : 'is-invalid'}`}
          value={limite}
          onChange={(e) => setLimite(e.target.value)}
        />
        <div className="invalid-feedback">Informe um número entre 4 e 40.</div>
      </div>

      <button type="submit" className="btn btn-primary" disabled={!alterado || !limiteValido || salvando}>
        {salvando && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
        Salvar configurações
      </button>
    </form>
  );
}
