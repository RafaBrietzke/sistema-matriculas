import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { bloqueiosDeMatricula, creditosMatriculados, ofertasDoAluno } from '../src/regras/matricula.js';

const seed = JSON.parse(await readFile(new URL('../data/seed.json', import.meta.url), 'utf-8'));
const novoDb = () => structuredClone(seed);
const aluno = (db, id) => db.alunos.find((a) => a.id === id);
const turma = (db, id) => db.turmas.find((t) => t.id === id);
const tipos = (bloqueios) => bloqueios.map((b) => b.tipo);

const BRUNO = 1;
const CAMILA = 2;
const GABRIELA = 6;

test('aluno elegível não tem bloqueios', () => {
  const db = novoDb();
  assert.deepEqual(bloqueiosDeMatricula(aluno(db, GABRIELA), turma(db, 3), db), []);
});

test('turma em que o aluno já está matriculado não tem bloqueios', () => {
  const db = novoDb();
  assert.deepEqual(bloqueiosDeMatricula(aluno(db, CAMILA), turma(db, 3), db), []);
});

test('R1: período fechado bloqueia', () => {
  const db = novoDb();
  db.configuracoes.periodoMatriculaAberto = false;
  const bloqueios = bloqueiosDeMatricula(aluno(db, GABRIELA), turma(db, 3), db);
  assert.deepEqual(tipos(bloqueios), ['periodo']);
});

test('R2: disciplina já aprovada bloqueia', () => {
  const db = novoDb();
  const [bloqueio] = bloqueiosDeMatricula(aluno(db, CAMILA), turma(db, 1), db);
  assert.equal(bloqueio.tipo, 'aprovada');
  assert.match(bloqueio.mensagem, /Algoritmos e Programação/);
});

test('R3: outra turma da mesma disciplina bloqueia', () => {
  const db = novoDb();
  const bloqueios = bloqueiosDeMatricula(aluno(db, BRUNO), turma(db, 9), db);
  assert.deepEqual(tipos(bloqueios), ['mesma-disciplina']);
  assert.match(bloqueios[0].mensagem, /ADS101-A/);
});

test('R4: pré-requisitos faltando são listados pelo nome', () => {
  const db = novoDb();
  const bloqueios = bloqueiosDeMatricula(aluno(db, BRUNO), turma(db, 5), db);
  assert.deepEqual(tipos(bloqueios), ['pre-requisito']);
  assert.match(bloqueios[0].mensagem, /Estruturas de Dados, Banco de Dados I/);
});

test('R5: turma lotada bloqueia', () => {
  const db = novoDb();
  turma(db, 3).alunos.push(GABRIELA);
  const outro = { id: 50, nome: 'Teste', aprovadas: [1, 2] };
  db.alunos.push(outro);
  assert.deepEqual(tipos(bloqueiosDeMatricula(outro, turma(db, 3), db)), ['lotada']);
});

test('R6: choque de horário cita a turma e o horário', () => {
  const db = novoDb();
  const bloqueios = bloqueiosDeMatricula(aluno(db, CAMILA), turma(db, 2), db);
  assert.deepEqual(tipos(bloqueios), ['choque']);
  assert.match(bloqueios[0].mensagem, /ADS203-A .*Ter · Noite/);
});

test('R7: limite de créditos bloqueia e mostra a conta', () => {
  const db = novoDb();
  db.configuracoes.limiteCreditos = 8;
  const bloqueios = bloqueiosDeMatricula(aluno(db, CAMILA), turma(db, 4), db);
  assert.deepEqual(tipos(bloqueios), ['creditos']);
  assert.match(bloqueios[0].mensagem, /8 créditos \(8 \+ 4\)/);
});

test('vários motivos aparecem juntos, na ordem das regras', () => {
  const db = novoDb();
  db.configuracoes.periodoMatriculaAberto = false;
  assert.deepEqual(tipos(bloqueiosDeMatricula(aluno(db, BRUNO), turma(db, 5), db)), ['periodo', 'pre-requisito']);
});

test('creditosMatriculados soma os créditos das turmas do aluno', () => {
  const db = novoDb();
  assert.equal(creditosMatriculados(CAMILA, db), 8);
  assert.equal(creditosMatriculados(GABRIELA, db), 0);
});

test('ofertasDoAluno devolve todas as turmas com status e bloqueios', () => {
  const db = novoDb();
  const resultado = ofertasDoAluno(aluno(db, CAMILA), db);
  assert.equal(resultado.creditosMatriculados, 8);
  assert.deepEqual(resultado.configuracoes, db.configuracoes);
  assert.equal(resultado.ofertas.length, db.turmas.length);

  const frontEnd = resultado.ofertas.find((o) => o.codigo === 'ADS203-A');
  assert.equal(frontEnd.matriculado, true);
  assert.equal(frontEnd.matriculados, 2);
  assert.deepEqual(frontEnd.disciplina, { id: 7, codigo: 'ADS203', nome: 'Programação Front-End', creditos: 4 });
  assert.deepEqual(frontEnd.professor, { id: 4, nome: 'Marcos Oliveira' });

  const estruturas = resultado.ofertas.find((o) => o.codigo === 'ADS201-A');
  assert.equal(estruturas.matriculado, false);
  assert.equal(estruturas.bloqueios[0].tipo, 'choque');
});
