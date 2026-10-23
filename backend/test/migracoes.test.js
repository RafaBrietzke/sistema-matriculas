import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { migrarDb } from '../src/migracoes.js';

const seed = JSON.parse(await readFile(new URL('../data/seed.json', import.meta.url), 'utf-8'));

function dbNoFormatoAntigo() {
  const db = structuredClone(seed);
  delete db.configuracoes;
  for (const turma of db.turmas) delete turma.codigo;
  db.alunos.push({ id: 7, matricula: '2026002', nome: 'Aluna Cadastrada', curso: 'Jogos Digitais', aprovadas: [] });
  return db;
}

test('migrarDb completa um banco antigo sem perder dados', () => {
  const db = dbNoFormatoAntigo();
  const alterou = migrarDb(db);

  assert.equal(alterou, true);
  assert.deepEqual(db.configuracoes, { semestreAtual: '2026/2', periodoMatriculaAberto: true, limiteCreditos: 20 });
  assert.deepEqual(
    db.turmas.map((t) => t.codigo),
    ['ADS101-A', 'ADS201-A', 'ADS203-A', 'ADS202-A', 'ADS301-A', 'ADS204-A', 'ADS102-A', 'ADS303-A', 'ADS101-B'],
  );
  assert.equal(db.alunos.length, 7);
  assert.equal(db.alunos.at(-1).nome, 'Aluna Cadastrada');
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
