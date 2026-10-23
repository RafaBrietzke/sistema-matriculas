import { nivelDeUso, percentual } from '../utilitarios/indicadores';

export default function BarraUso({ valor, maximo, rotulo, detalhe, cor }) {
  const uso = Math.min(percentual(valor, maximo), 100);

  return (
    <div>
      {(rotulo || detalhe) && (
        <div className="d-flex justify-content-between gap-2 small mb-1">
          <span className="fw-medium">{rotulo}</span>
          <span className="text-body-secondary text-nowrap">{detalhe ?? `${valor}/${maximo}`}</span>
        </div>
      )}
      <div
        className="progress"
        role="progressbar"
        aria-label={rotulo ?? 'Uso'}
        aria-valuenow={uso}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div className={`progress-bar bg-${cor ?? nivelDeUso(percentual(valor, maximo))}`} style={{ width: `${uso}%` }} />
      </div>
    </div>
  );
}
