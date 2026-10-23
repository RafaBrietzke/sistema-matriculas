import { descreverHorario } from '../utilitarios/horarios';

export default function ListaHorarios({ horarios }) {
  return (
    <div className="d-flex flex-wrap gap-1 align-items-start">
      {horarios.map((codigo) => (
        <span key={codigo} className="badge rounded-pill bg-primary-subtle text-primary-emphasis fw-medium">
          <i className="bi bi-clock me-1" aria-hidden="true" />
          {descreverHorario(codigo, true)}
        </span>
      ))}
    </div>
  );
}
