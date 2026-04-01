const PALETAS = [
  ['#f58cb7', '#e25093'],
  ['#f6a6c9', '#d83d7d'],
  ['#f9c1db', '#cb2b71'],
  ['#f481b3', '#ca2f73'],
  ['#ef76ab', '#be2869'],
  ['#f7a8cb', '#d53c80'],
  ['#f784b4', '#da4485'],
  ['#f9b3d3', '#ce2f76'],
  ['#f068a3', '#c2276d'],
  ['#f98fba', '#dd4a8b'],
  ['#f5a3c9', '#cd2f78'],
  ['#ee73ab', '#b82065'],
  ['#f38ab8', '#d73f83'],
  ['#f7bad7', '#cc2f74'],
  ['#ee6ea7', '#bc2368'],
  ['#f175ab', '#c52f74'],
  ['#f9b2d3', '#cf3479'],
  ['#f18bb8', '#bd1f66'],
];

function calcularIndiceBase(texto: string): number {
  let soma = 0;

  for (const caractere of texto) {
    soma = (soma + caractere.charCodeAt(0)) % PALETAS.length;
  }

  return soma;
}

export function criarSlide(titulo: string, corA: string, corB: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
    <defs>
      <linearGradient id="fundo" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${corA}"/>
        <stop offset="100%" stop-color="${corB}"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="800" fill="url(#fundo)"/>
    <circle cx="200" cy="140" r="170" fill="#ffffff" fill-opacity="0.28"/>
    <circle cx="1060" cy="660" r="240" fill="#ffffff" fill-opacity="0.2"/>
    <text x="80" y="680" fill="#ffffff" font-size="64" font-family="Verdana" font-weight="700">${titulo}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function criarSlidesPadrao(titulo: string, contexto = ''): string[] {
  const chave = `${contexto}|${titulo}`;
  const indiceBase = calcularIndiceBase(chave);

  return Array.from({ length: 3 }, (_, indice) => {
    const paleta = PALETAS[(indiceBase + indice) % PALETAS.length];
    return criarSlide(titulo, paleta[0], paleta[1]);
  });
}
