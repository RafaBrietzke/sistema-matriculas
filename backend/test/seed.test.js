import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const seed = JSON.parse(await readFile(path.join(raiz, 'data', 'seed.json'), 'utf-8'));
const ids = (lista) => new Set(lista.map((item) => item.id));

test('seed tem a massa de dados combinada', () => {
  assert.ok(seed.cursos.length > 0);
  assert.equal(seed.disciplinas.length, 12);
  assert.equal(seed.professores.length, 5);
  assert.equal(seed.alunos.length, 6);
  assert.ok(seed.turmas.length >= 6 && seed.turmas.length <= 8);
});

test('todas as referências do seed existem', () => {
  const disciplinas = ids(seed.disciplinas);
  const professores = ids(seed.professores);
  const alunos = ids(seed.alunos);
  for (const d of seed.disciplinas) d.preRequisitos.forEach((id) => assert.ok(disciplinas.has(id), `pré-requisito ${id}`));
  const cursos = new Set(seed.cursos.map((c) => c.nome));
  for (const a of seed.alunos) assert.ok(cursos.has(a.curso), `curso do aluno ${a.id}`);
  for (const a of seed.alunos) a.aprovadas.forEach((id) => assert.ok(disciplinas.has(id), `aprovada ${id}`));
  for (const t of seed.turmas) {
    assert.ok(disciplinas.has(t.disciplinaId), `turma ${t.id} disciplina`);
    assert.ok(professores.has(t.professorId), `turma ${t.id} professor`);
    t.alunos.forEach((id) => assert.ok(alunos.has(id), `turma ${t.id} aluno ${id}`));
  }
});

test('horários do seed seguem o formato DT (dia 2-7, turno 1-3)', () => {
  for (const t of seed.turmas) t.horarios.forEach((h) => assert.match(h, /^[2-7][1-3]$/, `turma ${t.id}: ${h}`));
});

test('seed respeita vagas, carga dos professores e choques de horário', () => {
  for (const t of seed.turmas) assert.ok(t.alunos.length <= t.vagas, `turma ${t.id} lotada demais`);

  for (const p of seed.professores) {
    const turmas = seed.turmas.filter((t) => t.professorId === p.id);
    const horarios = turmas.flatMap((t) => t.horarios);
    assert.ok(horarios.length <= p.cargaMaxima, `${p.nome} acima da carga`);
    assert.equal(new Set(horarios).size, horarios.length, `${p.nome} com choque de horário`);
  }

  for (const a of seed.alunos) {
    const turmas = seed.turmas.filter((t) => t.alunos.includes(a.id));
    const horarios = turmas.flatMap((t) => t.horarios);
    assert.equal(new Set(horarios).size, horarios.length, `${a.nome} com choque de horário`);
    for (const t of turmas) {
      const disciplina = seed.disciplinas.find((d) => d.id === t.disciplinaId);
      disciplina.preRequisitos.forEach((id) => assert.ok(a.aprovadas.includes(id), `${a.nome} sem pré-requisito de ${disciplina.nome}`));
    }
  }
});

test('npm run seed recria o db.json a partir do seed', async () => {
  const pasta = await mkdtemp(path.join(tmpdir(), 'matriculaweb-seed-'));
  const destino = path.join(pasta, 'db.json');
  await writeFile(destino, '{"alterado": true}');

  const { stdout } = await promisify(execFile)('node', ['scripts/seed.js'], {
    cwd: raiz,
    env: { ...process.env, DB_ARQUIVO: destino },
  });

  assert.deepEqual(JSON.parse(await readFile(destino, 'utf-8')), seed);
  assert.match(stdout, /\d+ cursos, 12 disciplinas, 5 professores, 6 alunos, \d+ turmas/);
});
