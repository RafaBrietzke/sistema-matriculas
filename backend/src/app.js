import express from 'express';
import cors from 'cors';
import { criarRotasLeitura } from './rotas/recursos.js';
import { criarRotasAlunos } from './rotas/alunos.js';
import { rotaNaoEncontrada, tratarErros } from './middlewares/erros.js';

export const ORIGEM_FRONT = 'http://localhost:5173';

// Monta o app sem iniciar o servidor, para poder ser usado nos testes.
export function criarApp() {
  const app = express();

  app.use(cors({ origin: ORIGEM_FRONT }));
  app.use(express.json());

  app.use('/api/cursos', criarRotasLeitura('cursos'));
  app.use('/api/disciplinas', criarRotasLeitura('disciplinas'));
  app.use('/api/professores', criarRotasLeitura('professores'));
  app.use('/api/alunos', criarRotasAlunos());
  app.use('/api/turmas', criarRotasLeitura('turmas'));

  app.use(rotaNaoEncontrada);
  app.use(tratarErros);

  return app;
}
