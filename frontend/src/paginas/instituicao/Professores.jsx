import { useState } from 'react';
import { Link } from 'react-router-dom';
import { atualizar, criar, listar } from '../../api/cliente';
import { useNotificacao } from '../../contexto/notificacao';
import { useBuscaDados } from '../../hooks/useBuscaDados';
import { cargaDoProfessor, plural } from '../../utilitarios/indicadores';
import AlertaErro from '../../componentes/AlertaErro';
import Avatar from '../../componentes/Avatar';
import BarraUso from '../../componentes/BarraUso';
import CabecalhoPagina from '../../componentes/CabecalhoPagina';
import EstadoVazio from '../../componentes/EstadoVazio';
import { EsqueletoLista } from '../../componentes/Esqueleto';
import ModalExclusao from '../../componentes/ModalExclusao';
import PainelLateral from '../../componentes/PainelLateral';

async function buscarDados() {
  const [professores, turmas] = await Promise.all([listar('professores'), listar('turmas')]);
  return { professores, turmas };
}

export default function Professores() {
  const { dados, carregando, erro, recarregar } = useBuscaDados(buscarDados);
  const [busca, setBusca] = useState('');
  const [editando, setEditando] = useState(null);
  const [excluindo, setExcluindo] = useState(null);

  const acoes = (
    <button type="button" className="btn btn-primary" onClick={() => setEditando({})}>
      <i className="bi bi-plus-lg me-2" aria-hidden="true" />
      Novo professor
    </button>
  );

  if (carregando && !dados) {
    return (
      <>
        <CabecalhoPagina titulo="Professores" acoes={acoes} />
        <EsqueletoLista linhas={5} />
      </>
    );
  }
  if (erro) return <AlertaErro mensagem={erro} aoTentarNovamente={recarregar} />;

  const { professores, turmas } = dados;
  const termo = busca.trim().toLowerCase();
  const filtrados = professores
    .filter((p) => `${p.nome} ${p.area}`.toLowerCase().includes(termo))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <>
      <CabecalhoPagina titulo="Professores" subtitulo={plural(professores.length, 'professor cadastrado', 'professores cadastrados')} acoes={acoes} />

      <div className="card">
        <div className="card-body border-bottom">
          <input
            type="search"
            className="form-control"
            placeholder="Buscar por nome ou área"
            aria-label="Buscar professor"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        {filtrados.length === 0 ? (
          <EstadoVazio icone="bi-person-x" titulo="Nenhum professor encontrado" descricao="Ajuste a busca ou cadastre um novo professor." />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr className="texto-pequeno text-body-secondary">
                  <th scope="col" className="ps-3">Professor</th>
                  <th scope="col">Área</th>
                  <th scope="col" style={{ minWidth: 180 }}>Carga semanal</th>
                  <th scope="col" className="text-center">Turmas</th>
                  <th scope="col" className="text-end pe-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p) => {
                  const carga = cargaDoProfessor(p.id, turmas);
                  return (
                    <tr key={p.id}>
                      <td className="ps-3">
                        <Link to={`/instituicao/professores/${p.id}`} className="d-flex align-items-center gap-2 fw-medium text-nowrap link-nome">
                          <Avatar nome={p.nome} tamanho={32} />
                          {p.nome}
                        </Link>
                      </td>
                      <td>{p.area}</td>
                      <td>
                        <BarraUso valor={carga} maximo={p.cargaMaxima} detalhe={`${carga}/${p.cargaMaxima} horários`} />
                      </td>
                      <td className="text-center">{turmas.filter((t) => t.professorId === p.id).length}</td>
                      <td className="text-end pe-3 text-nowrap">
                        <button type="button" className="btn botao-icone" aria-label={`Editar ${p.nome}`} title="Editar" onClick={() => setEditando(p)}>
                          <i className="bi bi-pencil" aria-hidden="true" />
                        </button>
                        <button type="button" className="btn botao-icone text-danger" aria-label={`Excluir ${p.nome}`} title="Excluir" onClick={() => setExcluindo({ id: p.id, nome: p.nome })}>
                          <i className="bi bi-trash" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PainelLateral
        aberto={Boolean(editando)}
        titulo={editando?.id ? `Editar ${editando.nome}` : 'Novo professor'}
        subtitulo="A carga máxima é o número de horários semanais que o professor pode assumir."
        aoFechar={() => setEditando(null)}
      >
        {editando && (
          <FormularioProfessor
            key={editando.id ?? 'novo'}
            professor={editando.id ? editando : null}
            cargaAtual={editando.id ? cargaDoProfessor(editando.id, turmas) : 0}
            aoSalvar={() => {
              setEditando(null);
              recarregar();
            }}
            aoCancelar={() => setEditando(null)}
          />
        )}
      </PainelLateral>

      <ModalExclusao item={excluindo} recurso="professores" aoFechar={() => setExcluindo(null)} aoExcluir={recarregar} />
    </>
  );
}

export function FormularioProfessor({ professor, cargaAtual, aoSalvar, aoCancelar }) {
  const { notificar } = useNotificacao();
  const [form, setForm] = useState({
    nome: professor?.nome ?? '',
    area: professor?.area ?? '',
    cargaMaxima: String(professor?.cargaMaxima ?? 4),
  });
  const [tentouSalvar, setTentouSalvar] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroServidor, setErroServidor] = useState('');

  const carga = Number(form.cargaMaxima);
  const minimo = Math.max(1, cargaAtual);
  const erros = {
    nome: form.nome.trim().length < 3 && 'Informe o nome (mínimo de 3 letras)',
    area: form.area.trim().length < 2 && 'Informe a área de atuação',
    cargaMaxima:
      !Number.isInteger(carga) || carga < 1 || carga > 20
        ? 'Informe um inteiro entre 1 e 20'
        : carga < cargaAtual && `Já leciona ${cargaAtual} horários; não pode ser menor que isso`,
  };
  const valido = !Object.values(erros).some(Boolean);
  const classe = (campo) => (tentouSalvar && erros[campo] ? 'is-invalid' : '');

  function alterar(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
    setErroServidor('');
  }

  async function salvar(evento) {
    evento.preventDefault();
    setTentouSalvar(true);
    if (!valido) return;
    setSalvando(true);
    const payload = { ...form, cargaMaxima: carga };
    try {
      const salvo = professor ? await atualizar('professores', professor.id, payload) : await criar('professores', payload);
      notificar({ tipo: 'sucesso', titulo: `${salvo.nome} ${professor ? 'atualizado(a)' : 'cadastrado(a)'}` });
      aoSalvar();
    } catch (e) {
      setErroServidor(e.message);
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} noValidate>
      <div className="offcanvas-body d-grid gap-3 align-content-start">
        <div>
          <label htmlFor="nome-professor" className="form-label fw-medium">Nome</label>
          <input id="nome-professor" className={`form-control ${classe('nome')}`} value={form.nome} onChange={(e) => alterar('nome', e.target.value)} />
          <div className="invalid-feedback">{erros.nome}</div>
        </div>
        <div>
          <label htmlFor="area-professor" className="form-label fw-medium">Área de atuação</label>
          <input id="area-professor" className={`form-control ${classe('area')}`} value={form.area} onChange={(e) => alterar('area', e.target.value)} />
          <div className="invalid-feedback">{erros.area}</div>
        </div>
        <div>
          <label htmlFor="carga-professor" className="form-label fw-medium">Carga máxima (horários por semana)</label>
          <input id="carga-professor" type="number" min={minimo} max="20" className={`form-control ${classe('cargaMaxima')}`} value={form.cargaMaxima} onChange={(e) => alterar('cargaMaxima', e.target.value)} />
          <div className="invalid-feedback">{erros.cargaMaxima}</div>
          {professor && <div className="form-text">Carga atual: {plural(cargaAtual, 'horário', 'horários')} em turmas ofertadas.</div>}
        </div>

        {erroServidor && (
          <div className="alert alert-danger small mb-0" role="alert">
            <i className="bi bi-exclamation-octagon me-1" aria-hidden="true" />
            {erroServidor}
          </div>
        )}
      </div>

      <div className="border-top p-3 d-flex gap-2">
        <button type="button" className="btn btn-neutro flex-fill" onClick={aoCancelar}>Cancelar</button>
        <button type="submit" className="btn btn-primary flex-fill" disabled={salvando}>
          {salvando && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
          {professor ? 'Salvar alterações' : 'Cadastrar professor'}
        </button>
      </div>
    </form>
  );
}
