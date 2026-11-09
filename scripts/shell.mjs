// Squelette HTML commun (home + pages projet). Le contenu est rendu en JS.
export const shell = ({ title, desc, root, attrs, theme = "#EFE9DD", script, loader = true, noindex = false, preload = '' }) => `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>${preload ? `
  <link rel="preload" as="image" href="${root}${preload}" fetchpriority="high">` : ''}
  <meta name="description" content="${desc}">${noindex ? '\n  <meta name="robots" content="noindex, nofollow">' : ''}
  <meta name="theme-color" content="${theme}">
  <link rel="icon" type="image/svg+xml" href="${root}brand/hyena-favicon.svg">
  <link rel="icon" type="image/png" sizes="32x32" href="${root}brand/favicon-32.png">
  <link rel="apple-touch-icon" href="${root}brand/apple-touch-icon.png">
  <!-- Arrivée par le rideau : la page naît couverte (sinon elle s'affiche avant que le JS ne pose le rideau). -->
  <script>try { if (sessionStorage.getItem('edy-curtain') === '1') document.documentElement.classList.add('came'); } catch (e) {}</script>
  <style>html.came { background: #0B0B0B; } html.came .loader { display: none; }</style>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
</head>
<body data-root="${root}" ${attrs}>
  <!-- Généré par scripts/ (ne pas éditer à la main) -->
  <svg class="sprite" aria-hidden="true" focusable="false">
    <defs>
      <path id="hy-body" fill-rule="evenodd"></path>
      <filter id="boil" x="-4%" y="-4%" width="108%" height="108%">
        <feTurbulence id="boilNoise" type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="1" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <!-- grit : bords mâchés + manques d'encre, le même traité gravure que la hyène (crocs, trace de morsure) -->
      <filter id="grit" x="-2%" y="-12%" width="104%" height="130%">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="3" result="w" />
        <feDisplacementMap in="SourceGraphic" in2="w" scale="10" xChannelSelector="R" yChannelSelector="G" result="d" />
        <feTurbulence type="fractalNoise" baseFrequency="0.32" numOctaves="2" seed="8" result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -22 14.6" result="h" />
        <feComposite in="d" in2="h" operator="in" />
      </filter>
    </defs>
  </svg>
${loader ? `  <div class="loader" aria-hidden="true">
    <div class="loader-inner"><div class="loader-mark" data-hyena="boil"></div></div>
    <span class="loader-word">Johan Trigeard</span>
    <span class="loader-count mono">000</span>
    <span class="loader-bar"></span>
  </div>
` : ''}  <div class="curtain" aria-hidden="true"><span class="curtain-mark" data-hyena></span></div>
  <header class="hdr" id="hdr" data-theme="light"></header>
  <div class="cursor" aria-hidden="true"><span class="cursor-label"></span></div>
  <main id="app"></main>
  <div id="outro"></div>
  <script type="module" src="${script}"></script>
</body>
</html>
`;
