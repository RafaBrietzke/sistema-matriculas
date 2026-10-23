import { copyFile } from 'node:fs/promises';
import { caminhoDb, caminhoSeed, lerDb } from '../src/db.js';

await copyFile(caminhoSeed(), caminhoDb());

const db = await lerDb();
console.log(
  `Banco restaurado: ${db.cursos.length} cursos, ${db.disciplinas.length} disciplinas, ${db.professores.length} professores, ` +
    `${db.alunos.length} alunos, ${db.turmas.length} turmas`,
);
