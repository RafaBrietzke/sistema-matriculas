const cores = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#db2777', '#7c3aed', '#2563eb'];

function iniciais(nome) {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

// A mesma pessoa sempre recebe a mesma cor.
function corDoNome(nome) {
  const soma = [...nome].reduce((total, letra) => total + letra.charCodeAt(0), 0);
  return cores[soma % cores.length];
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
        backgroundColor: corDoNome(nome),
      }}
      aria-hidden="true"
    >
      {iniciais(nome)}
    </span>
  );
}
