import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { criarApp } from '../src/app.js';

const dados = {
  cursos: [{ id: 1, nome: 'ADS' }],
  disciplinas: [{ id: 1, codigo: 'ADS101', nome: 'Algoritmos', creditos: 4, preRequisitos: [] }],
  professores: [{ id: 1, nome: 'Ana', area: 'Programação', cargaMaxima: 4 }],
  alunos: [{ id: 1, matricula: '2026001', nome: 'Bruno', curso: 'ADS', aprovadas: [] }],
  turmas: [{ id: 1, disciplinaId: 1, professorId: 1, semestre: '2026/2', horarios: ['21'], vagas: 10, alunos: [] }],
};

let servidor;
let base;

before(async () => {
  const pasta = await mkdtemp(path.join(tmpdir(), 'matriculaweb-api-'));
  process.env.DB_ARQUIVO = path.join(pasta, 'db.json');
  await writeFile(process.env.DB_ARQUIVO, JSON.stringify(dados));
  servidor = criarApp().listen(0);
  base = `http://localhost:${servidor.address().port}/api`;
});

after(() => servidor.close());

for (const recurso of ['cursos', 'disciplinas', 'professores', 'alunos', 'turmas']) {
  test(`GET /api/${recurso} devolve a lista`, async () => {
    const resposta = await fetch(`${base}/${recurso}`);
    assert.equal(resposta.status, 200);
    assert.deepEqual(await resposta.json(), dados[recurso]);
  });
}

test('GET por id devolve o objeto', async () => {
  const resposta = await fetch(`${base}/alunos/1`);
  assert.equal(resposta.status, 200);
  assert.equal((await resposta.json()).nome, 'Bruno');
});

test('GET por id inexistente devolve 404 com erro', async () => {
  const resposta = await fetch(`${base}/alunos/999`);
  assert.equal(resposta.status, 404);
  assert.match((await resposta.json()).erro, /não encontrad/i);
});

test('rota desconhecida devolve 404 com erro', async () => {
  const resposta = await fetch(`${base}/xyz`);
  assert.equal(resposta.status, 404);
  assert.ok((await resposta.json()).erro);
});

test('aceita requisições do front (CORS)', async () => {
  const resposta = await fetch(`${base}/turmas`, { headers: { Origin: 'http://localhost:5173' } });
  assert.equal(resposta.headers.get('access-control-allow-origin'), 'http://localhost:5173');
});

test('GET /api/alunos/proxima-matricula devolve o próximo número', async () => {
  const resposta = await fetch(`${base}/alunos/proxima-matricula`);
  assert.equal(resposta.status, 200);
  assert.match((await resposta.json()).matricula, /^\d{7}$/);
});

test('POST /api/alunos gera a matrícula no servidor e ignora a enviada', async () => {
  const prevista = (await (await fetch(`${base}/alunos/proxima-matricula`)).json()).matricula;
  const resposta = await fetch(`${base}/alunos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: '  Helena Costa ', curso: 'ADS', matricula: '0000000' }),
  });
  assert.equal(resposta.status, 201);
  const aluno = await resposta.json();
  assert.equal(aluno.nome, 'Helena Costa');
  assert.equal(aluno.matricula, prevista);
  assert.deepEqual(aluno.aprovadas, []);

  const lista = await (await fetch(`${base}/alunos`)).json();
  assert.ok(lista.some((item) => item.id === aluno.id));
});

test('POST /api/alunos sem nome devolve 400 com erro', async () => {
  const resposta = await fetch(`${base}/alunos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: ' ' }),
  });
  assert.equal(resposta.status, 400);
  assert.ok((await resposta.json()).erro);
});

test('POST /api/alunos com curso não cadastrado devolve 400 com erro', async () => {
  const resposta = await fetch(`${base}/alunos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: 'Helena Costa', curso: 'Medicina' }),
  });
  assert.equal(resposta.status, 400);
  assert.match((await resposta.json()).erro, /curso/i);
});
