import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSessao } from '../contexto/sessao';
import { rotulosPerfil, tituloDaRota } from '../navegacao';
import Avatar from './Avatar';
import BotaoTema from './BotaoTema';
import ModalConfirmacao from './ModalConfirmacao';

export default function BarraSuperior({ aoAbrirMenu }) {
  const { sessao, sair } = useSessao();
  const { pathname } = useLocation();
  const navegar = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);
  const [confirmandoSaida, setConfirmandoSaida] = useState(false);
  const menuRef = useRef(null);

  // Fecha o menu do usuário ao clicar fora dele.
  useEffect(() => {
    if (!menuAberto) return;
    function aoClicar(evento) {
      if (!menuRef.current.contains(evento.target)) setMenuAberto(false);
    }
    document.addEventListener('mousedown', aoClicar);
    return () => document.removeEventListener('mousedown', aoClicar);
  }, [menuAberto]);

  function confirmarSaida() {
    setConfirmandoSaida(false);
    sair();
    navegar('/login');
  }

  return (
    <header className="app-topo">
      <button type="button" className="btn botao-icone d-lg-none" aria-label="Abrir menu" onClick={aoAbrirMenu}>
        <i className="bi bi-list" aria-hidden="true" />
      </button>

      <p className="fw-semibold mb-0 text-truncate">{tituloDaRota(sessao.perfil, pathname)}</p>

      <div className="ms-auto d-flex align-items-center gap-1">
        <BotaoTema />

        <div className="dropdown" ref={menuRef}>
          <button
            type="button"
            className="menu-usuario"
            aria-expanded={menuAberto}
            aria-haspopup="menu"
            onClick={() => setMenuAberto(!menuAberto)}
          >
            <Avatar nome={sessao.nome} tamanho={32} />
            <span className="d-none d-sm-block text-start lh-sm">
              <span className="d-block small fw-semibold">{sessao.nome}</span>
              <span className="d-block texto-pequeno text-body-secondary">{rotulosPerfil[sessao.perfil]}</span>
            </span>
            <i className="bi bi-chevron-down small text-body-secondary" aria-hidden="true" />
          </button>

          {menuAberto && (
            <ul className="dropdown-menu dropdown-menu-end show mt-2" data-bs-popper="static" role="menu">
              <li className="px-3 py-2">
                <span className="d-block fw-semibold small">{sessao.nome}</span>
                <span className="texto-pequeno text-body-secondary">Perfil: {rotulosPerfil[sessao.perfil]}</span>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li>
                <button
                  type="button"
                  className="dropdown-item text-danger"
                  role="menuitem"
                  onClick={() => {
                    setMenuAberto(false);
                    setConfirmandoSaida(true);
                  }}
                >
                  <i className="bi bi-box-arrow-right me-2" aria-hidden="true" />
                  Sair
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>

      <ModalConfirmacao
        aberto={confirmandoSaida}
        icone="bi-box-arrow-right"
        variante="primary"
        titulo="Sair do sistema?"
        mensagem="Você vai voltar para a tela de escolha de perfil."
        textoConfirmar="Sair"
        aoConfirmar={confirmarSaida}
        aoCancelar={() => setConfirmandoSaida(false)}
      />
    </header>
  );
}
