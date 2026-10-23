import { DIAS, TURNOS, descreverHorario } from '../utilitarios/horarios';

export default function SeletorHorarios({ selecionados, aoAlterar, ocupados = {}, desabilitado = false }) {
  function alternar(codigo) {
    aoAlterar(
      selecionados.includes(codigo) ? selecionados.filter((h) => h !== codigo) : [...selecionados, codigo].sort(),
    );
  }

  const listaOcupados = Object.entries(ocupados);

  return (
    <>
      <div className="table-responsive">
        <table className="table table-borderless text-center align-middle mb-2 seletor-horarios">
          <thead>
            <tr>
              <th scope="col" />
              {Object.entries(DIAS).map(([dia, nome]) => (
                <th scope="col" key={dia} className="texto-pequeno text-body-secondary fw-semibold">
                  {nome.slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(TURNOS).map(([turno, nomeTurno]) => (
              <tr key={turno}>
                <th scope="row" className="texto-pequeno text-body-secondary fw-semibold text-start">
                  {nomeTurno}
                </th>
                {Object.keys(DIAS).map((dia) => {
                  const codigo = `${dia}${turno}`;
                  const selecionado = selecionados.includes(codigo);
                  const motivo = ocupados[codigo];
                  let estilo = 'btn-neutro';
                  if (selecionado) estilo = motivo ? 'btn-danger' : 'btn-primary';
                  else if (motivo) estilo = 'celula-ocupada';

                  return (
                    <td key={codigo} className="p-1">
                      <button
                        type="button"
                        className={`btn btn-sm w-100 celula-horario ${estilo}`}
                        aria-pressed={selecionado}
                        aria-label={`${descreverHorario(codigo)}${motivo ? ` — ${motivo}` : ''}`}
                        title={motivo ?? descreverHorario(codigo)}
                        disabled={desabilitado || (Boolean(motivo) && !selecionado)}
                        onClick={() => alternar(codigo)}
                      >
                        {selecionado && <i className={`bi ${motivo ? 'bi-exclamation-lg' : 'bi-check-lg'}`} aria-hidden="true" />}
                        {!selecionado && motivo && <i className="bi bi-x-lg" aria-hidden="true" />}
                        {!selecionado && !motivo && <span className="texto-pequeno">{codigo}</span>}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="d-flex flex-wrap gap-3 texto-pequeno text-body-secondary">
        <span><span className="legenda-horario bg-primary" /> Selecionado</span>
        <span><span className="legenda-horario celula-ocupada" /> Professor ocupado</span>
        <span><span className="legenda-horario border" /> Livre</span>
      </div>

      {listaOcupados.length > 0 && (
        <ul className="list-unstyled texto-pequeno text-body-secondary mt-2 mb-0">
          {listaOcupados.map(([codigo, motivo]) => (
            <li key={codigo}>
              <i className="bi bi-x-circle text-danger me-1" aria-hidden="true" />
              {descreverHorario(codigo, true)}: {motivo}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
