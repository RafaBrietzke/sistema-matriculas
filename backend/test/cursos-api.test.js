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
  const pasta = await mkdtemp(path.join(tmpdir(), 'matriculaweb-cursos-'));
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

test('GET /api/cursos/:id devolve a matriz', async () => {
  const { status, corpo } = await chamar('GET', '/cursos/4');
  assert.equal(status, 200);
  assert.equal(corpo.sigla, 'JOG');
  assert.equal(corpo.matriz.length, 5);
});

test('PUT matriz adiciona e muda a etapa, respeitando os pré-requisitos', async () => {
  const adicionada = await chamar('PUT', '/cursos/4/matriz/6', { etapa: 2 });
  assert.equal(adicionada.status, 200);
  assert.deepEqual(adicionada.corpo.matriz.at(-1), { disciplinaId: 6, etapa: 2 });

  const movida = await chamar('PUT', '/cursos/4/matriz/6', { etapa: 3 });
  assert.equal(movida.corpo.matriz.filter((m) => m.disciplinaId === 6).length, 1);
  assert.equal(movida.corpo.matriz.find((m) => m.disciplinaId === 6).etapa, 3);

  const cedo = await chamar('PUT', '/cursos/1/matriz/9', { etapa: 1 });
  assert.equal(cedo.status, 409);
  assert.match(cedo.corpo.erro, /a partir da 3ª/);

  assert.equal((await chamar('PUT', '/cursos/4/matriz/6', { etapa: 0 })).status, 400);
  assert.equal((await chamar('PUT', '/cursos/99/matriz/6', { etapa: 1 })).status, 404);
});

test('DELETE matriz remove só o que não está em uso', async () => {
  const uso = await chamar('GET', '/cursos/4/matriz/18/uso');
  assert.equal(uso.corpo.podeExcluir, false);
  assert.equal((await chamar('DELETE', '/cursos/4/matriz/18')).status, 409);

  assert.deepEqual((await chamar('GET', '/cursos/1/matriz/12/uso')).corpo, { podeExcluir: true, motivos: [] });
  assert.equal((await chamar('DELETE', '/cursos/1/matriz/12')).status, 204);
  assert.equal((await chamar('GET', '/cursos/1')).corpo.matriz.length, 11);
  assert.equal((await chamar('DELETE', '/cursos/1/matriz/12')).status, 404);
});

test('R8: aluno de Jogos Digitais não se matricula em disciplina de ADS', async () => {
  const ofertas = await chamar('GET', '/alunos/7/ofertas');
  assert.equal(ofertas.corpo.curso.sigla, 'JOG');
  const fundamentosWeb = ofertas.corpo.ofertas.find((o) => o.codigo === 'ADS102-A');
  assert.equal(fundamentosWeb.naMatriz, false);
  assert.equal(fundamentosWeb.etapa, null);
  assert.equal(fundamentosWeb.bloqueios[0].tipo, 'fora-do-curso');
  assert.equal(ofertas.corpo.ofertas.find((o) => o.codigo === 'ADS101-A').etapa, 1);

  const matricula = await chamar('POST', '/turmas/7/matriculas', { alunoId: 7 });
  assert.equal(matricula.status, 409);
  assert.match(matricula.corpo.erro, /matriz de Jogos Digitais/);
});

test('CRUD de cursos: criar, editar, aumentar etapas e excluir', async () => {
  const novo = await chamar('POST', '/cursos', { nome: 'Engenharia de Software', sigla: 'es', etapas: 8 });
  assert.equal(novo.status, 201);
  assert.deepEqual(novo.corpo, { id: 5, nome: 'Engenharia de Software', sigla: 'ES', etapas: 8, matriz: [] });
  assert.equal((await chamar('POST', '/cursos', { nome: 'Outro', sigla: 'ADS', etapas: 4 })).status, 409);
  assert.equal((await chamar('POST', '/cursos', { nome: 'Outro', sigla: 'X', etapas: 4 })).status, 400);

  const mais = await chamar('PUT', '/cursos/4', { nome: 'Jogos Digitais', sigla: 'JOG', etapas: 7 });
  assert.equal(mais.corpo.etapas, 7);
  assert.equal(mais.corpo.matriz.length, 5);
  assert.equal((await chamar('PUT', '/cursos/4/matriz/6', { etapa: 7 })).status, 200);

  const menos = await chamar('PUT', '/cursos/4', { nome: 'Jogos Digitais', sigla: 'JOG', etapas: 6 });
  assert.equal(menos.status, 409);
  assert.match(menos.corpo.erro, /7ª etapa ainda tem disciplinas/);

  assert.equal((await chamar('DELETE', '/cursos/1')).status, 409);
  assert.equal((await chamar('DELETE', `/cursos/${novo.corpo.id}`)).status, 204);
  assert.equal((await chamar('GET', `/cursos/${novo.corpo.id}`)).status, 404);
});
