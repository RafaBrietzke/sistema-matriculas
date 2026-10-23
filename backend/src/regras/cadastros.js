import { ErroHttp } from '../middlewares/erros.js';
import { cargaDoProfessor, turmasDoSemestre } from './oferta.js';
import { plural } from './textos.js';

const CODIGO_DISCIPLINA = /^[A-Z]{2,4}\d{3}$/;

function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function idsUnicos(lista) {
  return Array.isArray(lista) ? [...new Set(lista.map(Number))] : [];
}

// ---------- Disciplinas ----------

export function normalizarDisciplina(corpo) {
  const codigo = texto(corpo?.codigo).toUpperCase();
  const nome = texto(corpo?.nome);
  const creditos = Number(corpo?.creditos);

  if (!CODIGO_DISCIPLINA.test(codigo)) {
    throw new ErroHttp(400, 'Informe um código no formato AAA999 (ex.: ADS101)');
  }
  if (nome.length < 3) throw new ErroHttp(400, 'Informe o nome da disciplina (mínimo de 3 letras)');
  if (!Number.isInteger(creditos) || creditos < 1 || creditos > 12) {
    throw new ErroHttp(400, 'Os créditos devem ser um inteiro entre 1 e 12');
  }

  return { codigo, nome, creditos, preRequisitos: idsUnicos(corpo?.preRequisitos) };
}

// true se a disciplina "id" depende (direta ou indiretamente) da disciplina "alvoId".
export function dependeDe(id, alvoId, disciplinas, visitadas = new Set()) {
  const disciplina = disciplinas.find((d) => d.id === id);
  if (!disciplina || visitadas.has(id)) return false;
  visitadas.add(id);
  return disciplina.preRequisitos.some((p) => p === alvoId || dependeDe(p, alvoId, disciplinas, visitadas));
}

export function validarDisciplina(dados, db, atual = null) {
  const repetida = db.disciplinas.find((d) => d.codigo === dados.codigo && d.id !== atual?.id);
  if (repetida) throw new ErroHttp(409, `O código ${dados.codigo} já está em uso por ${repetida.nome}`);

  for (const id of dados.preRequisitos) {
    if (!db.disciplinas.some((d) => d.id === id)) throw new ErroHttp(400, `Pré-requisito ${id} não encontrado`);
  }

  if (atual) {
    if (dados.preRequisitos.includes(atual.id)) {
      throw new ErroHttp(409, 'Uma disciplina não pode ser pré-requisito dela mesma');
    }
    const emCiclo = dados.preRequisitos.find((id) => dependeDe(id, atual.id, db.disciplinas));
    if (emCiclo) {
      const nome = db.disciplinas.find((d) => d.id === emCiclo).nome;
      throw new ErroHttp(409, `Isso criaria um ciclo: ${nome} já depende de ${atual.nome}`);
    }
    if (dados.codigo !== atual.codigo && db.turmas.some((t) => t.disciplinaId === atual.id)) {
      throw new ErroHttp(409, 'O código não pode mudar porque a disciplina já tem turmas ofertadas');
    }
  }
}

export function usoDaDisciplina(id, db) {
  const motivos = [];
  const turmas = db.turmas.filter((t) => t.disciplinaId === id).map((t) => t.codigo);
  if (turmas.length) motivos.push(`Usada nas turmas ${turmas.join(', ')}`);

  const dependentes = db.disciplinas.filter((d) => d.preRequisitos.includes(id)).map((d) => d.nome);
  if (dependentes.length) motivos.push(`É pré-requisito de ${dependentes.join(', ')}`);

  const alunos = db.alunos.filter((a) => a.aprovadas.includes(id)).length;
  if (alunos) motivos.push(`Está no histórico de ${plural(alunos, 'aluno', 'alunos')}`);

  return { podeExcluir: motivos.length === 0, motivos };
}

// ---------- Professores ----------

export function normalizarProfessor(corpo) {
  const nome = texto(corpo?.nome);
  const area = texto(corpo?.area);
  const cargaMaxima = Number(corpo?.cargaMaxima);

  if (nome.length < 3) throw new ErroHttp(400, 'Informe o nome do professor (mínimo de 3 letras)');
  if (area.length < 2) throw new ErroHttp(400, 'Informe a área de atuação do professor');
  if (!Number.isInteger(cargaMaxima) || cargaMaxima < 1 || cargaMaxima > 20) {
    throw new ErroHttp(400, 'A carga máxima deve ser um inteiro entre 1 e 20 horários');
  }
  return { nome, area, cargaMaxima };
}

export function validarProfessor(dados, db, atual = null) {
  if (!atual) return;
  const carga = cargaDoProfessor(atual.id, turmasDoSemestre(db));
  if (dados.cargaMaxima < carga) {
    throw new ErroHttp(409, `${atual.nome} já leciona ${carga} horários; a carga máxima não pode ser menor que isso`);
  }
}

export function usoDoProfessor(id, db) {
  const turmas = db.turmas.filter((t) => t.professorId === id).map((t) => t.codigo);
  const motivos = turmas.length ? [`Leciona as turmas ${turmas.join(', ')}`] : [];
  return { podeExcluir: motivos.length === 0, motivos };
}

// ---------- Alunos ----------

// Histórico coerente: toda disciplina aprovada precisa ter os pré-requisitos também aprovados.
export function validarHistorico(aprovadas, db) {
  const ids = idsUnicos(aprovadas);
  for (const id of ids) {
    if (!db.disciplinas.some((d) => d.id === id)) throw new ErroHttp(400, `Disciplina ${id} não encontrada`);
  }
  for (const id of ids) {
    const disciplina = db.disciplinas.find((d) => d.id === id);
    const faltando = disciplina.preRequisitos.filter((p) => !ids.includes(p));
    if (faltando.length) {
      const nomes = faltando.map((p) => db.disciplinas.find((d) => d.id === p).nome).join(', ');
      throw new ErroHttp(409, `Para marcar ${disciplina.nome} como aprovada, marque antes: ${nomes}`);
    }
  }
  return ids;
}

export function usoDoAluno(id, db) {
  const turmas = db.turmas.filter((t) => t.alunos.includes(id)).map((t) => t.codigo);
  const motivos = turmas.length ? [`Está matriculado nas turmas ${turmas.join(', ')}`] : [];
  return { podeExcluir: motivos.length === 0, motivos };
}
