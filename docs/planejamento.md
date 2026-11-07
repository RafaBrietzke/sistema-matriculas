# MatrículaFácil — Documento de planejamento

**Sistema de Atendimento e Matrículas**

| | |
| --- | --- |
| Atividade acadêmica | Programação Front-End — Análise e Desenvolvimento de Sistemas (UNISINOS) |
| Tema | Desafio: sistema de atendimento e matrículas |
| Autora | Rafaela Brietzke |
| Semestre | 2026/2 |

---

## 1. Visão e escopo

### Problema

Numa instituição de ensino, a oferta de turmas e a matrícula dos alunos costumam esbarrar nos mesmos erros: professor com duas turmas no mesmo horário, professor sobrecarregado, aluno matriculado em turmas com horários conflitantes, sem os pré-requisitos ou em turmas já lotadas. O **MatrículaFácil** organiza a oferta do semestre e impede essas situações, sempre **explicando o motivo** do bloqueio em vez de só mostrar um erro.

### Atores

| Ator | O que faz |
| --- | --- |
| **Instituição** (secretaria/coordenação) | Mantém cursos, disciplinas, professores e alunos; monta a oferta de turmas; abre e fecha o período de matrícula; acompanha a grade geral e a carga dos professores |
| **Aluno** | Consulta as turmas ofertadas, matricula-se, cancela matrículas, vê a grade semanal e imprime o comprovante |

### Escopo

**Incluído:**

- Quatro casos de uso completos (o enunciado pede no mínimo três): cadastros, oferta de turmas, matrícula e grade horária.
- Matriz curricular por curso e etapa, e perfis de professor e de aluno na visão institucional.
- Login simulado por perfil, com rotas protegidas.
- Tema claro e escuro, layout responsivo (computador e celular) e comprovante para impressão.

**Fora do escopo:**

- Autenticação real (senha, tokens, criptografia).
- Banco de dados de verdade e hospedagem em nuvem; os dados ficam num arquivo JSON.
- Notas, frequência e lançamento de histórico pelo professor; visão do professor como usuário.
- Renderização no servidor: toda a interface é feita no navegador (SPA em React), e o servidor só devolve JSON.

---

## 2. Casos de uso

### 2.1 Cadastros base

| | |
| --- | --- |
| **Ator** | Instituição |
| **Objetivo** | Manter cursos, disciplinas, professores e alunos sem deixar o sistema inconsistente |
| **Pré-condição** | Sessão iniciada como Instituição |

**Fluxo principal (disciplina):**

1. A instituição abre **Disciplinas** e vê a tabela com código, nome, créditos, pré-requisitos e número de turmas.
2. Clica em **Nova disciplina**; abre-se um painel lateral.
3. Informa código (`AAA999`), nome, créditos (1 a 12) e marca os pré-requisitos numa lista com busca.
4. Salva; o sistema valida, grava, mostra uma notificação de sucesso e atualiza a lista.

Professores (nome, área, carga máxima de 1 a 20 horários), alunos (nome, curso e histórico de aprovadas) e cursos (nome, sigla, número de etapas e matriz curricular) seguem o mesmo fluxo.

**Fluxos alternativos:**

- **Ciclo de pré-requisitos:** se marcar um pré-requisito criaria um ciclo (A → B → A), a opção aparece desabilitada com o motivo, e a API recusa com 409.
- **Histórico incoerente:** no cadastro do aluno, uma disciplina só pode ser marcada como aprovada se os pré-requisitos dela também estiverem marcados, e não pode ser desmarcada se outra marcada depende dela.
- **Exclusão protegida:** antes de excluir, o sistema consulta onde o registro é usado. Se houver uso (disciplina com turmas, professor com turmas, aluno matriculado, disciplina na matriz de um curso), os motivos são listados e o botão de excluir fica desabilitado.
- **Dados inválidos:** campos fora das regras mostram a mensagem no próprio formulário (validação também feita na API, com resposta 400).

### 2.2 Montar a oferta de turmas

