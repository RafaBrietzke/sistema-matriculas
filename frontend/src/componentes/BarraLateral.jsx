import { useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { SEMESTRE_ATUAL } from '../constantes';
import { menus } from '../navegacao';

export default function BarraLateral({ perfil, aberta, aoFechar }) {
  useEffect(() => {
    if (!aberta) return;
    function aoTeclar(evento) {
      if (evento.key === 'Escape') aoFechar();
    }
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [aberta, aoFechar]);

  return (
    <>
      <aside className="app-sidebar">
        <div
          className={`offcanvas-lg offcanvas-start app-sidebar-painel ${aberta ? 'show' : ''}`}
          tabIndex="-1"
          aria-label="Menu principal"
        >
          <div className="app-sidebar-conteudo">
            <div className="d-flex align-items-center justify-content-between">
              <Link to="/" className="app-marca" onClick={aoFechar}>
                <span className="app-marca-icone">
                  <i className="bi bi-mortarboard-fill" aria-hidden="true" />
                </span>
                MatrículaFácil
              </Link>
              <button type="button" className="btn-close btn-close-white d-lg-none" aria-label="Fechar menu" onClick={aoFechar} />
            </div>

            <nav aria-label="Navegação principal">
              {menus[perfil].map((grupo) => (
                <div key={grupo.secao}>
                  <p className="titulo-secao">{grupo.secao}</p>
                  {grupo.itens.map((item) => (
                    <NavLink key={item.para} to={item.para} end={item.fim} className="app-sidebar-link" onClick={aoFechar}>
                      <i className={`bi ${item.icone}`} aria-hidden="true" />
                      {item.texto}
                    </NavLink>
                  ))}
                </div>
              ))}
            </nav>

            <div className="app-sidebar-rodape mt-4">
              <p className="titulo-secao m-0 p-0">Semestre letivo</p>
              <p className="text-white fw-semibold mb-0">
                <i className="bi bi-calendar-event me-2" aria-hidden="true" />
                {SEMESTRE_ATUAL}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {aberta && <div className="offcanvas-backdrop fade show d-lg-none" onClick={aoFechar} />}
    </>
  );
}
