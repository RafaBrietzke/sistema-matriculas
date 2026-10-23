import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { garantirDb, lerDb, salvarDb, proximoId } from '../src/db.js';

const seed = { disciplinas: [{ id: 1, nome: 'Algoritmos' }], professores: [], alunos: [], turmas: [] };

beforeEach(async () => {
  const pasta = await mkdtemp(path.join(tmpdir(), 'matriculaweb-'));
  process.env.SEED_ARQUIVO = path.join(pasta, 'seed.json');
  process.env.DB_ARQUIVO = path.join(pasta, 'db.json');
  await writeFile(process.env.SEED_ARQUIVO, JSON.stringify(seed));
});

test('garantirDb cria o db a partir do seed quando ele não existe', async () => {
  await garantirDb();
  assert.deepEqual(await lerDb(), seed);
});

test('garantirDb não sobrescreve um db existente', async () => {
  await writeFile(process.env.DB_ARQUIVO, JSON.stringify({ ...seed, turmas: [{ id: 9 }] }));
  await garantirDb();
  const db = await lerDb();
  assert.deepEqual(db.turmas, [{ id: 9 }]);
});

test('salvarDb grava os dados que lerDb devolve', async () => {
  const novo = { ...seed, alunos: [{ id: 1, nome: 'Bruno' }] };
  await salvarDb(novo);
  assert.deepEqual(await lerDb(), novo);
  assert.match(await readFile(process.env.DB_ARQUIVO, 'utf-8'), /\n {2}"/, 'arquivo deve ficar indentado');
});

test('proximoId devolve o maior id + 1', () => {
  assert.equal(proximoId([]), 1);
  assert.equal(proximoId([{ id: 3 }, { id: 7 }]), 8);
});
