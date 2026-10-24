import { proximoCodigoTurma } from './regras/oferta.js';

const SIGLAS = { 'Análise e Desenvolvimento de Sistemas': 'ADS', 'Ciência da Computação': 'CC', 'Sistemas de Informação': 'SI', 'Jogos Digitais': 'JOG' };

function siglaDe(nome) {
  return SIGLAS[nome] ?? nome.split(/\s+/).filter((p) => p.length > 2).map((p) => p[0]).join('').toUpperCase();
}

const CONFIGURACOES_PADRAO = { semestreAtual: '2026/2', periodoMatriculaAberto: true, limiteCreditos: 20 };

// Atualiza um db.json criado por uma versão anterior do sistema, sem apagar dados.
// Devolve true quando algo foi alterado (e precisa ser salvo).
export function migrarDb(db) {
  let alterou = false;

  for (const colecao of ['cursos', 'disciplinas', 'professores', 'alunos', 'turmas']) {
    if (!Array.isArray(db[colecao])) {
      db[colecao] = [];
      alterou = true;
    }
  }

  if (!db.configuracoes) {
    db.configuracoes = { ...CONFIGURACOES_PADRAO };
    alterou = true;
  }

  const comCodigo = db.turmas.filter((t) => t.codigo);
  for (const turma of db.turmas.filter((t) => !t.codigo)) {
    const disciplina = db.disciplinas.find((d) => d.id === turma.disciplinaId);
    if (!disciplina) continue;
    turma.codigo = proximoCodigoTurma(disciplina, comCodigo, turma.semestre);
    comCodigo.push(turma);
    alterou = true;
  }

  for (const curso of db.cursos) {
    if (!curso.sigla) {
      curso.sigla = siglaDe(curso.nome);
      alterou = true;
    }
    if (!Array.isArray(curso.matriz)) {
      // Antes da matriz só existiam disciplinas de ADS: a etapa vem do 1º dígito do código (ADS201 → 2ª).
      curso.matriz =
        curso.sigla === 'ADS'
          ? db.disciplinas.filter((d) => d.codigo.startsWith('ADS')).map((d) => ({ disciplinaId: d.id, etapa: Number(d.codigo.match(/\d/)?.[0] ?? 1) }))
          : [];
      alterou = true;
    }
  }

  for (const curso of db.cursos) {
    if (curso.etapas === undefined) {
      curso.etapas = curso.matriz.length ? Math.max(...curso.matriz.map((m) => m.etapa)) : 4;
      alterou = true;
    }
  }

  for (const aluno of db.alunos) {
    if (aluno.cursoId === undefined) {
      aluno.cursoId = db.cursos.find((c) => c.nome === aluno.curso)?.id ?? db.cursos[0]?.id ?? null;
      delete aluno.curso;
      alterou = true;
    }
  }

  return alterou;
}
