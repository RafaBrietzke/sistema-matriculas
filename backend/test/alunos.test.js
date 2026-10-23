import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gerarMatricula } from '../src/rotas/alunos.js';

test('gerarMatricula segue o maior sequencial do ano', () => {
  const alunos = [{ matricula: '2026001' }, { matricula: '2026004' }, { matricula: '2025099' }];
  assert.equal(gerarMatricula(alunos, 2026), '2026005');
});

test('gerarMatricula começa em 001 num ano sem alunos', () => {
  assert.equal(gerarMatricula([{ matricula: '2025014' }], 2026), '2026001');
});
