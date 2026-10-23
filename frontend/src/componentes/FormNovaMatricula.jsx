import { useState } from 'react';
import { criar, listar, requisicao } from '../api/cliente';
import { useBuscaDados } from '../hooks/useBuscaDados';

export default function FormNovaMatricula({ aoCriar, aoCancelar }) {
  const [nome, setNome] = useState('');
  const [curso, setCurso] = useState('');
  const [validado, setValidado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState(null);
  const { dados: previa, carregando, erro: erroPrevia } = useBuscaDados(() => requisicao('/alunos/proxima-matricula'));
  const { dados: cursos, erro: erroCursos } = useBuscaDados(() => listar('cursos'));

  const nomeValido = nome.trim().length >= 3;
  const cursoValido = curso !== '';
  const erroCarga = erroPrevia ?? erroCursos;

  async function enviar(evento) {
    evento.preventDefault();
    setValidado(true);
    if (!nomeValido || !cursoValido) return;

    setSalvando(true);
    setErroEnvio(null);
    try {
      const aluno = await criar('alunos', { nome, curso });
      aoCriar(aluno);
    } catch (e) {
      setErroEnvio(e.message);
      setSalvando(false);
    }
  }

  return (
    <form className="card" onSubmit={enviar} noValidate>
      <div className="card-body p-4">
        <h2 className="h6 mb-3">Nova matrícula</h2>

        <div className="mb-3">
          <label htmlFor="nova-matricula-numero" className="form-label">
            Matrícula
          </label>
          <input
            id="nova-matricula-numero"
            className="form-control"
            value={carregando ? 'Gerando…' : (previa?.matricula ?? '—')}
            readOnly
            disabled
            aria-describedby="nova-matricula-ajuda"
          />
          <div id="nova-matricula-ajuda" className="form-text">
            Gerada automaticamente pelo sistema.
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="nova-matricula-nome" className="form-label">
            Nome completo
          </label>
          <input
            id="nova-matricula-nome"
            className={`form-control ${validado && !nomeValido ? 'is-invalid' : ''}`}
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            autoFocus
          />
          <div className="invalid-feedback">Informe o nome completo (mínimo de 3 letras).</div>
        </div>

        <div className="mb-4">
          <label htmlFor="nova-matricula-curso" className="form-label">
            Curso
          </label>
          <select
            id="nova-matricula-curso"
            className={`form-select ${validado && !cursoValido ? 'is-invalid' : ''}`}
            value={curso}
            onChange={(evento) => setCurso(evento.target.value)}
            disabled={!cursos}
          >
            <option value="">{cursos ? 'Selecione o curso' : 'Carregando cursos…'}</option>
            {cursos?.map((item) => (
              <option key={item.id} value={item.nome}>
                {item.nome}
              </option>
            ))}
          </select>
          <div className="invalid-feedback">Selecione um curso.</div>
        </div>

        {erroCarga && <div className="alert alert-danger small py-2">{erroCarga}</div>}
        {erroEnvio && <div className="alert alert-danger small py-2">{erroEnvio}</div>}

        <div className="d-flex gap-2">
          <button type="button" className="btn btn-neutro flex-fill" onClick={aoCancelar} disabled={salvando}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary flex-fill" disabled={salvando || !!erroCarga}>
            {salvando && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
            Cadastrar e entrar
          </button>
        </div>
      </div>
    </form>
  );
}
