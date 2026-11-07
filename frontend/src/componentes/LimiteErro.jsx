import { Component } from 'react';
import { Link } from 'react-router-dom';
import EstadoVazio from './EstadoVazio';

export default class LimiteErro extends Component {
  constructor(props) {
    super(props);
    this.state = { erro: null };
  }

  static getDerivedStateFromError(erro) {
    return { erro };
  }

  componentDidCatch(erro, info) {
    console.error('Erro na tela:', erro, info.componentStack);
  }

  render() {
    if (!this.state.erro) return this.props.children;

    return (
      <div className="card border-danger-subtle" role="alert">
        <EstadoVazio
          icone="bi-exclamation-octagon"
          cor="danger"
          titulo="Algo deu errado nesta tela"
          descricao="Um erro inesperado impediu que a página fosse exibida. Tente de novo ou volte ao início."
          acao={
            <div className="d-flex gap-2 justify-content-center">
              <button type="button" className="btn btn-outline-danger" onClick={() => this.setState({ erro: null })}>
                <i className="bi bi-arrow-clockwise me-1" aria-hidden="true" />
                Tentar novamente
              </button>
              <Link to="/" className="btn btn-primary">
                <i className="bi bi-house me-1" aria-hidden="true" />
                Voltar ao início
              </Link>
            </div>
          }
        />
      </div>
    );
  }
}
