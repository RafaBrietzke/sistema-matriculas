import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.min.css';
import './estilos/tema.css';
import './estilos/layout.css';
import SessaoProvider from './contexto/SessaoProvider';
import NotificacaoProvider from './contexto/NotificacaoProvider';
import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SessaoProvider>
        <NotificacaoProvider>
          <App />
        </NotificacaoProvider>
      </SessaoProvider>
    </BrowserRouter>
  </StrictMode>,
);
