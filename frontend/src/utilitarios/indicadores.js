// Cálculos usados nos painéis (ocupação de turmas e carga dos professores).

export function percentual(parte, total) {
  return total ? Math.round((parte / total) * 100) : 0;
}

// Carga = quantidade de horários semanais nas turmas do professor.
export function cargaDoProfessor(professorId, turmas) {
  return turmas
    .filter((turma) => turma.professorId === professorId)
    .reduce((soma, turma) => soma + turma.horarios.length, 0);
}

// Cor do Bootstrap conforme o quanto de um limite já foi usado.
export function nivelDeUso(porcentagem) {
  if (porcentagem >= 100) return 'danger';
  if (porcentagem >= 75) return 'warning';
  return 'success';
}

// Lista o que precisa da atenção da instituição, do mais grave para o menos grave.
export function pontosDeAtencao({ turmas, professores, disciplinas }) {
  const nomeDisciplina = (id) => disciplinas.find((d) => d.id === id)?.nome ?? 'Disciplina';
  const pontos = [];

  for (const turma of turmas) {
    const restantes = turma.vagas - turma.alunos.length;
    const ocupacao = percentual(turma.alunos.length, turma.vagas);

    if (restantes <= 0) {
      pontos.push({ nivel: 'danger', icone: 'bi-door-closed', titulo: nomeDisciplina(turma.disciplinaId), detalhe: 'Turma lotada' });
    } else if (restantes <= 2 || ocupacao >= 80) {
      pontos.push({
        nivel: 'warning',
        icone: 'bi-people',
        titulo: nomeDisciplina(turma.disciplinaId),
        detalhe: `Quase lotada: ${plural(restantes, 'vaga restante', 'vagas restantes')}`,
      });
    } else if (turma.alunos.length === 0) {
      pontos.push({ nivel: 'info', icone: 'bi-inbox', titulo: nomeDisciplina(turma.disciplinaId), detalhe: 'Turma sem matrículas' });
    }
  }

  for (const professor of professores) {
    const carga = cargaDoProfessor(professor.id, turmas);
    const uso = percentual(carga, professor.cargaMaxima);
    if (uso >= 75) {
      pontos.push({
        nivel: nivelDeUso(uso),
        icone: 'bi-person-exclamation',
        titulo: professor.nome,
        detalhe: `${uso >= 100 ? 'No limite de carga' : 'Perto do limite'}: ${carga} de ${professor.cargaMaxima} horários`,
      });
    }
  }

  const ordem = { danger: 0, warning: 1, info: 2 };
  return pontos.sort((a, b) => ordem[a.nivel] - ordem[b.nivel]);
}

// plural(1, 'vaga') → "1 vaga"; plural(3, 'vaga') → "3 vagas".
export function plural(quantidade, singular, formaPlural = `${singular}s`) {
  return `${quantidade} ${quantidade === 1 ? singular : formaPlural}`;
}
