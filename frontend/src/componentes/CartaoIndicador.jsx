import { Link } from 'react-router-dom';

export default function CartaoIndicador({ icone, valor, rotulo, detalhe, cor = 'primary', para, children }) {
  const conteudo = (
    <div className="card-body d-flex align-items-start gap-3">
      <span className={`icone-bolha bg-${cor}-subtle text-${cor}-emphasis`}>
        <i className={`bi ${icone}`} aria-hidden="true" />
      </span>
      <div className="flex-grow-1 min-w-0">
        <p className="text-body-secondary small fw-medium mb-1">{rotulo}</p>
        <p className="fs-3 fw-semibold lh-1 mb-1">{valor}</p>
        {detalhe && <p className="texto-pequeno text-body-secondary mb-0">{detalhe}</p>}
        {children}
      </div>
    </div>
  );

  if (para) {
    return (
      <Link to={para} className="card card-link-app h-100">
        {conteudo}
      </Link>
    );
  }
  return <div className="card h-100">{conteudo}</div>;
}