| | |
| --- | --- |
| **Ator** | Instituição |
| **Objetivo** | Ofertar turmas (disciplina + professor + horários + vagas) sem choque de horário e sem sobrecarregar professores |
| **Pré-condição** | Disciplinas e professores cadastrados |

**Fluxo principal:**

1. A instituição abre **Oferta de turmas** e clica em **Nova turma** (ou clica num horário livre da grade geral).
2. Escolhe a disciplina e o professor. A lista de professores vem ordenada da menor para a maior carga.
3. Na grade dia × turno, os horários em que o professor já dá aula aparecem bloqueados, com o motivo.
4. Marca os horários e informa as vagas (1 a 200).
5. Salva; o servidor gera o código da turma (ex.: `ADS101-A`, `ADS101-B`) e grava a turma no semestre atual.

**Fluxos alternativos:**

- **Carga máxima:** se a carga projetada do professor passar do máximo, o botão de salvar é desabilitado com a explicação e a sugestão de outro professor (API: 409).
- **Carga acima da média:** um aviso (que não bloqueia) sugere outro professor.
- **Sugestão de professor:** nos dois casos, e também no choque de horário, o sistema indica o professor com a carga mais livre que ainda comporte os horários marcados sem choque.
- **Turma com alunos:** disciplina e horários ficam travados; as vagas não podem ficar abaixo do número de matriculados.
- **Exclusão:** um modal confirma informando quantos alunos serão desmatriculados.

### 2.3 Matrícula do aluno

| | |
| --- | --- |
| **Ator** | Aluno (e a Instituição, que abre ou fecha o período) |
| **Objetivo** | Montar o semestre escolhendo turmas válidas |
| **Pré-condição** | Sessão iniciada como aluno; turmas ofertadas no semestre |

**Fluxo principal:**

1. O aluno abre **Turmas ofertadas**. Cada turma aparece como *Disponível*, *Matriculado* ou *Indisponível*, e as indisponíveis mostram **todos** os motivos.
2. O topo mostra os créditos já usados em relação ao limite do semestre.
3. Clica em **Matricular**; um modal mostra a disciplina, o professor, os horários, os créditos após a matrícula e uma prévia da grade com a nova turma destacada.
4. Confirma; a matrícula é gravada, aparece uma notificação e a lista é atualizada.
5. Em **Minhas matrículas**, pode cancelar uma matrícula (com confirmação).

**Fluxos alternativos:**

- **Regra violada no servidor:** se outra pessoa lotou a turma nesse meio-tempo, a API responde 409 com o motivo, o front mostra a mensagem e recarrega a lista.
- **Período fechado:** a página vira só consulta, e matricular ou cancelar fica bloqueado.
- **Fora do curso:** por padrão o aluno vê só as turmas do curso dele; o filtro mostra as demais, bloqueadas pela regra 2 da matrícula.

### 2.4 Grade horária visual

| | |
| --- | --- |
| **Ator** | Aluno e Instituição |
| **Objetivo** | Ver a semana montada (dia × turno) |

**Fluxo principal:**

1. O aluno abre **Minha grade** e vê uma tabela de segunda a sábado × manhã/tarde/noite com as turmas em que está matriculado; cada disciplina tem uma cor fixa.
2. Clica em **Imprimir comprovante**; o navegador abre a impressão só com o cabeçalho, a grade, a tabela de turmas e o total de créditos (sempre no tema claro).
3. A instituição abre a **Grade geral** com todas as turmas do semestre e filtra por professor (aparece a barra de carga dele) ou por disciplina.
4. Ao clicar num horário da grade geral, abre o formulário de nova turma já com o horário (e o professor filtrado) preenchido.

**Fluxos alternativos:**

- **Sem matrículas:** aparece um estado vazio com um link para as turmas ofertadas.
- **Celular:** abaixo de 768px a tabela vira uma agenda por dia, sem rolagem lateral.

---

## 3. Regras de negócio

### Oferta de turmas

