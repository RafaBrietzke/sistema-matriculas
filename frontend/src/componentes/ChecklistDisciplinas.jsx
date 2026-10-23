import { useState } from 'react';
import { etapaDa } from '../utilitarios/disciplinas';
import { plural } from '../utilitarios/indicadores';

export default function ChecklistDisciplinas({ disciplinas, selecionadas, aoAlterar, motivoBloqueio = () => null, agruparPorEtapa = false }) {
  const [busca, setBusca] = useState('');

  function alternar(id) {
    aoAlterar(selecionadas.includes(id) ? selecionadas.filter((s) => s !== id) : [...selecionadas, id]);
  }

  const termo = busca.trim().toLowerCase();
  const visiveis = disciplinas
    .filter((d) => `${d.codigo} ${d.nome}`.toLowerCase().includes(termo))
    .sort((a, b) => a.codigo.localeCompare(b.codigo));

  const grupos = agruparPorEtapa
    ? Object.entries(
        visiveis.reduce((porEtapa, d) => {
          (porEtapa[etapaDa(d.codigo)] ??= []).push(d);
          return porEtapa;
        }, {}),
      ).map(([etapa, lista]) => [`${etapa}ª etapa`, lista])
    : [[null, visiveis]];

  return (
    <div className="border rounded-3">
      <div className="p-2 border-bottom d-flex align-items-center gap-2">
        <input
          type="search"
          className="form-control form-control-sm"
          placeholder="Filtrar disciplinas"
          aria-label="Filtrar disciplinas"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <span className="badge rounded-pill text-bg-primary text-nowrap">{plural(selecionadas.length, 'marcada', 'marcadas')}</span>
      </div>
      <div className="checklist-disciplinas">
        {visiveis.length === 0 && <p className="small text-body-secondary text-center py-3 mb-0">Nenhuma disciplina encontrada.</p>}
        {grupos.map(([titulo, lista]) => (
          <div key={titulo ?? 'todas'}>
            {titulo && <p className="titulo-secao text-body-secondary px-3 pt-3 mb-1">{titulo}</p>}
            {lista.map((d) => {
              const marcada = selecionadas.includes(d.id);
              const motivo = motivoBloqueio(d, marcada);
              return (
                <label key={d.id} className={`d-flex gap-2 px-3 py-2 item-checklist ${motivo ? 'opacity-75' : ''}`}>
                  <input
                    type="checkbox"
                    className="form-check-input mt-1 flex-shrink-0"
                    checked={marcada}
                    disabled={Boolean(motivo)}
                    onChange={() => alternar(d.id)}
                  />
                  <span className="small lh-sm">
                    <span className="fw-semibold">{d.codigo}</span> · {d.nome}
                    {motivo && <span className="d-block texto-pequeno text-body-secondary mt-1">{motivo}</span>}
                  </span>
                </label>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
