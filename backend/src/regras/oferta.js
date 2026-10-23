import { ErroHttp } from '../middlewares/erros.js';
import { HORARIO_VALIDO, descreverHorario, horariosEmComum } from './horarios.js';

const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function turmasDoSemestre(db) {
  return db.turmas.filter((turma) => turma.semestre === db.configuracoes.semestreAtual);
}

// Valida o formato do corpo da requisição e devolve os dados já convertidos.
export function normalizarOferta(corpo) {
  const disciplinaId = Number(corpo?.disciplinaId);
  const professorId = Number(corpo?.professorId);
  const vagas = Number(corpo?.vagas);
  const horarios = Array.isArray(corpo?.horarios) ? [...new Set(corpo.horarios.map(String))].sort() : [];

  if (!Number.isInteger(disciplinaId) || disciplinaId <= 0) {
    throw new ErroHttp(400, 'Selecione a disciplina da turma');
  }
  if (!Number.isInteger(professorId) || professorId <= 0) {
    throw new ErroHttp(400, 'Selecione o professor da turma');
  }
  if (!Number.isInteger(vagas) || vagas < 1 || vagas > 200) {
    throw new ErroHttp(400, 'O número de vagas deve ser um inteiro entre 1 e 200');
  }
  if (horarios.length === 0) {
    throw new ErroHttp(400, 'Escolha pelo menos um horário para a turma');
  }
  const invalido = horarios.find((horario) => !HORARIO_VALIDO.test(horario));
  if (invalido) {
    throw new ErroHttp(400, `Horário inválido: ${invalido}. Use o formato DT (dia de 2 a 7 e turno de 1 a 3)`);
  }

  return { disciplinaId, professorId, horarios, vagas };
}

export function cargaDoProfessor(professorId, turmas, ignorarTurmaId = null) {
  return turmas
    .filter((turma) => turma.professorId === professorId && turma.id !== ignorarTurmaId)
    .reduce((soma, turma) => soma + turma.horarios.length, 0);
}

// Regras de negócio da oferta. "turmaAtual" é informada na edição.
export function validarOferta(dados, db, turmaAtual = null) {
  const disciplina = db.disciplinas.find((d) => d.id === dados.disciplinaId);
  if (!disciplina) throw new ErroHttp(400, 'Disciplina não encontrada');
  const professor = db.professores.find((p) => p.id === dados.professorId);
  if (!professor) throw new ErroHttp(400, 'Professor não encontrado');

  if (turmaAtual?.alunos.length > 0) {
    if (dados.disciplinaId !== turmaAtual.disciplinaId) {
      throw new ErroHttp(409, 'Não é possível trocar a disciplina de uma turma com alunos matriculados');
    }
    if (dados.horarios.join() !== [...turmaAtual.horarios].sort().join()) {
      throw new ErroHttp(409, 'Não é possível alterar os horários de uma turma com alunos matriculados');
    }
    if (dados.vagas < turmaAtual.alunos.length) {
      throw new ErroHttp(409, `A turma já tem ${turmaAtual.alunos.length} alunos matriculados; as vagas não podem ser menos que isso`);
    }
  }

  const turmas = turmasDoSemestre(db);
  const outrasDoProfessor = turmas.filter((t) => t.professorId === professor.id && t.id !== turmaAtual?.id);
  for (const turma of outrasDoProfessor) {
    const [comum] = horariosEmComum(turma.horarios, dados.horarios);
    if (comum) {
      throw new ErroHttp(409, `${professor.nome} já leciona ${turma.codigo} neste horário (${descreverHorario(comum)})`);
    }
  }

  const carga = cargaDoProfessor(professor.id, turmas, turmaAtual?.id) + dados.horarios.length;
  if (carga > professor.cargaMaxima) {
    throw new ErroHttp(409, `${professor.nome} passaria da carga máxima (${carga} de ${professor.cargaMaxima} horários)`);
  }

  return { disciplina, professor };
}

export function proximoCodigoTurma(disciplina, turmas, semestre) {
  const usadas = turmas
    .filter((t) => t.disciplinaId === disciplina.id && t.semestre === semestre)
    .map((t) => t.codigo.split('-').pop());
  const letra = [...LETRAS].find((l) => !usadas.includes(l));
  if (!letra) throw new ErroHttp(409, `Limite de turmas atingido para ${disciplina.nome}`);
  return `${disciplina.codigo}-${letra}`;
}
