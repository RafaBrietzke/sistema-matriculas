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
  assert.equal(seed.disciplinas.length, 19);
  assert.equal(seed.professores.length, 5);
  assert.equal(seed.alunos.length, 7);
  assert.ok(seed.turmas.length >= 6 && seed.turmas.length <= 10);
  assert.deepEqual(seed.configuracoes, { semestreAtual: '2026/2', periodoMatriculaAberto: true, limiteCreditos: 20 });
});

test('todas as referências do seed existem', () => {
  const disciplinas = ids(seed.disciplinas);
  const professores = ids(seed.professores);
  const alunos = ids(seed.alunos);
  for (const d of seed.disciplinas) d.preRequisitos.forEach((id) => assert.ok(disciplinas.has(id), `pré-requisito ${id}`));
  const cursos = ids(seed.cursos);
  for (const a of seed.alunos) assert.ok(cursos.has(a.cursoId), `curso do aluno ${a.id}`);
  for (const c of seed.cursos) c.matriz.forEach((m) => assert.ok(disciplinas.has(m.disciplinaId), `matriz ${c.sigla}: ${m.disciplinaId}`));
  for (const a of seed.alunos) a.aprovadas.forEach((id) => assert.ok(disciplinas.has(id), `aprovada ${id}`));
  for (const t of seed.turmas) {
    const disciplina = seed.disciplinas.find((d) => d.id === t.disciplinaId);
    assert.match(t.codigo, new RegExp(`^${disciplina?.codigo}-[A-Z]$`), `turma ${t.id} código`);
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

test('matrizes do seed são coerentes com os pré-requisitos e as matrículas', () => {
  for (const curso of seed.cursos) {
    assert.ok(curso.matriz.every((m) => m.etapa >= 1 && m.etapa <= curso.etapas), `${curso.sigla}: etapa fora do número de etapas`);
    const etapa = new Map(curso.matriz.map((m) => [m.disciplinaId, m.etapa]));
    for (const m of curso.matriz) {
      const disciplina = seed.disciplinas.find((d) => d.id === m.disciplinaId);
      for (const pre of disciplina.preRequisitos) {
        assert.ok(etapa.has(pre), `${curso.sigla}: pré-requisito ${pre} de ${disciplina.codigo} fora da matriz`);
        assert.ok(etapa.get(pre) < m.etapa, `${curso.sigla}: ${disciplina.codigo} na mesma etapa ou antes do pré-requisito ${pre}`);
      }
    }
  }
  for (const turma of seed.turmas) {
    for (const alunoId of turma.alunos) {
      const aluno = seed.alunos.find((a) => a.id === alunoId);
      const curso = seed.cursos.find((c) => c.id === aluno.cursoId);
      assert.ok(curso.matriz.some((m) => m.disciplinaId === turma.disciplinaId), `${aluno.nome} em ${turma.codigo} fora da matriz`);
    }
  }
});

test('npm run seed recria o db.json a partir do seed', async () => {
  const pasta = await mkdtemp(path.join(tmpdir(), 'matriculafacil-seed-'));
  const destino = path.join(pasta, 'db.json');
  await writeFile(destino, '{"alterado": true}');

  const { stdout } = await promisify(execFile)('node', ['scripts/seed.js'], {
    cwd: raiz,
    env: { ...process.env, DB_ARQUIVO: destino },
  });

  assert.deepEqual(JSON.parse(await readFile(destino, 'utf-8')), seed);
  assert.match(stdout, /4 cursos, 19 disciplinas, 5 professores, 7 alunos, \d+ turmas/);
});