| Regra | Descrição |
| --- | --- |
| Choque do professor | Um professor não pode ter duas turmas no mesmo horário do semestre |
| Carga máxima | A soma dos horários das turmas do professor não pode passar da carga máxima dele |
| Código da turma | Gerado pelo servidor: código da disciplina + a próxima letra livre (`ADS101-A`, `ADS101-B`, …) |
| Turma protegida | Com alunos matriculados, a disciplina e os horários não mudam, e as vagas não podem ficar abaixo do número de matriculados |

### Matrícula (verificadas nesta ordem)

| # | Bloqueia quando | Exemplo de mensagem |
| --- | --- | --- |
| 1 | O período de matrícula está fechado | "O período de matrícula está fechado" |
| 2 | A disciplina não está na matriz do curso do aluno | "Esta disciplina não faz parte da matriz de Jogos Digitais" |
| 3 | O aluno já foi aprovado na disciplina | "Você já foi aprovado em Algoritmos e Programação" |
| 4 | O aluno já está em outra turma da mesma disciplina | "Você já está na turma ADS101-A desta disciplina" |
| 5 | Falta algum pré-requisito | "Faltam pré-requisitos: Estruturas de Dados, Banco de Dados I" |
| 6 | A turma está lotada | "Turma lotada" |
| 7 | Algum horário coincide com uma turma em que o aluno já está | "Choque de horário com ADS203-A (Ter · Noite)" |
| 8 | Os créditos passariam do limite do semestre | "Passaria do limite de 20 créditos (16 + 4)" |

As mesmas funções calculam os bloqueios que o front exibe e validam a matrícula no servidor. Assim, a tela nunca promete algo que a API vai recusar.

### Cadastros e matriz curricular

| Regra | Descrição |
| --- | --- |
| Sem ciclo | Uma disciplina não pode ser pré-requisito dela mesma, nem direta nem indiretamente |
| Código travado | O código de uma disciplina com turmas não pode mudar (o código da turma depende dele) |
| Carga coerente | A carga máxima de um professor não pode ficar abaixo da carga que ele já tem |
| Histórico coerente | Só se marca uma disciplina como aprovada se os pré-requisitos dela estiverem aprovados |
| Matriz coerente | Um pré-requisito precisa estar na matriz do curso numa etapa anterior |
| Exclusão protegida | Nada é excluído se estiver em uso; o sistema lista os motivos |

### Código de horário

Cada horário é um código `DT`: **D** é o dia (2 = segunda … 7 = sábado) e **T** é o turno (1 = manhã, 2 = tarde, 3 = noite). Exemplo: `33` = terça à noite. Uma turma pode ter um ou mais horários, e os conflitos são calculados pela interseção das listas de códigos.

---

## 4. Telas

Os prints a seguir foram tirados da aplicação em funcionamento, com os dados de demonstração (`npm run seed`).

### Acesso

![Login simulado: escolha entre Instituição e um aluno](telas/01-login.png)

### Visão da instituição

![Painel da instituição: indicadores, pendências, período de matrícula e carga dos professores](telas/02-painel-instituicao.png)

![Oferta de turmas: filtros por curso, professor e turno; ocupação de cada turma](telas/03-turmas.png)

![Formulário de nova turma: grade clicável de horários e resumo](telas/04-formulario-turma.png)

![Grade geral da oferta, com filtros por professor e disciplina](telas/05-grade-geral.png)

![Cursos cadastrados](telas/06-cursos.png)

![Matriz curricular de um curso, organizada por etapa](telas/07-matriz-curso.png)

![Cadastro de disciplinas com pré-requisitos](telas/08-disciplinas.png)

![Cadastro de professores com a carga de cada um](telas/09-professores.png)

![Perfil do professor: carga, turmas e agenda semanal](telas/10-perfil-professor.png)

![Cadastro de alunos com filtro por curso](telas/11-alunos.png)

![Perfil do aluno: concluídas, em curso e faltam cursar](telas/12-perfil-aluno.png)

### Visão do aluno

![Painel do aluno](telas/13-painel-aluno.png)

![Turmas ofertadas com o motivo de cada bloqueio](telas/14-turmas-ofertadas.png)

![Minhas matrículas, com o total de créditos e o cancelamento](telas/15-minhas-matriculas.png)

![Minha grade semanal](telas/16-minha-grade.png)

