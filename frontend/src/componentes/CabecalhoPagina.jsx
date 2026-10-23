export default function CabecalhoPagina({ titulo, subtitulo, acoes }) {
  return (
    <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4">
      <div>
        <h1 className="h3 mb-1">{titulo}</h1>
        {subtitulo && <p className="text-body-secondary mb-0">{subtitulo}</p>}
      </div>
      {acoes && <div className="d-flex gap-2">{acoes}</div>}
    </div>
  );
}
