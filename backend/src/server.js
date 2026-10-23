import { criarApp } from './app.js';
import { garantirDb } from './db.js';

const PORTA = process.env.PORT ?? 3001;

await garantirDb();

criarApp().listen(PORTA, () => {
  console.log(`API rodando em http://localhost:${PORTA}/api`);
});
