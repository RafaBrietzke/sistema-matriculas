import { Link } from 'react-router-dom';
import EstadoVazio from '../componentes/EstadoVazio';

export default function NaoEncontrada() {
  return (
    <div className="min-vh-100 d-grid align-items-center">
      <EstadoVazio
        icone="bi-signpost-split"
        titulo="Página não encontrada"
        descricao="O endereço acessado não existe ou foi movido."
        acao={
          <Link to="/" className="btn btn-primary">
            <i className="bi bi-house me-2" aria-hidden="true" />
            Voltar ao início
          </Link>
        }
      />
    </div>
  );
}
