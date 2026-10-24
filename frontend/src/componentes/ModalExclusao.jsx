import { useState } from 'react';
import { remover, requisicao } from '../api/cliente';
import { useNotificacao } from '../contexto/notificacao';
import { useBuscaDados } from '../hooks/useBuscaDados';
import ModalConfirmacao from './ModalConfirmacao';

// Consulta se o registro está em uso antes de permitir a exclusão.
export default function ModalExclusao({ item, recurso, aoFechar, aoExcluir, verbo = 'Excluir', sucesso = (nome) => `${nome} excluído(a)` }) {
  const { notificar } = useNotificacao();
  const [processando, setProcessando] = useState(false);
  const { dados: uso, carregando, erro } = useBuscaDados(
    () => (item ? requisicao(`/${recurso}/${item.id}/uso`) : Promise.resolve(null)),
    item && `${recurso}/${item.id}`,
  );

  async function confirmar() {
    setProcessando(true);
    try {
      await remover(`/${recurso}/${item.id}`);
      notificar({ tipo: 'sucesso', titulo: sucesso(item.nome) });
      aoExcluir();
    } catch (e) {
      notificar({ tipo: 'erro', titulo: 'Não foi possível excluir', mensagem: e.message });
    } finally {
      setProcessando(false);
      aoFechar();
    }
  }

  let mensagem = 'Verificando se o registro está em uso...';
  if (erro) mensagem = erro;
  else if (uso?.podeExcluir) mensagem = 'Esta ação não pode ser desfeita.';
  else if (uso) mensagem = `Não é possível ${verbo.toLowerCase()} porque:`;

  return (
    <ModalConfirmacao
      aberto={Boolean(item)}
      icone="bi-trash"
      titulo={`${verbo} ${item?.nome}?`}
      mensagem={mensagem}
      textoConfirmar={verbo}
      processando={processando}
      podeConfirmar={!carregando && Boolean(uso?.podeExcluir)}
      ocultarConfirmar={Boolean(uso && !uso.podeExcluir)}
      textoCancelar={uso && !uso.podeExcluir ? 'Entendi' : 'Cancelar'}
      aoConfirmar={confirmar}
      aoCancelar={aoFechar}
    >
      {carregando && <span className="spinner-border spinner-border-sm text-body-secondary mt-3" aria-hidden="true" />}
      {uso && !uso.podeExcluir && (
        <ul className="list-unstyled text-start small mt-3 mb-0 d-grid gap-1">
          {uso.motivos.map((motivo) => (
            <li key={motivo} className="text-danger-emphasis">
              <i className="bi bi-x-circle me-1" aria-hidden="true" />
              {motivo}
            </li>
          ))}
        </ul>
      )}
    </ModalConfirmacao>
  );
}
