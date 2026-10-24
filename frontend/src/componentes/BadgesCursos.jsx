export default function BadgesCursos({ cursos }) {
  if (cursos.length === 0) {
    return <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis fw-medium">Sem curso</span>;
  }
  return (
    <span className="d-inline-flex flex-wrap gap-1">
      {cursos.map((c) => (
        <span key={c.id} className="badge rounded-pill bg-info-subtle text-info-emphasis fw-medium" title={c.nome}>
          {c.sigla}
        </span>
      ))}
    </span>
  );
}
