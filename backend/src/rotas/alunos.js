import { Router } from 'express';
import { lerDb, salvarDb, proximoId } from '../db.js';
import { ErroHttp } from '../middlewares/erros.js';
import { criarRotasLeitura } from './recursos.js';
import { ofertasDoAluno } from '../regras/matricula.js';
import { usoDoAluno, validarHistorico } from '../regras/cadastros.js';
import { buscarPorId, registrarExclusao } from './cadastros.js';

// A matrícula é o ano atual seguido de um sequencial de 3 dígitos (ex.: 2026007).
// Quem gera é sempre o servidor: o número enviado pelo front é ignorado.
export function gerarMatricula(alunos, ano = new Date().getFullYear()) {
  const prefixo = String(ano);
  const maiorSequencial = alunos
    .filter((aluno) => aluno.matricula.startsWith(prefixo))
    .reduce((maior, aluno) => Math.max(maior, Number(aluno.matricula.slice(prefixo.length))), 0);
  return prefixo + String(maiorSequencial + 1).padStart(3, '0');
}

function dadosDoAluno(corpo, db) {
  const nome = corpo?.nome?.trim() ?? '';
  const curso = corpo?.curso?.trim() ?? '';
  if (nome.length < 3) {
    throw new ErroHttp(400, 'Informe o nome completo do aluno (mínimo de 3 letras)');
  }
  if (!db.cursos.some((item) => item.nome === curso)) {
    throw new ErroHttp(400, 'Selecione um dos cursos cadastrados na instituição');
  }
  return { nome, curso, aprovadas: validarHistorico(corpo?.aprovadas ?? [], db) };
}

export function criarRotasAlunos() {
  const rotas = Router();

  // Prévia do número que o próximo aluno cadastrado vai receber.
  rotas.get('/proxima-matricula', async (req, res) => {
    const db = await lerDb();
    res.json({ matricula: gerarMatricula(db.alunos) });
  });

  rotas.post('/', async (req, res) => {
    const db = await lerDb();
    const dados = dadosDoAluno(req.body, db);
    const aluno = {
      id: proximoId(db.alunos),
      matricula: gerarMatricula(db.alunos),
      ...dados,
    };
    db.alunos.push(aluno);
    await salvarDb(db);
    res.status(201).json(aluno);
  });

  // A matrícula nunca muda; só nome, curso e histórico.
  rotas.put('/:id', async (req, res) => {
    const db = await lerDb();
    const aluno = buscarPorId(db, 'alunos', req.params.id);
    Object.assign(aluno, dadosDoAluno(req.body, db));
    await salvarDb(db);
    res.json(aluno);
  });

  registrarExclusao(rotas, 'alunos', usoDoAluno);

  rotas.get('/:id/ofertas', async (req, res) => {
    const db = await lerDb();
    const aluno = db.alunos.find((item) => item.id === Number(req.params.id));
    if (!aluno) throw new ErroHttp(404, `Aluno ${req.params.id} não encontrado`);
    res.json(ofertasDoAluno(aluno, db));
  });

  // GET / e GET /:id vêm das rotas de leitura genéricas.
  rotas.use(criarRotasLeitura('alunos'));
  return rotas;
}
