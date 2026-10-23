import { lerDb, salvarDb } from '../db.js';
import { ErroHttp } from '../middlewares/erros.js';

export function buscarPorId(db, colecao, id) {
  const item = db[colecao].find((registro) => registro.id === Number(id));
  if (!item) throw new ErroHttp(404, `Registro ${id} não encontrado em ${colecao}`);
  return item;
}

// GET /:id/uso informa se o registro pode ser excluído; DELETE /:id só exclui quando ele não está em uso.
export function registrarExclusao(rotas, colecao, funcaoUso) {
  rotas.get('/:id/uso', async (req, res) => {
    const db = await lerDb();
    const item = buscarPorId(db, colecao, req.params.id);
    res.json(funcaoUso(item.id, db));
  });

  rotas.delete('/:id', async (req, res) => {
    const db = await lerDb();
    const item = buscarPorId(db, colecao, req.params.id);
    const uso = funcaoUso(item.id, db);
    if (!uso.podeExcluir) throw new ErroHttp(409, uso.motivos[0], uso.motivos);

    db[colecao] = db[colecao].filter((registro) => registro.id !== item.id);
    await salvarDb(db);
    res.status(204).end();
  });
}
