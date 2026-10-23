import { corPorTexto } from '../utilitarios/cores';

function iniciais(nome) {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

export default function Avatar({ nome, tamanho = 36 }) {
  return (
    <span
      className="d-inline-grid flex-shrink-0 rounded-circle text-white fw-semibold"
      style={{
        width: tamanho,
        height: tamanho,
        placeItems: 'center',
        fontSize: tamanho * 0.38,
        backgroundColor: corPorTexto(nome),
      }}
      aria-hidden="true"
    >
      {iniciais(nome)}
    </span>
  );
}
