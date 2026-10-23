import { Router } from 'express';
import { lerDb, salvarDb } from '../db.js';
import { ErroHttp } from '../middlewares/erros.js';

export function criarRotasConfiguracoes() {
  const rotas = Router();

  rotas.get('/', async (req, res) => {
    const db = await lerDb();
    res.json(db.configuracoes);
  });

  rotas.put('/', async (req, res) => {
    const { periodoMatriculaAberto, limiteCreditos } = req.body ?? {};
    if (periodoMatriculaAberto !== undefined && typeof periodoMatriculaAberto !== 'boolean') {
      throw new ErroHttp(400, 'Informe se o período de matrícula está aberto (true ou false)');
    }
    if (limiteCreditos !== undefined && (!Number.isInteger(limiteCreditos) || limiteCreditos < 4 || limiteCreditos > 40)) {
      throw new ErroHttp(400, 'O limite de créditos deve ser um inteiro entre 4 e 40');
    }

    const db = await lerDb();
    db.configuracoes = {
      ...db.configuracoes,
      ...(periodoMatriculaAberto !== undefined && { periodoMatriculaAberto }),
      ...(limiteCreditos !== undefined && { limiteCreditos }),
    };
    await salvarDb(db);
    res.json(db.configuracoes);
  });

  return rotas;
}
