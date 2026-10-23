// Erro com status HTTP. As rotas lançam esse erro e o middleware tratarErros
// transforma em resposta JSON no formato { erro: "mensagem" }.
export class ErroHttp extends Error {
  constructor(status, mensagem, motivos) {
    super(mensagem);
    this.status = status;
    this.motivos = motivos;
  }
}

export function rotaNaoEncontrada(req, res) {
  res.status(404).json({ erro: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
}

// Middleware de erro do Express: precisa ter os 4 parâmetros.
export function tratarErros(err, req, res, next) {
  if (err.status) {
    return res.status(err.status).json({ erro: err.message, ...(err.motivos && { motivos: err.motivos }) });
  }
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
}
