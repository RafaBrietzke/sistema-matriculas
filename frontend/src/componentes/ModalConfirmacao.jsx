import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function ModalConfirmacao({
  aberto,
  titulo,
  mensagem,
  icone = 'bi-exclamation-triangle',
  variante = 'danger',
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  processando = false,
  aoConfirmar,
  aoCancelar,
  tamanho = 'sm',
  children,
}) {
  // Fecha com a tecla Esc.
  useEffect(() => {
    if (!aberto) return;
    function aoTeclar(evento) {
      if (evento.key === 'Escape' && !processando) aoCancelar();
    }
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [aberto, processando, aoCancelar]);

  if (!aberto) return null;

  return createPortal(
    <>
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-confirmacao-titulo"
        onClick={(evento) => evento.target === evento.currentTarget && !processando && aoCancelar()}
      >
        <div className={`modal-dialog modal-dialog-centered modal-${tamanho}`}>
          <div className="modal-content">
            <div className="modal-body p-4 text-center">
              <span className={`icone-bolha icone-bolha-lg bg-${variante}-subtle text-${variante}-emphasis mb-3`}>
                <i className={`bi ${icone}`} aria-hidden="true" />
              </span>
              <h2 className="h5" id="modal-confirmacao-titulo">
                {titulo}
              </h2>
              {mensagem && <p className="text-body-secondary mb-0">{mensagem}</p>}
              {children}
            </div>
            <div className="d-flex gap-2 px-4 pb-4">
              <button type="button" className="btn btn-neutro flex-fill" onClick={aoCancelar} disabled={processando} autoFocus>
                {textoCancelar}
              </button>
              <button type="button" className={`btn btn-${variante} flex-fill`} onClick={aoConfirmar} disabled={processando}>
                {processando && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
                {textoConfirmar}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>,
    document.body,
  );
}
