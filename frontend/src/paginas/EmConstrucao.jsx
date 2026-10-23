import CabecalhoPagina from '../componentes/CabecalhoPagina';
import EstadoVazio from '../componentes/EstadoVazio';

export default function EmConstrucao({ titulo }) {
  return (
    <>
      <CabecalhoPagina titulo={titulo} />
      <div className="card">
        <EstadoVazio
          icone="bi-cone-striped"
          cor="warning"
          titulo="Tela em construção"
          descricao="Esta funcionalidade faz parte das próximas etapas do projeto."
        />
      </div>
    </>
  );
}
