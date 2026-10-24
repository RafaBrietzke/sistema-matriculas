// Menus da barra lateral de cada perfil, agrupados em seções.
export const menus = {
  instituicao: [
    {
      secao: 'Geral',
      itens: [{ para: '/instituicao', texto: 'Painel', icone: 'bi-grid-1x2', fim: true }],
    },
    {
      secao: 'Cadastros',
      itens: [
        { para: '/instituicao/cursos', texto: 'Cursos', icone: 'bi-diagram-3' },
        { para: '/instituicao/disciplinas', texto: 'Disciplinas', icone: 'bi-journal-bookmark' },
        { para: '/instituicao/professores', texto: 'Professores', icone: 'bi-person-badge' },
        { para: '/instituicao/alunos', texto: 'Alunos', icone: 'bi-mortarboard' },
      ],
    },
    {
      secao: 'Oferta',
      itens: [
        { para: '/instituicao/turmas', texto: 'Oferta de turmas', icone: 'bi-collection' },
        { para: '/instituicao/grade', texto: 'Grade geral', icone: 'bi-calendar3' },
      ],
    },
  ],
  aluno: [
    {
      secao: 'Geral',
      itens: [{ para: '/aluno', texto: 'Início', icone: 'bi-house', fim: true }],
    },
    {
      secao: 'Matrícula',
      itens: [
        { para: '/aluno/turmas', texto: 'Turmas ofertadas', icone: 'bi-search' },
        { para: '/aluno/matriculas', texto: 'Minhas matrículas', icone: 'bi-check2-square' },
        { para: '/aluno/grade', texto: 'Minha grade', icone: 'bi-calendar3' },
      ],
    },
  ],
};

export const rotulosPerfil = { instituicao: 'Instituição', aluno: 'Aluno' };

// Título da seção atual, a partir do caminho da URL (usado na barra superior).
export function tituloDaRota(perfil, caminho) {
  const itens = menus[perfil].flatMap((grupo) => grupo.itens);
  const item = itens.find((i) => i.para === caminho) ?? itens.find((i) => !i.fim && caminho.startsWith(i.para));
  return item?.texto ?? '';
}
