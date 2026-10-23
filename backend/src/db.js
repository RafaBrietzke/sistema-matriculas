// Persistência simples: todos os dados ficam num único arquivo JSON.
// Este é o único módulo que lê ou grava o arquivo.
import { readFile, writeFile, copyFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const pastaDados = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');

export function caminhoDb() {
  return process.env.DB_ARQUIVO ?? path.join(pastaDados, 'db.json');
}

export function caminhoSeed() {
  return process.env.SEED_ARQUIVO ?? path.join(pastaDados, 'seed.json');
}

// Cria o db.json a partir do seed.json quando ele ainda não existe.
export async function garantirDb() {
  try {
    await access(caminhoDb());
  } catch {
    await copyFile(caminhoSeed(), caminhoDb());
  }
}

export async function lerDb() {
  const conteudo = await readFile(caminhoDb(), 'utf-8');
  return JSON.parse(conteudo);
}

export async function salvarDb(db) {
  await writeFile(caminhoDb(), JSON.stringify(db, null, 2));
}

export function proximoId(lista) {
  return lista.reduce((maior, item) => Math.max(maior, item.id), 0) + 1;
}
