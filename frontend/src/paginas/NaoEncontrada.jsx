import { Link } from 'react-router-dom';
import Assinatura from '../componentes/Assinatura';
import EstadoVazio from '../componentes/EstadoVazio';

export default function NaoEncontrada() {
  return (
    <div className="min-vh-100 d-flex flex-column">
      <div className="my-auto">
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
      <Assinatura className="text-center py-3" />
    </div>
  );
}
