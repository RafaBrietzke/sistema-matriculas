// Único ponto de acesso HTTP do front: todas as chamadas à API passam por aqui.
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

export async function requisicao(caminho, opcoes = {}) {
  let resposta;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      headers: { 'Content-Type': 'application/json' },
      ...opcoes,
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique se a API está rodando.');
  }

  const corpo = resposta.status === 204 ? null : await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const erro = new Error(corpo?.erro ?? `Erro ${resposta.status} ao acessar a API`);
    erro.status = resposta.status;
    erro.motivos = corpo?.motivos ?? [];
    throw erro;
  }
  return corpo;
}

export function listar(recurso) {
  return requisicao(`/${recurso}`);
}

export function buscar(recurso, id) {
  return requisicao(`/${recurso}/${id}`);
}

export function criar(recurso, dados) {
  return requisicao(`/${recurso}`, { method: 'POST', body: JSON.stringify(dados) });
}

export function atualizar(recurso, id, dados) {
  return requisicao(`/${recurso}/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
}

export function enviar(caminho, dados) {
  return requisicao(caminho, { method: 'POST', body: JSON.stringify(dados) });
}

export function remover(caminho) {
  return requisicao(caminho, { method: 'DELETE' });
}

export function buscarConfiguracoes() {
  return requisicao('/configuracoes');
}

export function salvarConfiguracoes(dados) {
  return requisicao('/configuracoes', { method: 'PUT', body: JSON.stringify(dados) });
}

export function buscarOfertasDoAluno(alunoId) {
  return requisicao(`/alunos/${alunoId}/ofertas`);
}

export function salvarNaMatriz(cursoId, disciplinaId, etapa) {
  return requisicao(`/cursos/${cursoId}/matriz/${disciplinaId}`, { method: 'PUT', body: JSON.stringify({ etapa }) });
}
