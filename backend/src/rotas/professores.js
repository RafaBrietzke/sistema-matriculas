import { Router } from 'express';
import { lerDb, salvarDb, proximoId } from '../db.js';
import { normalizarProfessor, usoDoProfessor, validarProfessor } from '../regras/cadastros.js';
import { buscarPorId, registrarExclusao } from './cadastros.js';
import { criarRotasLeitura } from './recursos.js';

export function criarRotasProfessores() {
  const rotas = Router();

  rotas.post('/', async (req, res) => {
    const dados = normalizarProfessor(req.body);
    const db = await lerDb();

    const professor = { id: proximoId(db.professores), ...dados };
    db.professores.push(professor);
    await salvarDb(db);
    res.status(201).json(professor);
  });

  rotas.put('/:id', async (req, res) => {
    const db = await lerDb();
    const professor = buscarPorId(db, 'professores', req.params.id);
    const dados = normalizarProfessor(req.body);
    validarProfessor(dados, db, professor);

    Object.assign(professor, dados);
    await salvarDb(db);
    res.json(professor);
  });

  registrarExclusao(rotas, 'professores', usoDoProfessor);
  rotas.use(criarRotasLeitura('professores'));
  return rotas;
}
