import { DIAS, TURNOS, descreverHorario } from '../utilitarios/horarios';

const dias = Object.entries(DIAS);
const turnos = Object.entries(TURNOS);

function agruparPorHorario(eventos) {
  const mapa = {};
  for (const evento of eventos) {
    for (const horario of evento.horarios) {
      (mapa[horario] ??= []).push(evento);
    }
  }
  return mapa;
}

function Evento({ evento, compacta }) {
  return (
    <div className={`evento-grade ${evento.destaque ? 'evento-destaque' : ''}`} style={{ '--cor': evento.cor }}>
      <span className="d-flex align-items-center gap-1 fw-semibold">
        <span className="text-truncate">{evento.titulo}</span>
        {evento.destaque && <span className="badge text-bg-dark ms-auto">Nova</span>}
      </span>
      {!compacta && evento.subtitulo && <span className="d-block text-truncate">{evento.subtitulo}</span>}
      {!compacta && evento.detalhe && <span className="d-block text-truncate text-body-secondary">{evento.detalhe}</span>}
    </div>
  );
}

export default function GradeHoraria({ eventos, aoClicarHorario, compacta = false }) {
  const porHorario = agruparPorHorario(eventos);

  const tabela = (
    <div className="table-responsive">
      <table className={`table table-bordered grade-horaria mb-0 ${compacta ? 'grade-compacta' : ''}`}>
        <thead>
          <tr>
            <th scope="col" className="grade-rotulo" />
            {dias.map(([dia, nome]) => (
              <th scope="col" key={dia}>{compacta ? nome.slice(0, 3) : nome}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {turnos.map(([turno, nomeTurno]) => (
            <tr key={turno}>
              <th scope="row" className="grade-rotulo">{nomeTurno}</th>
              {dias.map(([dia]) => {
                const codigo = `${dia}${turno}`;
                const lista = porHorario[codigo] ?? [];
                const conflito = lista.length > 1 && lista.some((e) => e.destaque);
                return (
                  <td key={codigo} className={`grade-celula ${conflito ? 'grade-conflito' : ''}`}>
                    <div className="d-grid gap-1">
                      {lista.map((evento) => (
                        <Evento key={evento.id} evento={evento} compacta={compacta} />
                      ))}
                      {aoClicarHorario && (
                        <button
                          type="button"
                          className="btn btn-sm grade-adicionar nao-imprimir"
                          title={`Ofertar turma em ${descreverHorario(codigo)}`}
                          aria-label={`Ofertar turma em ${descreverHorario(codigo)}`}
                          onClick={() => aoClicarHorario(codigo)}
                        >
                          <i className="bi bi-plus-lg" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (compacta) return tabela;

  return (
    <>
      <div className="grade-tabela d-none d-md-block">{tabela}</div>

      <div className="grade-agenda d-md-none d-grid gap-3">
        {dias.map(([dia, nomeDia]) => {
          const turnosDoDia = turnos
            .map(([turno, nomeTurno]) => ({ codigo: `${dia}${turno}`, nomeTurno, lista: porHorario[`${dia}${turno}`] ?? [] }))
            .filter((t) => t.lista.length > 0 || aoClicarHorario);
          if (!turnosDoDia.some((t) => t.lista.length > 0) && !aoClicarHorario) return null;

          return (
            <div className="card" key={dia}>
              <div className="card-header py-2 fw-semibold">{nomeDia}</div>
              <ul className="list-group list-group-flush">
                {turnosDoDia.map((t) => (
                  <li key={t.codigo} className="list-group-item d-flex gap-3">
                    <span className="texto-pequeno text-body-secondary fw-semibold pt-1" style={{ width: 52 }}>
                      {t.nomeTurno}
                    </span>
                    <div className="flex-grow-1 d-grid gap-1 min-w-0">
                      {t.lista.map((evento) => (
                        <Evento key={evento.id} evento={evento} />
                      ))}
                      {aoClicarHorario && (
                        <button type="button" className="btn btn-sm btn-neutro" onClick={() => aoClicarHorario(t.codigo)}>
                          <i className="bi bi-plus-lg me-1" aria-hidden="true" />
                          Ofertar turma
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </>
  );
}
