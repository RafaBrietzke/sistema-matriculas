
export default function EstadoVazio({ icone = 'bi-inbox', titulo, descricao, acao, cor = 'primary', compacto = false }) {
  return (
    <div className={`text-center ${compacto ? 'py-4' : 'py-5'} px-3`}>
      <span className={`icone-bolha ${compacto ? '' : 'icone-bolha-lg'} bg-${cor}-subtle text-${cor}-emphasis mb-3`}>
        <i className={`bi ${icone}`} aria-hidden="true" />
      </span>
      <h2 className={compacto ? 'h6 mb-1' : 'h5 mb-2'}>{titulo}</h2>
      {descricao && <p className="text-body-secondary mb-0 mx-auto" style={{ maxWidth: 420 }}>{descricao}</p>}
      {acao && <div className="mt-3">{acao}</div>}
    </div>
  );
}
