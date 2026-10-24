import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { migrarDb } from '../src/migracoes.js';

const seed = JSON.parse(await readFile(new URL('../data/seed.json', import.meta.url), 'utf-8'));

// Simula um db.json salvo antes das turmas com código, das configurações e da matriz curricular.
function dbNoFormatoAntigo() {
  const db = structuredClone(seed);
  delete db.configuracoes;
  for (const turma of db.turmas) delete turma.codigo;
  for (const curso of db.cursos) {
    delete curso.sigla;
    delete curso.matriz;
    delete curso.etapas;
  }
  for (const aluno of db.alunos) {
    aluno.curso = db.cursos.find((c) => c.id === aluno.cursoId).nome;
    delete aluno.cursoId;
  }
  db.alunos.push({ id: 8, matricula: '2026003', nome: 'Aluna Cadastrada', curso: 'Jogos Digitais', aprovadas: [] });
  return db;
}

test('migrarDb completa um banco antigo sem perder dados', () => {
  const db = dbNoFormatoAntigo();
  assert.equal(migrarDb(db), true);

  assert.deepEqual(db.configuracoes, { semestreAtual: '2026/2', periodoMatriculaAberto: true, limiteCreditos: 20 });
  assert.deepEqual(
    db.turmas.map((t) => t.codigo),
    ['ADS101-A', 'ADS201-A', 'ADS203-A', 'ADS202-A', 'ADS301-A', 'ADS204-A', 'ADS102-A', 'ADS303-A', 'ADS101-B', 'JOG101-A'],
  );
  assert.equal(db.alunos.length, 8);
  assert.equal(db.alunos.at(-1).nome, 'Aluna Cadastrada');
});

test('migrarDb converte o curso do aluno em cursoId e cria siglas e matrizes', () => {
  const db = dbNoFormatoAntigo();
  migrarDb(db);

  assert.deepEqual(db.alunos.map((a) => a.cursoId), [1, 1, 1, 1, 1, 1, 4, 4]);
  assert.ok(db.alunos.every((a) => !('curso' in a)));
  assert.deepEqual(db.cursos.map((c) => c.sigla), ['ADS', 'CC', 'SI', 'JOG']);

  const ads = db.cursos[0].matriz;
  assert.equal(ads.length, 12);
  assert.deepEqual(ads.find((m) => m.disciplinaId === 9), { disciplinaId: 9, etapa: 3 });
  assert.deepEqual(db.cursos[1].matriz, []);
  assert.deepEqual(db.cursos.map((c) => c.etapas), [4, 4, 4, 4]);
});

test('migrarDb não altera um banco já atualizado', () => {
  const db = structuredClone(seed);
  assert.equal(migrarDb(db), false);
  assert.deepEqual(db, seed);
});

test('migrarDb cria coleções que faltam', () => {
  const db = { disciplinas: [], professores: [], alunos: [], turmas: [] };
  migrarDb(db);
  assert.deepEqual(db.cursos, []);
  assert.ok(db.configuracoes);
});
