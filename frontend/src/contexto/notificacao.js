import { createContext, useContext } from 'react';

export const NotificacaoContext = createContext(null);

export function useNotificacao() {
  return useContext(NotificacaoContext);
}
