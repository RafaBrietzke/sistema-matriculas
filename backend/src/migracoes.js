import { proximoCodigoTurma } from './regras/oferta.js';

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

  return alterou;
}
