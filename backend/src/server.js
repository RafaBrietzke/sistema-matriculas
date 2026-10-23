import { criarApp } from './app.js';
import { garantirDb, lerDb, salvarDb } from './db.js';
import { migrarDb } from './migracoes.js';

const PORTA = process.env.PORT ?? 3001;

await garantirDb();

const db = await lerDb();
if (migrarDb(db)) {
  await salvarDb(db);
  console.log('db.json atualizado para o formato atual (dados preservados)');
}

criarApp().listen(PORTA, () => {
  console.log(`API rodando em http://localhost:${PORTA}/api`);
});