![Comprovante de matrícula (versão de impressão)](telas/17-comprovante.png)

### Celular e página não encontrada

![Turmas ofertadas no celular](telas/18-mobile-turmas-ofertadas.png) ![Minha grade no celular: agenda por dia](telas/19-mobile-minha-grade.png)

![Página não encontrada (404)](telas/20-nao-encontrada.png)

---

## 5. Mapa de rotas do front-end

| Rota | Tela | Perfil |
| --- | --- | --- |
| `/` | Redireciona para o login ou para a página inicial do perfil | — |
| `/login` | Login simulado | Público |
| `/instituicao` | Painel da instituição | Instituição |
| `/instituicao/cursos` | Cursos | Instituição |
| `/instituicao/cursos/:id` | Matriz curricular do curso | Instituição |
| `/instituicao/disciplinas` | Disciplinas | Instituição |
| `/instituicao/professores` | Professores | Instituição |
| `/instituicao/professores/:id` | Perfil do professor | Instituição |
| `/instituicao/alunos` | Alunos | Instituição |
| `/instituicao/alunos/:id` | Perfil do aluno | Instituição |
| `/instituicao/turmas` | Oferta de turmas | Instituição |
| `/instituicao/turmas/nova` | Nova turma (aceita `?horario=DT&professor=ID`) | Instituição |
| `/instituicao/turmas/:id/editar` | Editar turma | Instituição |
| `/instituicao/grade` | Grade geral | Instituição |
| `/aluno` | Painel do aluno | Aluno |
| `/aluno/turmas` | Turmas ofertadas | Aluno |
| `/aluno/matriculas` | Minhas matrículas | Aluno |
| `/aluno/grade` | Minha grade e comprovante | Aluno |
| `*` | Página não encontrada | — |

As rotas de cada perfil ficam dentro de um componente `RotaProtegida`: sem sessão, a pessoa volta ao login; com o perfil errado, vai para a página inicial do próprio perfil.

---

## 6. Arquitetura

```mermaid
flowchart LR
  subgraph Navegador
    SPA["SPA React<br/>(Vite + React Router + Bootstrap)"]
    LS[("localStorage<br/>sessão e tema")]
  end
  subgraph Servidor["Servidor Node.js"]
    API["API REST Express<br/>/api/..."]
    REG["Regras de negócio<br/>(funções puras)"]
    DB[("db.json")]
  end
  SPA -- "fetch + async/await<br/>JSON" --> API
  API --> REG
  API -- "fs (leitura e gravação)" --> DB
  SPA --- LS
```

- **Sem renderização no servidor:** o Express só responde JSON; todas as telas são montadas pelo React no navegador.
- **Regras no servidor, retorno imediato no front:** o servidor é a fonte da verdade (valida e responde 400/409 com o motivo). O front recebe os bloqueios já calculados para desabilitar botões antes do clique.
- **Um único ponto de acesso HTTP:** todas as chamadas passam por `frontend/src/api/cliente.js`.

### Estrutura de pastas

```
backend/
  data/seed.json          dados de demonstração
  scripts/seed.js         restaura o db.json a partir do seed
  src/app.js              montagem da API (rotas e middlewares)
  src/db.js               leitura e gravação do arquivo JSON
  src/migracoes.js        atualiza um db.json antigo sem perder dados
  src/regras/             regras de negócio (funções puras e testadas)
  src/rotas/              rotas REST por recurso
  test/                   testes automáticos (node:test)
frontend/
  src/api/cliente.js      chamadas HTTP (fetch)
  src/contexto/           sessão e notificações (Context API)
  src/hooks/              useBuscaDados, useTema
  src/componentes/        layout, grade horária, modais, painel lateral…
  src/paginas/            telas da instituição e do aluno
  src/utilitarios/        horários, cores, indicadores
  src/estilos/            tema (claro/escuro) e layout
```

---

## 7. Modelo de dados

