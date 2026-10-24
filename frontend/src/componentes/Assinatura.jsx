export default function Assinatura({ className = '' }) {
  return (
    <footer className={`assinatura texto-pequeno text-body-secondary ${className}`}>
      Desenvolvido por <strong className="fw-medium text-body">Rafaela Brietzke</strong>
      <span className="mx-2" aria-hidden="true">·</span>
      Desafio de Programação Front-End · UNISINOS
    </footer>
  );
}
