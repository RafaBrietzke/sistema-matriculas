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
  const pasta = await mkdtemp(path.join(tmpdir(), 'matriculaweb-turmas-'));
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

const novaTurma = { disciplinaId: 3, professorId: 3, horarios: ['51', '31'], vagas: 30 };

test('GET/PUT /api/configuracoes', async () => {
  assert.deepEqual((await chamar('GET', '/configuracoes')).corpo, {
    semestreAtual: '2026/2',
    periodoMatriculaAberto: true,
    limiteCreditos: 20,
  });
  const { status, corpo } = await chamar('PUT', '/configuracoes', { periodoMatriculaAberto: false, limiteCreditos: 12 });
  assert.equal(status, 200);
  assert.equal(corpo.periodoMatriculaAberto, false);
  assert.equal(corpo.limiteCreditos, 12);
  assert.equal(corpo.semestreAtual, '2026/2');
  assert.equal((await chamar('PUT', '/configuracoes', { limiteCreditos: 2 })).status, 400);
  assert.equal((await chamar('PUT', '/configuracoes', { periodoMatriculaAberto: 'sim' })).status, 400);
});

test('POST /api/turmas cria a turma com código e semestre', async () => {
  const { status, corpo } = await chamar('POST', '/turmas', novaTurma);
  assert.equal(status, 201);
  assert.equal(corpo.codigo, 'ADS103-A');
  assert.equal(corpo.semestre, '2026/2');
  assert.deepEqual(corpo.horarios, ['31', '51']);
  assert.deepEqual(corpo.alunos, []);
  assert.equal((await chamar('GET', `/turmas/${corpo.id}`)).status, 200);
});

test('POST /api/turmas valida formato (400) e regras (409)', async () => {
  assert.equal((await chamar('POST', '/turmas', { ...novaTurma, horarios: [] })).status, 400);
  const choque = await chamar('POST', '/turmas', { ...novaTurma, professorId: 1, horarios: ['21'] });
  assert.equal(choque.status, 409);
  assert.match(choque.corpo.erro, /já leciona ADS101-A/);
  const carga = await chamar('POST', '/turmas', { ...novaTurma, professorId: 2 });
  assert.equal(carga.status, 409);
  assert.match(carga.corpo.erro, /carga máxima/);
});

test('PUT /api/turmas/:id edita e protege turma com alunos', async () => {
  const semAlunos = await chamar('PUT', '/turmas/8', { disciplinaId: 11, professorId: 5, horarios: ['61', '62'], vagas: 40 });
  assert.equal(semAlunos.status, 200);
  assert.equal(semAlunos.corpo.vagas, 40);
  assert.equal(semAlunos.corpo.codigo, 'ADS303-A');

  const trocaDisciplina = await chamar('PUT', '/turmas/8', { disciplinaId: 3, professorId: 5, horarios: ['61', '62'], vagas: 40 });
  assert.equal(trocaDisciplina.corpo.codigo, 'ADS103-A');

  const comAlunos = await chamar('PUT', '/turmas/3', { disciplinaId: 7, professorId: 4, horarios: ['31'], vagas: 3 });
  assert.equal(comAlunos.status, 409);
  assert.equal((await chamar('PUT', '/turmas/999', novaTurma)).status, 404);
});

test('DELETE /api/turmas/:id remove a turma', async () => {
  assert.equal((await chamar('DELETE', '/turmas/3')).status, 204);
  assert.equal((await chamar('GET', '/turmas/3')).status, 404);
  assert.equal((await chamar('DELETE', '/turmas/3')).status, 404);
});

test('GET /api/alunos/:id/ofertas devolve ofertas com bloqueios', async () => {
  const { status, corpo } = await chamar('GET', '/alunos/2/ofertas');
  assert.equal(status, 200);
  assert.equal(corpo.creditosMatriculados, 8);
  assert.equal(corpo.ofertas.length, 10);
  assert.equal(corpo.ofertas.find((o) => o.codigo === 'ADS201-A').bloqueios[0].tipo, 'choque');
  assert.equal((await chamar('GET', '/alunos/999/ofertas')).status, 404);
});

test('POST /api/turmas/:id/matriculas matricula o aluno', async () => {
  const { status, corpo } = await chamar('POST', '/turmas/3/matriculas', { alunoId: 6 });
  assert.equal(status, 201);
  assert.deepEqual(corpo.alunos, [2, 3, 6]);

  const lotada = await chamar('POST', '/turmas/3/matriculas', { alunoId: 1 });
  assert.equal(lotada.status, 409);
  assert.deepEqual(
    lotada.corpo.motivos.map((m) => m.tipo),
    ['pre-requisito', 'lotada'],
  );
  assert.equal(lotada.corpo.erro, lotada.corpo.motivos[0].mensagem);

  const repetida = await chamar('POST', '/turmas/3/matriculas', { alunoId: 6 });
  assert.equal(repetida.status, 409);
  assert.match(repetida.corpo.erro, /já está matriculado/);
});

test('POST /api/turmas/:id/matriculas recusa aluno ou turma inexistente', async () => {
  assert.equal((await chamar('POST', '/turmas/3/matriculas', { alunoId: 999 })).status, 404);
  assert.equal((await chamar('POST', '/turmas/999/matriculas', { alunoId: 1 })).status, 404);
});

test('DELETE /api/turmas/:id/matriculas/:alunoId cancela a matrícula', async () => {
  assert.equal((await chamar('DELETE', '/turmas/3/matriculas/2')).status, 204);
  assert.deepEqual((await chamar('GET', '/turmas/3')).corpo.alunos, [3]);
  assert.equal((await chamar('DELETE', '/turmas/3/matriculas/2')).status, 404);
});

test('com o período fechado não é possível matricular nem cancelar', async () => {
  await chamar('PUT', '/configuracoes', { periodoMatriculaAberto: false });
  const matricula = await chamar('POST', '/turmas/3/matriculas', { alunoId: 6 });
  assert.equal(matricula.status, 409);
  assert.match(matricula.corpo.erro, /período/);
  assert.equal((await chamar('DELETE', '/turmas/3/matriculas/2')).status, 409);
});
