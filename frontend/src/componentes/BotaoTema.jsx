import { useTema } from '../hooks/useTema';

export default function BotaoTema({ className = '' }) {
  const { tema, alternarTema } = useTema();
  const rotulo = tema === 'escuro' ? 'Usar tema claro' : 'Usar tema escuro';

  return (
    <button type="button" className={`btn botao-icone ${className}`} onClick={alternarTema} title={rotulo} aria-label={rotulo}>
      <i className={`bi ${tema === 'escuro' ? 'bi-sun' : 'bi-moon-stars'}`} aria-hidden="true" />
    </button>
  );
}
