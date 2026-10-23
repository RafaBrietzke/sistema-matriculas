// Código de horário "DT": D = dia (2 = segunda ... 7 = sábado) e T = turno (1 = manhã, 2 = tarde, 3 = noite).
export const HORARIO_VALIDO = /^[2-7][1-3]$/;

const DIAS = { 2: 'Seg', 3: 'Ter', 4: 'Qua', 5: 'Qui', 6: 'Sex', 7: 'Sáb' };
const TURNOS = { 1: 'Manhã', 2: 'Tarde', 3: 'Noite' };

export function descreverHorario(codigo) {
  return `${DIAS[codigo[0]]} · ${TURNOS[codigo[1]]}`;
}

export function horariosEmComum(a, b) {
  return a.filter((horario) => b.includes(horario));
}