| Entidade | Campos |
| --- | --- |
| **Curso** | `id`, `nome`, `sigla`, `etapas`, `matriz: [{ disciplinaId, etapa }]` |
| **Disciplina** | `id`, `codigo` (`AAA999`), `nome`, `creditos`, `preRequisitos: [disciplinaId]` |
| **Professor** | `id`, `nome`, `area`, `cargaMaxima` (horários por semana) |
| **Aluno** | `id`, `matricula` (gerada pelo servidor), `nome`, `cursoId`, `aprovadas: [disciplinaId]` |
| **Turma** | `id`, `codigo` (`ADS101-A`), `disciplinaId`, `professorId`, `semestre`, `horarios: [DT]`, `vagas`, `alunos: [alunoId]` |
| **Configurações** | `semestreAtual`, `periodoMatriculaAberto`, `limiteCreditos` |

```mermaid
erDiagram
  CURSO ||--o{ ALUNO : "tem"
  CURSO }o--o{ DISCIPLINA : "matriz (por etapa)"
  DISCIPLINA }o--o{ DISCIPLINA : "pré-requisito de"
  DISCIPLINA ||--o{ TURMA : "é ofertada em"
  PROFESSOR ||--o{ TURMA : "leciona"
  TURMA }o--o{ ALUNO : "matrícula"
  ALUNO }o--o{ DISCIPLINA : "aprovadas (histórico)"
```

Os dados de demonstração têm 4 cursos, 19 disciplinas, 5 professores, 7 alunos e 10 turmas, com cenários prontos para testar cada regra.

---

## 8. API REST

Base: `http://localhost:3001/api`. Todas as respostas são JSON. Os erros vêm como `{ erro, motivos? }`.

| Método e rota | Finalidade | Respostas |
| --- | --- | --- |
| `GET /cursos`, `/disciplinas`, `/professores`, `/alunos`, `/turmas` | Listar | 200 |
| `GET /<recurso>/:id` | Buscar um registro | 200, 404 |
| `POST /cursos`, `/disciplinas`, `/professores`, `/alunos`, `/turmas` | Cadastrar | 201, 400, 409 |
| `PUT /<recurso>/:id` | Editar | 200, 400, 404, 409 |
| `GET /<recurso>/:id/uso` | Dizer se pode excluir e por quê (`{ podeExcluir, motivos }`) | 200, 404 |
| `DELETE /<recurso>/:id` | Excluir (só se não estiver em uso) | 204, 404, 409 |
| `PUT /cursos/:id/matriz/:disciplinaId` | Incluir ou mudar a etapa de uma disciplina na matriz | 200, 400, 404, 409 |
| `GET /cursos/:id/matriz/:disciplinaId/uso` | Dizer se a disciplina pode sair da matriz | 200, 404 |
| `DELETE /cursos/:id/matriz/:disciplinaId` | Remover a disciplina da matriz | 204, 404, 409 |
| `GET /alunos/proxima-matricula` | Prévia do próximo número de matrícula | 200 |
| `GET /alunos/:id/ofertas` | Turmas do semestre com os bloqueios calculados para o aluno | 200, 404 |
| `POST /turmas/:id/matriculas` | Matricular um aluno (`{ alunoId }`) | 201, 404, 409 |
| `DELETE /turmas/:id/matriculas/:alunoId` | Cancelar a matrícula | 204, 404, 409 |
| `GET /configuracoes` | Semestre, período e limite de créditos | 200 |
| `PUT /configuracoes` | Abrir/fechar o período e mudar o limite de créditos | 200, 400 |

`DELETE /turmas/:id` também remove as matrículas da turma. Os códigos usados são: **400** dado inválido, **404** não encontrado, **409** regra de negócio violada.

---

## 9. Tecnologias e onde são usadas

