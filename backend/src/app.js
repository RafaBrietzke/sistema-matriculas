import express from 'express';
import cors from 'cors';
import { criarRotasLeitura } from './rotas/recursos.js';
import { criarRotasAlunos } from './rotas/alunos.js';
import { criarRotasTurmas } from './rotas/turmas.js';
import { criarRotasConfiguracoes } from './rotas/configuracoes.js';
import { criarRotasDisciplinas } from './rotas/disciplinas.js';
import { criarRotasProfessores } from './rotas/professores.js';
import { criarRotasCursos } from './rotas/cursos.js';
import { rotaNaoEncontrada, tratarErros } from './middlewares/erros.js';

export const ORIGEM_FRONT = 'http://localhost:5173';

// Monta o app sem iniciar o servidor, para poder ser usado nos testes.
export function criarApp() {
  const app = express();

  app.use(cors({ origin: ORIGEM_FRONT }));
  app.use(express.json());

  app.use('/api/cursos', criarRotasCursos());
  app.use('/api/disciplinas', criarRotasDisciplinas());
  app.use('/api/professores', criarRotasProfessores());
  app.use('/api/alunos', criarRotasAlunos());
  app.use('/api/turmas', criarRotasTurmas());
  app.use('/api/configuracoes', criarRotasConfiguracoes());

  app.use(rotaNaoEncontrada);
  app.use(tratarErros);

  return app;
}
