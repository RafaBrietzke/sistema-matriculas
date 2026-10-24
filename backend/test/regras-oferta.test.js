import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { descreverHorario, horariosEmComum } from '../src/regras/horarios.js';
import { cargaDoProfessor, normalizarOferta, proximoCodigoTurma, validarOferta } from '../src/regras/oferta.js';

const seed = JSON.parse(await readFile(new URL('../data/seed.json', import.meta.url), 'utf-8'));
const novoDb = () => structuredClone(seed);
const turma = (db, id) => db.turmas.find((t) => t.id === id);

function esperaErro(fn, status, mensagem) {
  assert.throws(fn, (erro) => {
    assert.equal(erro.status, status);
    if (mensagem) assert.match(erro.message, mensagem);
    return true;
  });
}

test('horários: descrição e horários em comum', () => {
  assert.equal(descreverHorario('21'), 'Seg · Manhã');
  assert.equal(descreverHorario('73'), 'Sáb · Noite');
  assert.deepEqual(horariosEmComum(['21', '33'], ['33', '41']), ['33']);
  assert.deepEqual(horariosEmComum(['21'], ['22']), []);
});

test('normalizarOferta converte tipos, remove horários repetidos e ordena', () => {
  const dados = normalizarOferta({ disciplinaId: '6', professorId: 3, horarios: ['42', '22', '42'], vagas: '30' });
  assert.deepEqual(dados, { disciplinaId: 6, professorId: 3, horarios: ['22', '42'], vagas: 30 });
});

test('normalizarOferta recusa campos inválidos com 400', () => {
  const base = { disciplinaId: 6, professorId: 3, horarios: ['22'], vagas: 30 };
  esperaErro(() => normalizarOferta({ ...base, disciplinaId: undefined }), 400, /disciplina/i);
  esperaErro(() => normalizarOferta({ ...base, professorId: 0 }), 400, /professor/i);
  esperaErro(() => normalizarOferta({ ...base, vagas: 0 }), 400, /vagas/i);
  esperaErro(() => normalizarOferta({ ...base, vagas: 201 }), 400, /vagas/i);
  esperaErro(() => normalizarOferta({ ...base, horarios: [] }), 400, /horário/i);
  esperaErro(() => normalizarOferta({ ...base, horarios: ['24'] }), 400, /24/);
  esperaErro(() => normalizarOferta({ ...base, horarios: ['81'] }), 400, /81/);
});

test('cargaDoProfessor soma os horários e pode ignorar uma turma', () => {
  const db = novoDb();
  assert.equal(cargaDoProfessor(1, db.turmas), 4);
  assert.equal(cargaDoProfessor(1, db.turmas, 1), 2);
  assert.equal(cargaDoProfessor(99, db.turmas), 0);
});

test('proximoCodigoTurma usa a próxima letra livre da disciplina', () => {
  const db = novoDb();
  const disciplina = (id) => db.disciplinas.find((d) => d.id === id);
  assert.equal(proximoCodigoTurma(disciplina(1), db.turmas, '2026/2'), 'ADS101-C');
  assert.equal(proximoCodigoTurma(disciplina(3), db.turmas, '2026/2'), 'ADS103-A');
});

test('validarOferta aceita uma turma nova válida', () => {
  const db = novoDb();
  const { disciplina, professor } = validarOferta({ disciplinaId: 3, professorId: 3, horarios: ['31', '51'], vagas: 30 }, db);
  assert.equal(disciplina.nome, 'Matemática Discreta');
  assert.equal(professor.nome, 'Fernanda Rocha');
});

test('validarOferta recusa disciplina ou professor inexistente', () => {
  const db = novoDb();
  esperaErro(() => validarOferta({ disciplinaId: 99, professorId: 1, horarios: ['31'], vagas: 10 }, db), 400, /disciplina/i);
  esperaErro(() => validarOferta({ disciplinaId: 3, professorId: 99, horarios: ['31'], vagas: 10 }, db), 400, /professor/i);
});

test('validarOferta bloqueia choque de horário do professor', () => {
  const db = novoDb();
  esperaErro(
    () => validarOferta({ disciplinaId: 3, professorId: 1, horarios: ['21'], vagas: 10 }, db),
    409,
    /Ana Souza já leciona ADS101-A .*Seg · Manhã/,
  );
});

test('validarOferta bloqueia carga acima da máxima', () => {
  const db = novoDb();
  esperaErro(
    () => validarOferta({ disciplinaId: 3, professorId: 2, horarios: ['31', '51'], vagas: 10 }, db),
    409,
    /Carlos Mendes .*carga máxima \(5 de 4/,
  );
});

test('validarOferta na edição ignora a própria turma', () => {
  const db = novoDb();
  const atual = turma(db, 8);
  assert.doesNotThrow(() => validarOferta({ disciplinaId: 11, professorId: 5, horarios: ['61', '62'], vagas: 25 }, db, atual));
  esperaErro(() => validarOferta({ disciplinaId: 11, professorId: 5, horarios: ['61', '62', '63'], vagas: 25 }, db, atual), 409, /carga/);
});

test('validarOferta protege turma com alunos', () => {
  const db = novoDb();
  const atual = turma(db, 3);
  const base = { disciplinaId: 7, professorId: 4, horarios: ['33'], vagas: 3 };
  esperaErro(() => validarOferta({ ...base, disciplinaId: 2 }, db, atual), 409, /disciplina/i);
  esperaErro(() => validarOferta({ ...base, horarios: ['31'] }, db, atual), 409, /horários/i);
  esperaErro(() => validarOferta({ ...base, vagas: 1 }, db, atual), 409, /2 alunos/);
  esperaErro(() => validarOferta({ ...base, professorId: 1 }, db, atual), 409, /Ana Souza já leciona ADS201-A/);
  assert.doesNotThrow(() => validarOferta({ ...base, professorId: 3, vagas: 10 }, db, atual));
});