| Conteúdo da disciplina | Onde aparece no código |
| --- | --- |
| Componentes React e props | `componentes/` (ex.: `GradeHoraria.jsx`, `CartaoIndicador.jsx`, `ModalConfirmacao.jsx`) |
| Estado (`useState`) e formulários controlados | Formulários de `paginas/instituicao/` (ex.: `FormularioTurma.jsx`, `Alunos.jsx`) |
| Efeitos (`useEffect`) | `hooks/useBuscaDados.js`, `hooks/useTema.js`, `componentes/PainelLateral.jsx` |
| Hook personalizado | `hooks/useBuscaDados.js` (carregando / erro / dados / recarregar) |
| Componente de classe e Error Boundary | `componentes/LimiteErro.jsx` (`getDerivedStateFromError` e `componentDidCatch`), que envolve o conteúdo das páginas em `LayoutApp.jsx`: um erro de execução numa tela mostra um aviso, sem derrubar o menu |
| Context API | `contexto/SessaoProvider.jsx` (sessão) e `contexto/NotificacaoProvider.jsx` (notificações) |
| React Router | `App.jsx` (rotas aninhadas), `RotaProtegida.jsx`, `NavLink` na barra lateral, `useParams`, `useSearchParams`, `useNavigate` |
| `fetch` com `async/await` | `api/cliente.js` (único ponto de acesso à API) |
| Bootstrap 5 e Bootstrap Icons | Classes no JSX em todas as telas; tema próprio em `estilos/tema.css` com variáveis CSS e modo escuro (`data-bs-theme`) |
| CSS responsivo e de impressão | `estilos/layout.css` e `@media print` em `estilos/tema.css` |
| `localStorage` | Sessão simulada e preferência de tema |
| Node.js + Express | `backend/src/app.js` e `backend/src/rotas/` (API REST e middleware de erros) |
| Persistência em arquivo | `backend/src/db.js` (`fs/promises`) |

---

## 10. Qualidade

- **Testes automatizados no back-end:** 88 testes com `node:test` (sem bibliotecas extras). Cobrem as regras puras (as 8 regras de matrícula, oferta, cadastros e matriz curricular), as rotas da API em cima de um banco temporário, a leitura e gravação do arquivo, a migração de dados antigos e a coerência do seed. Para rodar: `cd backend && npm test`.
- **Front-end:** o build de produção (`npm run build`) e o lint (`npm run lint`) passam sem erros e sem avisos. Cada caso de uso foi verificado no navegador com um roteiro de cenários, repetido como teste de regressão a cada entrega.
- **Mensagens claras:** toda recusa da API traz o motivo em português, e o front mostra esse motivo no lugar certo (campo, notificação ou cartão da turma).
- **Acessibilidade básica:** rótulos nos campos, `aria-label` nos botões só com ícone, `Esc` fecha o menu, os painéis e os modais, e o foco vai para o botão seguro (Cancelar) quando um modal de confirmação abre.

---

## 11. Processo

O desenvolvimento foi feito em etapas: primeiro a base do projeto (API, dados e navegação), depois a visão da instituição, a visão do aluno e, por fim, a entrega. Antes de programar cada caso de uso, foram definidos os fluxos, as regras de negócio e as decisões de interface (por exemplo, matricular "uma turma por vez" e, nas exclusões, "bloquear mostrando o motivo"). Cada funcionalidade só foi considerada pronta depois de passar pelos testes automatizados e por um roteiro de verificação no navegador. As escolhas técnicas, como validar as regras no servidor e repetir o cálculo no front, ou guardar os dados em JSON, levaram em conta o escopo do desafio e as tecnologias estudadas na disciplina.

---

## 12. Como executar

Pré-requisito: **Node.js 22** ou superior.

```bash
# Terminal 1 — API (porta 3001)
cd backend
npm install
npm run seed     # cria ou restaura os dados de demonstração
npm run dev      # http://localhost:3001/api

# Terminal 2 — front-end (porta 5173)
cd frontend
npm install
npm run dev      # http://localhost:5173
```

Na tela de login, escolha **Instituição** ou um dos alunos. Sugestões de cenários com os dados de demonstração:

- **Camila Torres:** vê turmas bloqueadas por choque de horário, por já ter sido aprovada e por falta de pré-requisito.
- **Gabriela Nunes:** ao se matricular em `ADS203-A`, a turma lota (3/3).
- **Hugo Alves** (Jogos Digitais): as turmas de ADS aparecem bloqueadas por estarem fora do curso dele.
- **Instituição:** ao fechar o período de matrícula no painel, os alunos passam a só consultar.
