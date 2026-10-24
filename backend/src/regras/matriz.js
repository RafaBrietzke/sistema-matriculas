import { ErroHttp } from '../middlewares/erros.js';
import { turmasDoSemestre } from './oferta.js';
import { plural } from './textos.js';

const SIGLA = /^[A-Z]{2,5}$/;

export function etapaNoCurso(curso, disciplinaId) {
  return curso?.matriz?.find((m) => m.disciplinaId === disciplinaId)?.etapa ?? null;
}

export function cursosDaDisciplina(disciplinaId, db) {
  return db.cursos.filter((c) => c.matriz?.some((m) => m.disciplinaId === disciplinaId));
}

// Coloca (ou move) uma disciplina numa etapa da matriz, mantendo a ordem dos pré-requisitos.
export function validarEntradaNaMatriz(curso, disciplinaId, etapa, db) {
  const limite = curso.etapas ?? 10;
  if (!Number.isInteger(etapa) || etapa < 1 || etapa > limite) {
    throw new ErroHttp(400, `A etapa deve ser um inteiro entre 1 e ${limite} (o curso tem ${plural(limite, 'etapa', 'etapas')})`);
  }
  const disciplina = db.disciplinas.find((d) => d.id === disciplinaId);
  if (!disciplina) throw new ErroHttp(400, 'Disciplina não encontrada');

  const outras = curso.matriz.filter((m) => m.disciplinaId !== disciplinaId);
  const nomeDe = (id) => db.disciplinas.find((d) => d.id === id)?.nome;

  for (const pre of disciplina.preRequisitos) {
    const etapaPre = outras.find((m) => m.disciplinaId === pre)?.etapa;
    if (etapaPre === undefined) {
      throw new ErroHttp(409, `O pré-requisito ${nomeDe(pre)} não está na matriz de ${curso.sigla}; adicione-o antes`);
    }
    if (etapaPre >= etapa) {
      throw new ErroHttp(409, `O pré-requisito ${nomeDe(pre)} está na ${etapaPre}ª etapa; coloque ${disciplina.nome} a partir da ${etapaPre + 1}ª`);
    }
  }

  for (const m of outras) {
    const dependente = db.disciplinas.find((d) => d.id === m.disciplinaId);
    if (dependente?.preRequisitos.includes(disciplinaId) && m.etapa <= etapa) {
      throw new ErroHttp(409, `${dependente.nome} depende desta disciplina e está na ${m.etapa}ª etapa; escolha uma etapa anterior`);
    }
  }

  return disciplina;
}

export function usoNaMatriz(curso, disciplinaId, db) {
  const motivos = [];

  const dependentes = curso.matriz
    .map((m) => db.disciplinas.find((d) => d.id === m.disciplinaId))
    .filter((d) => d?.preRequisitos.includes(disciplinaId))
    .map((d) => d.nome);
  if (dependentes.length) motivos.push(`É pré-requisito de ${dependentes.join(', ')} nesta matriz`);

  const alunosDoCurso = db.alunos.filter((a) => a.cursoId === curso.id).map((a) => a.id);
  const turmas = turmasDoSemestre(db)
    .filter((t) => t.disciplinaId === disciplinaId && t.alunos.some((id) => alunosDoCurso.includes(id)))
    .map((t) => t.codigo);
  if (turmas.length) motivos.push(`Há alunos do curso matriculados em ${turmas.join(', ')}`);

  return { podeExcluir: motivos.length === 0, motivos };
}

// ---------- Cursos ----------

export function normalizarCurso(corpo) {
  const nome = typeof corpo?.nome === 'string' ? corpo.nome.trim() : '';
  const sigla = typeof corpo?.sigla === 'string' ? corpo.sigla.trim().toUpperCase() : '';
  const etapas = Number(corpo?.etapas);

  if (nome.length < 3) throw new ErroHttp(400, 'Informe o nome do curso (mínimo de 3 letras)');
  if (!SIGLA.test(sigla)) throw new ErroHttp(400, 'A sigla deve ter de 2 a 5 letras (ex.: ADS)');
  if (!Number.isInteger(etapas) || etapas < 1 || etapas > 12) {
    throw new ErroHttp(400, 'O número de etapas deve ser um inteiro entre 1 e 12');
  }
  return { nome, sigla, etapas };
}

export function validarCurso(dados, db, atual = null) {
  const outros = db.cursos.filter((c) => c.id !== atual?.id);
  if (outros.some((c) => c.nome.toLowerCase() === dados.nome.toLowerCase())) {
    throw new ErroHttp(409, `Já existe um curso chamado ${dados.nome}`);
  }
  if (outros.some((c) => c.sigla === dados.sigla)) throw new ErroHttp(409, `A sigla ${dados.sigla} já está em uso`);

  if (atual) {
    const maiorEtapa = Math.max(0, ...atual.matriz.map((m) => m.etapa));
    if (dados.etapas < maiorEtapa) {
      throw new ErroHttp(409, `A ${maiorEtapa}ª etapa ainda tem disciplinas; mova-as antes de reduzir o curso para ${plural(dados.etapas, 'etapa', 'etapas')}`);
    }
  }
}

export function usoDoCurso(id, db) {
  const alunos = db.alunos.filter((a) => a.cursoId === id).length;
  const motivos = alunos ? [`Tem ${plural(alunos, 'aluno vinculado', 'alunos vinculados')}`] : [];
  return { podeExcluir: motivos.length === 0, motivos };
}
