import { Router } from 'express';
import { lerDb } from '../db.js';
import { ErroHttp } from '../middlewares/erros.js';

// Cria as rotas de leitura de uma coleção do db.json (ex.: 'disciplinas').
export function criarRotasLeitura(colecao) {
  const rotas = Router();

  rotas.get('/', async (req, res) => {
    const db = await lerDb();
    res.json(db[colecao]);
  });

  rotas.get('/:id', async (req, res) => {
    const db = await lerDb();
    const item = db[colecao].find((registro) => registro.id === Number(req.params.id));
    if (!item) {
      throw new ErroHttp(404, `Registro ${req.params.id} não encontrado em ${colecao}`);
    }
    res.json(item);
  });

  return rotas;
}
