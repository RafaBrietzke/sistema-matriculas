import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function PainelLateral({ aberto, titulo, subtitulo, aoFechar, children }) {
  useEffect(() => {
    if (!aberto) return;
    function aoTeclar(evento) {
      if (evento.key === 'Escape') aoFechar();
    }
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [aberto, aoFechar]);

  if (!aberto) return null;

  return createPortal(
    <>
      <div className="offcanvas offcanvas-end show painel-lateral" tabIndex="-1" role="dialog" aria-modal="true" aria-labelledby="painel-lateral-titulo">
        <div className="offcanvas-header border-bottom">
          <div>
            <h2 className="offcanvas-title h5" id="painel-lateral-titulo">{titulo}</h2>
            {subtitulo && <p className="small text-body-secondary mb-0">{subtitulo}</p>}
          </div>
          <button type="button" className="btn-close" aria-label="Fechar" onClick={aoFechar} />
        </div>
        {children}
      </div>
      <div className="offcanvas-backdrop fade show" onClick={aoFechar} />
    </>,
    document.body,
  );
}
