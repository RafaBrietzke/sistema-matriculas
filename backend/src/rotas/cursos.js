import { Router } from 'express';
import { lerDb, salvarDb, proximoId } from '../db.js';
import { ErroHttp } from '../middlewares/erros.js';
import { normalizarCurso, usoDoCurso, usoNaMatriz, validarCurso, validarEntradaNaMatriz } from '../regras/matriz.js';
import { buscarPorId, registrarExclusao } from './cadastros.js';
import { criarRotasLeitura } from './recursos.js';

function entradaDaMatriz(curso, disciplinaId) {
  const entrada = curso.matriz.find((m) => m.disciplinaId === Number(disciplinaId));
  if (!entrada) throw new ErroHttp(404, `A disciplina ${disciplinaId} não está na matriz de ${curso.sigla}`);
  return entrada;
}

export function criarRotasCursos() {
  const rotas = Router();

  rotas.post('/', async (req, res) => {
    const dados = normalizarCurso(req.body);
    const db = await lerDb();
    validarCurso(dados, db);

    const curso = { id: proximoId(db.cursos), ...dados, matriz: [] };
    db.cursos.push(curso);
    await salvarDb(db);
    res.status(201).json(curso);
  });

  rotas.put('/:id', async (req, res) => {
    const db = await lerDb();
    const curso = buscarPorId(db, 'cursos', req.params.id);
    const dados = normalizarCurso(req.body);
    validarCurso(dados, db, curso);

    Object.assign(curso, dados);
    await salvarDb(db);
    res.json(curso);
  });

  registrarExclusao(rotas, 'cursos', usoDoCurso);

  // Adiciona a disciplina à matriz ou muda a etapa dela.
  rotas.put('/:id/matriz/:disciplinaId', async (req, res) => {
    const db = await lerDb();
    const curso = buscarPorId(db, 'cursos', req.params.id);
    const disciplinaId = Number(req.params.disciplinaId);
    validarEntradaNaMatriz(curso, disciplinaId, Number(req.body?.etapa), db);

    const etapa = Number(req.body.etapa);
    const existente = curso.matriz.find((m) => m.disciplinaId === disciplinaId);
    if (existente) existente.etapa = etapa;
    else curso.matriz.push({ disciplinaId, etapa });

    await salvarDb(db);
    res.json(curso);
  });

  rotas.get('/:id/matriz/:disciplinaId/uso', async (req, res) => {
    const db = await lerDb();
    const curso = buscarPorId(db, 'cursos', req.params.id);
    const entrada = entradaDaMatriz(curso, req.params.disciplinaId);
    res.json(usoNaMatriz(curso, entrada.disciplinaId, db));
  });

  rotas.delete('/:id/matriz/:disciplinaId', async (req, res) => {
    const db = await lerDb();
    const curso = buscarPorId(db, 'cursos', req.params.id);
    const entrada = entradaDaMatriz(curso, req.params.disciplinaId);
    const uso = usoNaMatriz(curso, entrada.disciplinaId, db);
    if (!uso.podeExcluir) throw new ErroHttp(409, uso.motivos[0], uso.motivos);

    curso.matriz = curso.matriz.filter((m) => m !== entrada);
    await salvarDb(db);
    res.status(204).end();
  });

  rotas.use(criarRotasLeitura('cursos'));
  return rotas;
}
