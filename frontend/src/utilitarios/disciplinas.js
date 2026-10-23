export function etapaDa(codigo) {
  return Number(codigo.match(/\d/)?.[0] ?? 0);
}

// true se a disciplina "id" depende (direta ou indiretamente) da disciplina "alvoId".
export function dependeDe(id, alvoId, disciplinas, visitadas = new Set()) {
  const disciplina = disciplinas.find((d) => d.id === id);
  if (!disciplina || visitadas.has(id)) return false;
  visitadas.add(id);
  return disciplina.preRequisitos.some((p) => p === alvoId || dependeDe(p, alvoId, disciplinas, visitadas));
}
