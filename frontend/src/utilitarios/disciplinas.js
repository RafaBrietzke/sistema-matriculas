// true se a disciplina "id" depende (direta ou indiretamente) da disciplina "alvoId".
export function dependeDe(id, alvoId, disciplinas, visitadas = new Set()) {
  const disciplina = disciplinas.find((d) => d.id === id);
  if (!disciplina || visitadas.has(id)) return false;
  visitadas.add(id);
  return disciplina.preRequisitos.some((p) => p === alvoId || dependeDe(p, alvoId, disciplinas, visitadas));
}

export function etapaNoCurso(curso, disciplinaId) {
  return curso?.matriz?.find((m) => m.disciplinaId === disciplinaId)?.etapa ?? null;
}

export function cursosDaDisciplina(disciplinaId, cursos) {
  return cursos.filter((c) => c.matriz?.some((m) => m.disciplinaId === disciplinaId));
}
