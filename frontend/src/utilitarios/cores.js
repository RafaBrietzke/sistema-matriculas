const PALETA = ['#4f46e5', '#0891b2', '#16a34a', '#d97706', '#db2777', '#9333ea', '#dc2626', '#0d9488', '#ca8a04', '#2563eb', '#ea580c', '#65a30d'];

export function corPorTexto(texto) {
  const soma = [...texto].reduce((total, letra) => total + letra.charCodeAt(0), 0);
  return PALETA[soma % PALETA.length];
}

export function corDaDisciplina(disciplinaId) {
  return PALETA[(disciplinaId - 1) % PALETA.length];
}
