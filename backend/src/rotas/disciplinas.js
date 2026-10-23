import { Router } from 'express';
import { lerDb, salvarDb, proximoId } from '../db.js';
import { normalizarDisciplina, usoDaDisciplina, validarDisciplina } from '../regras/cadastros.js';
import { buscarPorId, registrarExclusao } from './cadastros.js';
import { criarRotasLeitura } from './recursos.js';

export function criarRotasDisciplinas() {
  const rotas = Router();

  rotas.post('/', async (req, res) => {
    const dados = normalizarDisciplina(req.body);
    const db = await lerDb();
    validarDisciplina(dados, db);

    const disciplina = { id: proximoId(db.disciplinas), ...dados };
    db.disciplinas.push(disciplina);
    await salvarDb(db);
    res.status(201).json(disciplina);
  });

  rotas.put('/:id', async (req, res) => {
    const db = await lerDb();
    const disciplina = buscarPorId(db, 'disciplinas', req.params.id);
    const dados = normalizarDisciplina(req.body);
    validarDisciplina(dados, db, disciplina);

    Object.assign(disciplina, dados);
    await salvarDb(db);
    res.json(disciplina);
  });

  registrarExclusao(rotas, 'disciplinas', usoDaDisciplina);
  rotas.use(criarRotasLeitura('disciplinas'));
  return rotas;
}
