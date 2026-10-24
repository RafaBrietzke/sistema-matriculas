import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { criarApp } from '../src/app.js';

const servidor = criarApp().listen(0);
const base = `http://localhost:${servidor.address().port}/api`;
after(() => servidor.close());

beforeEach(async () => {
  const pasta = await mkdtemp(path.join(tmpdir(), 'matriculafacil-cadastros-'));
  process.env.DB_ARQUIVO = path.join(pasta, 'db.json');
  await copyFile(new URL('../data/seed.json', import.meta.url), process.env.DB_ARQUIVO);
});

async function chamar(metodo, caminho, corpo) {
  const resposta = await fetch(base + caminho, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const texto = await resposta.text();
  return { status: resposta.status, corpo: texto ? JSON.parse(texto) : null };
}

test('disciplinas: criar, editar, impedir ciclo e excluir', async () => {
  const nova = await chamar('POST', '/disciplinas', { codigo: 'ads501', nome: 'Compiladores', creditos: 4, preRequisitos: [5] });
  assert.equal(nova.status, 201);
  assert.equal(nova.corpo.codigo, 'ADS501');

  const editada = await chamar('PUT', `/disciplinas/${nova.corpo.id}`, { ...nova.corpo, nome: 'Compiladores I' });
  assert.equal(editada.status, 200);
  assert.equal(editada.corpo.nome, 'Compiladores I');

  const ciclo = await chamar('PUT', '/disciplinas/5', { codigo: 'ADS201', nome: 'Estruturas de Dados', creditos: 4, preRequisitos: [1, nova.corpo.id] });
  assert.equal(ciclo.status, 409);
  assert.match(ciclo.corpo.erro, /ciclo/);

  assert.equal((await chamar('POST', '/disciplinas', { codigo: 'ADS101', nome: 'Repetida', creditos: 4 })).status, 409);
  assert.equal((await chamar('POST', '/disciplinas', { codigo: '1', nome: 'X', creditos: 4 })).status, 400);

  assert.deepEqual((await chamar('GET', `/disciplinas/${nova.corpo.id}/uso`)).corpo, { podeExcluir: true, motivos: [] });
  assert.equal((await chamar('DELETE', `/disciplinas/${nova.corpo.id}`)).status, 204);
  assert.equal((await chamar('GET', `/disciplinas/${nova.corpo.id}`)).status, 404);
});

test('disciplinas: exclusão bloqueada mostra os motivos', async () => {
  const uso = await chamar('GET', '/disciplinas/1/uso');
  assert.equal(uso.corpo.podeExcluir, false);
  assert.equal(uso.corpo.motivos.length, 4);

  const exclusao = await chamar('DELETE', '/disciplinas/1');
  assert.equal(exclusao.status, 409);
  assert.deepEqual(exclusao.corpo.motivos, uso.corpo.motivos);
  assert.equal((await chamar('GET', '/disciplinas/999/uso')).status, 404);
});

test('professores: criar, editar com carga mínima e excluir', async () => {
  const novo = await chamar('POST', '/professores', { nome: 'Paula Reis', area: 'Redes', cargaMaxima: 6 });
  assert.equal(novo.status, 201);

  const ana = await chamar('PUT', '/professores/1', { nome: 'Ana Souza', area: 'Programação', cargaMaxima: 2 });
  assert.equal(ana.status, 409);
  assert.match(ana.corpo.erro, /4 horários/);
  assert.equal((await chamar('PUT', '/professores/1', { nome: 'Ana Souza', area: 'Programação', cargaMaxima: 8 })).corpo.cargaMaxima, 8);

  assert.equal((await chamar('DELETE', '/professores/1')).status, 409);
  assert.equal((await chamar('DELETE', `/professores/${novo.corpo.id}`)).status, 204);
});

test('alunos: cadastrar com histórico, editar e excluir', async () => {
  const novo = await chamar('POST', '/alunos', { nome: 'Helena Costa', cursoId: 1, aprovadas: [1, 2] });
  assert.equal(novo.status, 201);
  assert.deepEqual(novo.corpo.aprovadas, [1, 2]);

  const incoerente = await chamar('PUT', `/alunos/${novo.corpo.id}`, { nome: 'Helena Costa', cursoId: 1, aprovadas: [9] });
  assert.equal(incoerente.status, 409);
  assert.match(incoerente.corpo.erro, /Banco de Dados II/);

  const editado = await chamar('PUT', `/alunos/${novo.corpo.id}`, { nome: 'Helena C. Costa', cursoId: 4, aprovadas: [1, 2, 7], matricula: '0000000' });
  assert.equal(editado.status, 200);
  assert.equal(editado.corpo.matricula, novo.corpo.matricula);
  assert.equal(editado.corpo.cursoId, 4);

  assert.equal((await chamar('DELETE', '/alunos/2')).status, 409);
  assert.equal((await chamar('DELETE', `/alunos/${novo.corpo.id}`)).status, 204);
});
