import { descreverHorario, horariosEmComum } from './horarios.js';
import { turmasDoSemestre } from './oferta.js';
import { etapaNoCurso } from './matriz.js';

function turmasDoAluno(alunoId, db) {
  return turmasDoSemestre(db).filter((turma) => turma.alunos.includes(alunoId));
}

function disciplinaDa(turma, db) {
  return db.disciplinas.find((d) => d.id === turma.disciplinaId);
}

export function creditosMatriculados(alunoId, db) {
  return turmasDoAluno(alunoId, db).reduce((soma, turma) => soma + disciplinaDa(turma, db).creditos, 0);
}

// Motivos que impedem o aluno de se matricular na turma (R1, R8 e R2–R7, nesta ordem).
// Lista vazia = pode se matricular (ou já está matriculado).
export function bloqueiosDeMatricula(aluno, turma, db) {
  if (turma.alunos.includes(aluno.id)) return [];

  const { periodoMatriculaAberto, limiteCreditos } = db.configuracoes;
  const disciplina = disciplinaDa(turma, db);
  const minhasTurmas = turmasDoAluno(aluno.id, db);
  const bloqueios = [];

  if (!periodoMatriculaAberto) {
    bloqueios.push({ tipo: 'periodo', mensagem: 'O período de matrícula está fechado' });
  }

  const curso = db.cursos.find((c) => c.id === aluno.cursoId);
  if (etapaNoCurso(curso, disciplina.id) === null) {
    bloqueios.push({ tipo: 'fora-do-curso', mensagem: `Esta disciplina não faz parte da matriz de ${curso?.nome ?? 'seu curso'}` });
  }

  if (aluno.aprovadas.includes(disciplina.id)) {
    bloqueios.push({ tipo: 'aprovada', mensagem: `Você já foi aprovado em ${disciplina.nome}` });
  }

  const mesmaDisciplina = minhasTurmas.find((t) => t.disciplinaId === disciplina.id);
  if (mesmaDisciplina) {
    bloqueios.push({ tipo: 'mesma-disciplina', mensagem: `Você já está na turma ${mesmaDisciplina.codigo} desta disciplina` });
  }

  const faltando = disciplina.preRequisitos
    .filter((id) => !aluno.aprovadas.includes(id))
    .map((id) => db.disciplinas.find((d) => d.id === id)?.nome);
  if (faltando.length > 0) {
    const rotulo = faltando.length === 1 ? 'Falta pré-requisito' : 'Faltam pré-requisitos';
    bloqueios.push({ tipo: 'pre-requisito', mensagem: `${rotulo}: ${faltando.join(', ')}` });
  }

  if (turma.alunos.length >= turma.vagas) {
    bloqueios.push({ tipo: 'lotada', mensagem: 'Turma lotada' });
  }

  for (const outra of minhasTurmas) {
    const [comum] = horariosEmComum(outra.horarios, turma.horarios);
    if (comum) {
      bloqueios.push({ tipo: 'choque', mensagem: `Choque de horário com ${outra.codigo} (${descreverHorario(comum)})` });
    }
  }

  const atuais = creditosMatriculados(aluno.id, db);
  if (atuais + disciplina.creditos > limiteCreditos) {
    bloqueios.push({
      tipo: 'creditos',
      mensagem: `Passaria do limite de ${limiteCreditos} créditos (${atuais} + ${disciplina.creditos})`,
    });
  }

  return bloqueios;
}

export function ofertasDoAluno(aluno, db) {
  const curso = db.cursos.find((c) => c.id === aluno.cursoId);
  const ofertas = turmasDoSemestre(db).map((turma) => {
    const disciplina = disciplinaDa(turma, db);
    const professor = db.professores.find((p) => p.id === turma.professorId);
    return {
      id: turma.id,
      codigo: turma.codigo,
      horarios: turma.horarios,
      vagas: turma.vagas,
      matriculados: turma.alunos.length,
      disciplina: { id: disciplina.id, codigo: disciplina.codigo, nome: disciplina.nome, creditos: disciplina.creditos },
      professor: { id: professor.id, nome: professor.nome },
      matriculado: turma.alunos.includes(aluno.id),
      naMatriz: etapaNoCurso(curso, disciplina.id) !== null,
      etapa: etapaNoCurso(curso, disciplina.id),
      bloqueios: bloqueiosDeMatricula(aluno, turma, db),
    };
  });

  return {
    curso: curso ? { id: curso.id, nome: curso.nome, sigla: curso.sigla } : null,
    configuracoes: db.configuracoes,
    creditosMatriculados: creditosMatriculados(aluno.id, db),
    ofertas,
  };
}
