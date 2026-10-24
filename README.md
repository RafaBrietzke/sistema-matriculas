# MatrículaFácil — Sistema de Atendimento e Matrículas

Desafio da Atividade Acadêmica de Programação Front-End (UNISINOS, ADS).

O MatrículaFácil é uma aplicação web em que a **instituição** monta a oferta de turmas (disciplina + professor + horários) e os **alunos** se matriculam nelas. O sistema valida choque de horário, pré-requisitos, vagas e a carga dos professores.

## Tecnologias

| Camada | Tecnologias |
| ------ | ----------- |
| Front-end | React 19, Vite, React Router, Bootstrap 5 + Bootstrap Icons, `fetch` + `async/await`, Context API |
| Back-end | Node.js 22, Express 5, persistência em arquivo JSON |
| Testes | `node:test` (back-end) |

Toda a interface é renderizada no navegador. O back-end só fornece dados em JSON.

## Como executar

Pré-requisito: **Node.js 22** ou superior.

### 1. Back-end (API na porta 3001)

```bash
cd backend
npm install
npm run seed   # cria/restaura os dados de demonstração
npm run dev    # inicia a API em http://localhost:3001/api
```

### 2. Front-end (na porta 5173)

Em outro terminal:

```bash
cd frontend
npm install
npm run dev    # abre em http://localhost:5173
```

### Testes do back-end

```bash
cd backend
npm test
```

## Perfis de acesso

O login é simulado. Na tela inicial, escolha:

- **Instituição**: cadastros, oferta de turmas e grade geral.
- **Um dos alunos**: turmas ofertadas, matrículas e grade pessoal.

Para voltar aos dados originais a qualquer momento, rode `npm run seed` na pasta `backend`.

## Estrutura

```
backend/
  data/seed.json        dados de demonstração
  data/db.json          dados em uso (gerado pelo seed)
  src/app.js            montagem da API (rotas e middlewares)
  src/db.js             leitura e gravação do arquivo JSON
  src/rotas/            rotas da API
  test/                 testes automáticos
frontend/
  src/api/              chamadas HTTP para a API
  src/contexto/         sessão do usuário (Context API)
  src/componentes/      layout, navbar, proteção de rotas e componentes comuns
  src/hooks/            hook de busca de dados
  src/paginas/          telas da aplicação
.specs/                 planejamento (visão, roadmap, especificações e tarefas)
```
