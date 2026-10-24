import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  normalizarDisciplina,
  normalizarProfessor,
  usoDaDisciplina,
  usoDoAluno,
  usoDoProfessor,
  validarDisciplina,
  validarHistorico,
  validarProfessor,
} from '../src/regras/cadastros.js';

const seed = JSON.parse(await readFile(new URL('../data/seed.json', import.meta.url), 'utf-8'));
const novoDb = () => structuredClone(seed);
const disciplina = (db, id) => db.disciplinas.find((d) => d.id === id);

function esperaErro(fn, status, mensagem) {
  assert.throws(fn, (erro) => {
    assert.equal(erro.status, status);
    if (mensagem) assert.match(erro.message, mensagem);
    return true;
  });
}

test('normalizarDisciplina converte e valida o formato', () => {
  assert.deepEqual(normalizarDisciplina({ codigo: ' ads501 ', nome: ' Compiladores ', creditos: '4', preRequisitos: ['5', 5, 9] }), {
    codigo: 'ADS501',
    nome: 'Compiladores',
    creditos: 4,
    preRequisitos: [5, 9],
  });
  const base = { codigo: 'ADS501', nome: 'Compiladores', creditos: 4, preRequisitos: [] };
  esperaErro(() => normalizarDisciplina({ ...base, codigo: 'X1' }), 400, /código/i);
  esperaErro(() => normalizarDisciplina({ ...base, nome: 'ab' }), 400, /nome/i);
  esperaErro(() => normalizarDisciplina({ ...base, creditos: 0 }), 400, /créditos/i);
  esperaErro(() => normalizarDisciplina({ ...base, creditos: 13 }), 400, /créditos/i);
});

test('validarDisciplina: código único e pré-requisitos existentes', () => {
  const db = novoDb();
  const base = { codigo: 'ADS501', nome: 'Compiladores', creditos: 4, preRequisitos: [5] };
  assert.doesNotThrow(() => validarDisciplina(base, db));
  esperaErro(() => validarDisciplina({ ...base, codigo: 'ADS101' }, db), 409, /ADS101 já está em uso/);
  esperaErro(() => validarDisciplina({ ...base, preRequisitos: [99] }, db), 400, /pré-requisito/i);
  assert.doesNotThrow(() => validarDisciplina({ ...base, codigo: 'ADS101', preRequisitos: [] }, db, disciplina(db, 1)));
});

test('validarDisciplina impede auto-referência e ciclos', () => {
  const db = novoDb();
  const algoritmos = disciplina(db, 1);
  esperaErro(() => validarDisciplina({ ...algoritmos, preRequisitos: [1] }, db, algoritmos), 409, /dela mesma/);
  esperaErro(() => validarDisciplina({ ...algoritmos, preRequisitos: [9] }, db, algoritmos), 409, /ciclo.*Banco de Dados II/i);
});

test('validarDisciplina trava o código de disciplina com turmas', () => {
  const db = novoDb();
  const algoritmos = disciplina(db, 1);
  esperaErro(() => validarDisciplina({ ...algoritmos, codigo: 'ADS100' }, db, algoritmos), 409, /turmas/);
  const discreta = disciplina(db, 3);
  assert.doesNotThrow(() => validarDisciplina({ ...discreta, codigo: 'ADS105' }, db, discreta));
});

test('normalizarProfessor e validarProfessor (carga mínima = carga atual)', () => {
  const db = novoDb();
  assert.deepEqual(normalizarProfessor({ nome: ' Paula Reis ', area: ' Redes ', cargaMaxima: '6' }), {
    nome: 'Paula Reis',
    area: 'Redes',
    cargaMaxima: 6,
  });
  esperaErro(() => normalizarProfessor({ nome: 'Paula', area: 'R', cargaMaxima: 6 }), 400, /área/i);
  esperaErro(() => normalizarProfessor({ nome: 'Paula', area: 'Redes', cargaMaxima: 21 }), 400, /carga/i);
  const ana = db.professores.find((p) => p.id === 1);
  esperaErro(() => validarProfessor({ ...ana, cargaMaxima: 3 }, db, ana), 409, /já leciona 4 horários/);
  assert.doesNotThrow(() => validarProfessor({ ...ana, cargaMaxima: 4 }, db, ana));
});

test('validarHistorico exige disciplinas existentes e coerência de pré-requisitos', () => {
  const db = novoDb();
  assert.deepEqual(validarHistorico(['1', 5, 1], db), [1, 5]);
  esperaErro(() => validarHistorico([99], db), 400, /não encontrada/);
  esperaErro(() => validarHistorico([9], db), 409, /Banco de Dados II.*Estruturas de Dados, Banco de Dados I/);
  assert.deepEqual(validarHistorico([1, 5, 6, 9], db), [1, 5, 6, 9]);
});

test('uso da disciplina: turmas, pré-requisito e histórico', () => {
  const db = novoDb();
  const algoritmos = usoDaDisciplina(1, db);
  assert.equal(algoritmos.podeExcluir, false);
  assert.match(algoritmos.motivos.join(' | '), /turmas ADS101-A, ADS101-B/);
  assert.match(algoritmos.motivos.join(' | '), /pré-requisito de/);
  assert.match(algoritmos.motivos.join(' | '), /histórico de 5 alunos/);
  assert.match(algoritmos.motivos.join(' | '), /matriz de ADS, CC, SI, JOG/);

  db.disciplinas.push({ id: 99, codigo: 'XYZ999', nome: 'Avulsa', creditos: 2, preRequisitos: [] });
  assert.deepEqual(usoDaDisciplina(99, db), { podeExcluir: true, motivos: [] });
});

test('uso do professor e do aluno', () => {
  const db = novoDb();
  assert.match(usoDoProfessor(1, db).motivos[0], /ADS101-A, ADS201-A/);
  db.professores.push({ id: 9, nome: 'Novo', area: 'X', cargaMaxima: 2 });
  assert.equal(usoDoProfessor(9, db).podeExcluir, true);

  assert.match(usoDoAluno(2, db).motivos[0], /ADS203-A, ADS204-A/);
  assert.equal(usoDoAluno(6, db).podeExcluir, true);
});
