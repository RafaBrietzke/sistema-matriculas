import { Router } from 'express';
import { lerDb, salvarDb, proximoId } from '../db.js';
import { ErroHttp } from '../middlewares/erros.js';
import { normalizarOferta, proximoCodigoTurma, validarOferta } from '../regras/oferta.js';
import { bloqueiosDeMatricula } from '../regras/matricula.js';
import { criarRotasLeitura } from './recursos.js';

function buscarTurma(db, id) {
  const turma = db.turmas.find((t) => t.id === Number(id));
  if (!turma) throw new ErroHttp(404, `Turma ${id} não encontrada`);
  return turma;
}

export function criarRotasTurmas() {
  const rotas = Router();

  rotas.post('/', async (req, res) => {
    const dados = normalizarOferta(req.body);
    const db = await lerDb();
    const { disciplina } = validarOferta(dados, db);
    const semestre = db.configuracoes.semestreAtual;

    const turma = {
      id: proximoId(db.turmas),
      codigo: proximoCodigoTurma(disciplina, db.turmas, semestre),
      disciplinaId: dados.disciplinaId,
      professorId: dados.professorId,
      semestre,
      horarios: dados.horarios,
      vagas: dados.vagas,
      alunos: [],
    };
    db.turmas.push(turma);
    await salvarDb(db);
    res.status(201).json(turma);
  });

  rotas.put('/:id', async (req, res) => {
    const db = await lerDb();
    const turma = buscarTurma(db, req.params.id);
    const dados = normalizarOferta(req.body);
    const { disciplina } = validarOferta(dados, db, turma);

    if (dados.disciplinaId !== turma.disciplinaId) {
      const outras = db.turmas.filter((t) => t.id !== turma.id);
      turma.codigo = proximoCodigoTurma(disciplina, outras, turma.semestre);
    }
    Object.assign(turma, dados);
    await salvarDb(db);
    res.json(turma);
  });

  rotas.delete('/:id', async (req, res) => {
    const db = await lerDb();
    const turma = buscarTurma(db, req.params.id);
    db.turmas = db.turmas.filter((t) => t.id !== turma.id);
    await salvarDb(db);
    res.status(204).end();
  });

  rotas.post('/:id/matriculas', async (req, res) => {
    const db = await lerDb();
    const turma = buscarTurma(db, req.params.id);
    const aluno = db.alunos.find((a) => a.id === Number(req.body?.alunoId));
    if (!aluno) throw new ErroHttp(404, 'Aluno não encontrado');
    if (turma.alunos.includes(aluno.id)) throw new ErroHttp(409, 'Você já está matriculado nesta turma');

    const bloqueios = bloqueiosDeMatricula(aluno, turma, db);
    if (bloqueios.length > 0) throw new ErroHttp(409, bloqueios[0].mensagem, bloqueios);

    turma.alunos.push(aluno.id);
    await salvarDb(db);
    res.status(201).json(turma);
  });

  rotas.delete('/:id/matriculas/:alunoId', async (req, res) => {
    const db = await lerDb();
    const turma = buscarTurma(db, req.params.id);
    const alunoId = Number(req.params.alunoId);
    if (!turma.alunos.includes(alunoId)) throw new ErroHttp(404, 'Matrícula não encontrada');
    if (!db.configuracoes.periodoMatriculaAberto) throw new ErroHttp(409, 'O período de matrícula está fechado');

    turma.alunos = turma.alunos.filter((id) => id !== alunoId);
    await salvarDb(db);
    res.status(204).end();
  });

  rotas.use(criarRotasLeitura('turmas'));
  return rotas;
}
