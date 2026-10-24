import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  cursosDaDisciplina,
  etapaNoCurso,
  normalizarCurso,
  usoDoCurso,
  usoNaMatriz,
  validarCurso,
  validarEntradaNaMatriz,
} from '../src/regras/matriz.js';

const seed = JSON.parse(await readFile(new URL('../data/seed.json', import.meta.url), 'utf-8'));
const novoDb = () => structuredClone(seed);
const curso = (db, sigla) => db.cursos.find((c) => c.sigla === sigla);

function esperaErro(fn, status, mensagem) {
  assert.throws(fn, (erro) => {
    assert.equal(erro.status, status);
    if (mensagem) assert.match(erro.message, mensagem);
    return true;
  });
}

test('etapaNoCurso e cursosDaDisciplina', () => {
  const db = novoDb();
  assert.equal(etapaNoCurso(curso(db, 'ADS'), 5), 2);
  assert.equal(etapaNoCurso(curso(db, 'JOG'), 9), null);
  assert.deepEqual(cursosDaDisciplina(1, db).map((c) => c.sigla), ['ADS', 'CC', 'SI', 'JOG']);
  assert.deepEqual(cursosDaDisciplina(18, db).map((c) => c.sigla), ['JOG']);
});

test('validarEntradaNaMatriz aceita etapa coerente', () => {
  const db = novoDb();
  assert.equal(validarEntradaNaMatriz(curso(db, 'JOG'), 6, 2, db).nome, 'Banco de Dados I');
  assert.doesNotThrow(() => validarEntradaNaMatriz(curso(db, 'ADS'), 12, 5, db));
});

test('validarEntradaNaMatriz valida a etapa e a disciplina', () => {
  const db = novoDb();
  esperaErro(() => validarEntradaNaMatriz(curso(db, 'JOG'), 6, 0, db), 400, /etapa/);
  esperaErro(() => validarEntradaNaMatriz(curso(db, 'JOG'), 6, 7, db), 400, /entre 1 e 6/);
  esperaErro(() => validarEntradaNaMatriz(curso(db, 'JOG'), 99, 1, db), 400, /não encontrada/);
});

test('pré-requisito precisa estar na matriz e numa etapa anterior', () => {
  const db = novoDb();
  esperaErro(() => validarEntradaNaMatriz(curso(db, 'JOG'), 9, 3, db), 409, /Banco de Dados I não está na matriz de JOG/);
  esperaErro(() => validarEntradaNaMatriz(curso(db, 'ADS'), 9, 2, db), 409, /Estruturas de Dados está na 2ª etapa.*a partir da 3ª/);
});

test('dependentes da disciplina precisam continuar depois dela', () => {
  const db = novoDb();
  esperaErro(() => validarEntradaNaMatriz(curso(db, 'ADS'), 5, 3, db), 409, /Banco de Dados II depende/);
});

test('usoNaMatriz bloqueia remover pré-requisito ou disciplina com alunos do curso', () => {
  const db = novoDb();
  const algoritmosAds = usoNaMatriz(curso(db, 'ADS'), 1, db);
  assert.equal(algoritmosAds.podeExcluir, false);
  assert.match(algoritmosAds.motivos.join(' | '), /pré-requisito de Estruturas de Dados/);
  assert.match(algoritmosAds.motivos.join(' | '), /alunos do curso matriculados em ADS101-A/);

  const gameDesign = usoNaMatriz(curso(db, 'JOG'), 18, db);
  assert.match(gameDesign.motivos.join(' | '), /JOG101-A/);

  assert.deepEqual(usoNaMatriz(curso(db, 'ADS'), 12, db), { podeExcluir: true, motivos: [] });
});

test('normalizarCurso valida nome, sigla e etapas', () => {
  assert.deepEqual(normalizarCurso({ nome: ' Engenharia de Software ', sigla: ' es ', etapas: '8' }), {
    nome: 'Engenharia de Software',
    sigla: 'ES',
    etapas: 8,
  });
  esperaErro(() => normalizarCurso({ nome: 'ES', sigla: 'ES', etapas: 8 }), 400, /nome/);
  esperaErro(() => normalizarCurso({ nome: 'Engenharia', sigla: 'E', etapas: 8 }), 400, /sigla/);
  esperaErro(() => normalizarCurso({ nome: 'Engenharia', sigla: 'ES1', etapas: 8 }), 400, /sigla/);
  esperaErro(() => normalizarCurso({ nome: 'Engenharia', sigla: 'ES', etapas: 13 }), 400, /etapas/);
});

test('validarCurso: nome e sigla únicos, etapas não podem esconder disciplinas', () => {
  const db = novoDb();
  esperaErro(() => validarCurso({ nome: 'jogos digitais', sigla: 'JD', etapas: 4 }, db), 409, /Já existe/);
  esperaErro(() => validarCurso({ nome: 'Jogos 2', sigla: 'ADS', etapas: 4 }, db), 409, /ADS já está em uso/);
  const ads = curso(db, 'ADS');
  assert.doesNotThrow(() => validarCurso({ nome: ads.nome, sigla: 'ADS', etapas: 4 }, db, ads));
  esperaErro(() => validarCurso({ nome: ads.nome, sigla: 'ADS', etapas: 3 }, db, ads), 409, /4ª etapa ainda tem disciplinas/);
});

test('usoDoCurso bloqueia curso com alunos', () => {
  const db = novoDb();
  assert.match(usoDoCurso(1, db).motivos[0], /6 alunos vinculados/);
  assert.deepEqual(usoDoCurso(2, db), { podeExcluir: true, motivos: [] });
});
