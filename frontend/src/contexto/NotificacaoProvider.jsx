import { useRef, useState } from 'react';
import { NotificacaoContext } from './notificacao';

const TEMPO_NA_TELA = 4000;

const estilos = {
  sucesso: { icone: 'bi-check-circle-fill', cor: 'text-success' },
  erro: { icone: 'bi-x-circle-fill', cor: 'text-danger' },
  aviso: { icone: 'bi-exclamation-triangle-fill', cor: 'text-warning' },
  info: { icone: 'bi-info-circle-fill', cor: 'text-primary' },
};

// Mostra notificações rápidas (toasts do Bootstrap) no canto da tela.
export default function NotificacaoProvider({ children }) {
  const [notificacoes, setNotificacoes] = useState([]);
  const proximoId = useRef(1);

  function remover(id) {
    setNotificacoes((atuais) => atuais.filter((n) => n.id !== id));
  }

  function notificar({ tipo = 'info', titulo, mensagem }) {
    const id = proximoId.current++;
    setNotificacoes((atuais) => [...atuais, { id, tipo, titulo, mensagem }]);
    setTimeout(() => remover(id), TEMPO_NA_TELA);
  }

  return (
    <NotificacaoContext.Provider value={{ notificar }}>
      {children}

      <div className="toast-container position-fixed bottom-0 end-0 p-3">
        {notificacoes.map((n) => (
          <div key={n.id} className="toast show shadow" role="status" aria-live="polite">
            <div className="d-flex align-items-start gap-2 p-3">
              <i className={`bi ${estilos[n.tipo].icone} ${estilos[n.tipo].cor} fs-5`} aria-hidden="true" />
              <div className="flex-grow-1">
                {n.titulo && <strong className="d-block">{n.titulo}</strong>}
                {n.mensagem && <span className="text-body-secondary small">{n.mensagem}</span>}
              </div>
              <button type="button" className="btn-close btn-sm" aria-label="Fechar" onClick={() => remover(n.id)} />
            </div>
          </div>
        ))}
      </div>
    </NotificacaoContext.Provider>
  );
}
