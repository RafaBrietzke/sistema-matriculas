export function EsqueletoCartoes({ quantidade = 4 }) {
  return (
    <div className="row g-3" aria-hidden="true">
      {Array.from({ length: quantidade }, (_, i) => (
        <div className="col-sm-6 col-xl-3" key={i}>
          <div className="card">
            <div className="card-body d-flex gap-3 placeholder-glow">
              <span className="icone-bolha placeholder" />
              <div className="flex-grow-1">
                <span className="placeholder col-6 mb-2" />
                <span className="placeholder placeholder-lg col-4 d-block mb-2" />
                <span className="placeholder placeholder-xs col-8" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function EsqueletoLista({ linhas = 4 }) {
  return (
    <div className="list-group" aria-hidden="true">
      {Array.from({ length: linhas }, (_, i) => (
        <div className="list-group-item d-flex align-items-center gap-3 placeholder-glow" key={i}>
          <span className="placeholder rounded-circle" style={{ width: 36, height: 36 }} />
          <div className="flex-grow-1">
            <span className="placeholder col-5 d-block mb-1" />
            <span className="placeholder placeholder-xs col-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EsqueletoTexto({ linhas = 3 }) {
  return (
    <div className="placeholder-glow" aria-hidden="true">
      {Array.from({ length: linhas }, (_, i) => (
        <span className={`placeholder d-block mb-2 col-${12 - i * 2}`} key={i} />
      ))}
    </div>
  );
}
