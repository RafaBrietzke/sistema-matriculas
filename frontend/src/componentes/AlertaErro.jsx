import EstadoVazio from './EstadoVazio';

// Estado de erro ao carregar dados, com opção de tentar de novo.
export default function AlertaErro({ mensagem, aoTentarNovamente, compacto = false }) {
  return (
    <div className="card border-danger-subtle" role="alert">
      <EstadoVazio
        icone="bi-wifi-off"
        cor="danger"
        compacto={compacto}
        titulo="Não foi possível carregar os dados"
        descricao={mensagem}
        acao={
          aoTentarNovamente && (
            <button type="button" className="btn btn-outline-danger btn-sm" onClick={aoTentarNovamente}>
              <i className="bi bi-arrow-clockwise me-1" aria-hidden="true" />
              Tentar novamente
            </button>
          )
        }
      />
    </div>
  );
}
