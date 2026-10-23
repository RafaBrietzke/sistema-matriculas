// Código de horário "DT": D = dia da semana (2 a 7) e T = turno (1 a 3).
// Exemplo: "21" = segunda-feira de manhã, "33" = terça-feira à noite.
export const DIAS = { 2: 'Segunda', 3: 'Terça', 4: 'Quarta', 5: 'Quinta', 6: 'Sexta', 7: 'Sábado' };
export const TURNOS = { 1: 'Manhã', 2: 'Tarde', 3: 'Noite' };

export function descreverHorario(codigo, abreviado = false) {
  const dia = DIAS[codigo[0]];
  const turno = TURNOS[codigo[1]];
  return `${abreviado ? dia.slice(0, 3) : dia} · ${turno}`;
}
