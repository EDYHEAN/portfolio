// Projets : la tuile de la home + la page dédiée (une liste de blocs).
// Chemins d'assets relatifs au dossier assets/ (racine du site).
// Textes : { fr, en }. Faits vérifiés uniquement (repos, sites en ligne, kit de marque).
//
// Blocs disponibles (src/blocks.js) :
//   identity  : logo, déclinaisons, couleurs, typos (ou signes pour une marque multi-entités)
//   pages     : captures pleine page qui défilent dans un navigateur (+ mobile)
//   screens   : écrans d'app fixes, en bento
//   features  : features clés en bento (image + titre + une ligne)
//   stack     : écosystème (services) + automatisations
//   slides    : déclinaisons en défilement horizontal
//   outcome   : chiffres clés
// Le bloc d'intro et le "projet suivant" sont ajoutés automatiquement.

const T = (fr, en) => ({ fr, en });

export const PROJECTS = [
  {
    // Rhinov Studio (Johan, 06/11) : les deux landings (retail, immo) et l'app agents réunies en un projet.
    // Sources : Figma « Studio Rhinov » (équipe Rhinov) et les prototypes codés (sources/raw/vibecoded/Rhinov Studio).
    id: 'rhinov-studio',
    card: 'rhinov-studio/card.webp', // le fauteuil du hero actuel, logo en ivoire (scripts/make-cards.mjs)
    name: 'Rhinov Studio',
    year: '2026',
    theme: 'dark',
    colors: { bg: '#3B2A20', fg: '#F4EDE2', accent: '#C9672A', line: 'rgba(244,237,226,.14)', tile: '#4A3629' },
    logo: { src: 'rhinov-studio/logo.svg', invert: true },
    shot: 'rhinov-studio/versions/v8.webp',
    fonts: ['Poppins:wght@400;600', 'Bodoni+Moda:ital,wght@1,500'],
    type: T('Product design · B2B', 'Product design · B2B'),
    role: T('Lead UI/UX', 'Lead UI/UX'),
    tagline: T('Des photos produit sans shooting, des annonces immo qui donnent envie.', 'Product photos without a shoot, property listings people want to click.'),
    context: T(
      "Rhinov Studio, c'est l'offre pro de Rhinov : mettre en scène les produits des marques de meubles sans shooting photo, et sublimer les annonces des agents immobiliers par la retouche et le home staging virtuel. J'ai conçu les deux landings, version après version au fil des retours, l'app des agents, et je les ai prototypées en code pour les tester en vrai.",
      "Rhinov Studio is Rhinov's pro offer: staging furniture brands' products without a photo shoot, and lifting real estate listings with retouching and virtual home staging. I designed both landing pages, version after version as feedback came in, the agents' app, and prototyped them in code to test them for real.",
    ),
    blocks: [
      {
        type: 'identity',
        note: T('Une marque fille de Rhinov : le cacao de la maison, une Bodoni en italique pour la promesse.', "A Rhinov sub-brand: the house's cocoa, an italic Bodoni for the promise."),
        alt: { bg: '#F4EDE2', invert: false },
        palette: [
          { c: '#3B2A20', n: T('Cacao', 'Cocoa') },
          { c: '#F4EDE2', n: T('Ivoire', 'Ivory') },
          { c: '#8C6A55', n: T('Brun argile', 'Clay brown') },
          { c: '#C9672A', n: T('Orange', 'Orange') },
          { c: '#12151A', n: T('Noir riche', 'Rich black') },
        ],
        fonts: [
          { family: 'Poppins', weight: 600, role: T('Interface & texte', 'Interface & text') },
          { family: 'Bodoni Moda', italic: true, weight: 500, role: T('La promesse', 'The promise') },
        ],
      },
      {
        // L'itération : le hero de chaque version, de la V1 à aujourd'hui (archives Figma).
        type: 'slides',
        title: T('8 versions avant la bonne', '8 versions to get it right'),
        items: [
          { src: 'rhinov-studio/versions/v1.webp', t: T('V1 · la promesse seule', 'V1 · just the promise') },
          { src: 'rhinov-studio/versions/v2.webp', t: T('V2 · la preuve par la galerie', 'V2 · proof by gallery') },
          { src: 'rhinov-studio/versions/v3.webp', t: T("V3 · le produit dans son décor", 'V3 · the product in its setting') },
          { src: 'rhinov-studio/versions/v4.webp', t: T('V4 · le gros plan matière', 'V4 · the material close-up') },
          { src: 'rhinov-studio/versions/v5.webp', t: T('V5 · avant les retours du 30/09', 'V5 · before the 30/09 feedback') },
          { src: 'rhinov-studio/versions/v6.webp', t: T('V6 · avant le hero vidéo', 'V6 · before the video hero') },
          { src: 'rhinov-studio/versions/v7.webp', t: T("V7 · le produit seul, sur fond neutre", 'V7 · the product alone, neutral backdrop') },
          { src: 'rhinov-studio/versions/v8.webp', t: T("V8 · aujourd'hui", 'V8 · today') },
        ],
      },
      {
        // Les prototypes codés, en pleine page (la retail défile, l'immo à côté, le mobile en surimpression).
        type: 'pages',
        pages: [
          { src: 'rhinov-studio/pages/retail.webp', url: 'Rhinov Studio · retail', label: T('Landing retail', 'Retail landing') },
          { src: 'rhinov-studio/pages/immo.webp', url: 'Rhinov Studio · immo', label: T('Landing immo', 'Real estate landing') },
        ],
        mobile: 'rhinov-studio/pages/m-retail.webp',
      },
      {
        type: 'showcase',
        title: T("L'app des agents", "The agents' app"),
        items: [
          { img: 'rhinov-studio/app/dashboard.webp', url: 'App agents · Mes biens', t: T('Mes biens', 'My listings'), d: T("Chaque bien, son statut et ses photos retouchées, en un coup d'œil.", 'Every listing, its status and its retouched photos, at a glance.') },
          { img: 'rhinov-studio/app/ajout.webp', size: 'half', url: 'App agents · Ajouter un bien', t: T('Ajouter un bien', 'Add a listing'), d: T('Une adresse, des photos, la prestation : le studio prend le relais.', 'An address, some photos, the service: the studio takes it from there.') },
          { img: 'rhinov-studio/app/suivi.webp', size: 'half', url: 'App agents · Connexion', t: T('La connexion', 'Sign in'), d: T("L'espace agent, aux couleurs de la marque.", "The agent's space, in the brand's colours.") },
        ],
      },
      {
        type: 'outcome',
        stats: [
          { v: 8, l: T('versions de la landing retail', 'retail landing versions') },
          { v: 2, l: T('marchés : retail et immobilier', 'markets: retail and real estate') },
          { v: 1, l: T('app pour les agents', 'app for the agents') },
        ],
      },
    ],
  },
  {
    id: 'vinyl-run',
    card: 'vinyl-run/card.webp', // visuel de carte du booster (3:5, sujet centré)
    name: 'Vinyl Run',
    year: '2026',
    url: 'https://www.vinyl-run.com',
    theme: 'dark',
    colors: { bg: '#111110', fg: '#f0ede6', accent: '#EDF10C', line: 'rgba(240,237,230,.14)', tile: '#1b1b19' },
    logo: { src: 'vinyl-run/logo.svg', invert: true },
    shot: 'vinyl-run/features/map.webp',
    fonts: ['Space+Grotesk:wght@400;700', 'Bodoni+Moda:ital,wght@1,500'],
    type: T('Web design · Commerce local', 'Web design · Local retail'),
    role: T('Design & développement', 'Design & development'),
    tagline: T('Le disquaire de Saint-Pierre, en ligne.', "Saint-Pierre's record store, online."),
    context: T(
      "Disquaire indépendant à Saint-Pierre, à La Réunion, depuis 2017. J'ai conçu et développé son site : vitrine, inventaire en ligne et magazine.",
      'Independent record store in Saint-Pierre, Réunion Island, since 2017. I designed and built its site: storefront, live inventory and magazine.',
    ),
    blocks: [
      {
        type: 'identity',
        note: T('Ambiance « Sonic Volcano » : nuit, néon, éditorial.', '“Sonic Volcano” mood: night, neon, editorial.'),
        alt: { bg: '#EDF10C', invert: false },
        palette: [
          { c: '#111110', n: T('Nuit', 'Night') },
          { c: '#f0ede6', n: T('Pochette', 'Sleeve') },
          { c: '#EDF10C', n: T('Néon', 'Neon') },
        ],
        fonts: [
          { family: 'Space Grotesk', weight: 700, role: T('Interface & texte', 'Interface & text') },
          { family: 'Bodoni Moda', italic: true, weight: 500, role: T('Titres éditoriaux', 'Editorial titles') },
        ],
      },
      {
        type: 'pages',
        pages: [
          { src: 'vinyl-run/pages/home.webp', url: 'vinyl-run.com', label: T('Accueil', 'Home') },
          { src: 'vinyl-run/pages/blog.webp', url: 'vinyl-run.com/blog', label: T('Magazine', 'Magazine') },
          { src: 'vinyl-run/pages/article.webp', url: 'vinyl-run.com/blog/articles', label: T('Article', 'Article') },
        ],
        mobile: 'vinyl-run/pages/m-home.webp',
      },
      {
        type: 'features',
        items: [
          { img: 'vinyl-run/features/map.webp', size: 'l', t: T("La carte de l'île", 'The island map'), d: T('La boutique placée sur La Réunion, dessinée en courbes de niveau.', 'The shop pinned on Réunion, drawn in contour lines.') },
          { img: 'vinyl-run/features/chat.webp', size: 't', pos: 'top right', t: T('Chat avec le disquaire', 'Chat with the shop'), d: T('Une question sur un disque ? Réponse en direct, depuis une console admin.', 'A question about a record? Answered live, from an admin console.') },
          { img: 'vinyl-run/features/inventory.webp', size: 'w', t: T('Inventaire Discogs en direct', 'Live Discogs inventory'), d: T('Tout le stock, synchronisé depuis Discogs.', 'The whole stock, synced from Discogs.') },
          { img: 'vinyl-run/features/player.webp', size: 'w', fit: 'contain', t: T('Lecteur péi', 'Island player'), d: T('Des morceaux réunionnais pendant la visite.', 'Réunion tracks playing while you browse.') },
          { img: 'vinyl-run/features/demande.webp', size: 's', t: T('Demande spéciale', 'Special request'), d: T('Un formulaire pour chercher un vinyle précis.', 'A form to hunt down a specific record.') },
        ],
      },
      {
        type: 'stack',
        nodes: [
          { name: 'Discogs API', d: T('Inventaire & arrivages', 'Inventory & arrivals') },
          { name: 'Supabase', d: T('Chat en direct', 'Live chat') },
          { name: 'Brevo', d: T('Newsletter & alertes', 'Newsletter & alerts') },
          { name: 'Vercel', d: T('Hébergement & API', 'Hosting & API') },
          { name: 'GitHub Actions', d: T('Automatisations', 'Automations') },
          { name: 'Claude', d: T('Routine magazine', 'Magazine routine') },
        ],
        autos: [
          { when: T('Chaque lundi', 'Every Monday'), d: T('Les arrivages Discogs de la semaine alimentent la newsletter.', "The week's Discogs arrivals feed the newsletter.") },
          { when: T('Chaque article', 'Every article'), d: T('Rédigé par une routine Claude, images générées, publié par une Action.', 'Written by a Claude routine, images generated, shipped by an Action.') },
          { when: T('À la publication', 'On publish'), d: T('IndexNow signale les nouvelles pages à Bing.', 'IndexNow pings Bing with the new pages.') },
        ],
      },
      {
        type: 'outcome',
        stats: [
          // Chiffres relevés le 06/11/2026 : inventaire Discogs (vendeur Vinylrun974) et Search Console depuis la mise en ligne (mai 2026).
          { v: 2763, l: T('références en ligne, synchronisées depuis Discogs', 'records online, synced from Discogs'), sep: true },
          { v: 30855, l: T('impressions sur Google en 6 mois', 'Google impressions in 6 months'), sep: true },
          { v: 1983, l: T('visites venues de Google', 'visits from Google'), sep: true },
        ],
      },
    ],
  },

  {
    id: 'nookdex',
    card: 'nookdex/card.webp', // visuel de carte du booster (3:5, sujet centré)
    name: 'NookDex',
    year: '2026',
    url: 'https://nookdex.com',
    theme: 'light',
    colors: { bg: '#f4ecdc', fg: '#2b2230', accent: '#b8433d', line: 'rgba(43,34,48,.14)', tile: '#e9dcc3' },
    logo: { src: 'nookdex/logo.webp', mark: 'nookdex/logo-mark.webp', markScale: 0.72 }, // mark : le « o » Pokéball du logo, réduit comme le coq MFT
    shot: 'nookdex/room.webp',
    fonts: ['Press+Start+2P', 'VT323'],
    type: T('Product design · Jeu', 'Product design · Game'),
    role: T('Design produit & illustration', 'Product design & illustration'),
    tagline: T('Une collection Pokémon rangée dans un bureau peint à la main.', 'A Pokémon card collection, tidied up in a hand painted room.'),
    context: T(
      "Suivre sa collection de cartes Pokémon, c'est souvent un tableur. NookDex en fait un petit bureau cosy qu'on a envie d'ouvrir chaque soir. Projet perso, de l'illustration au code.",
      'Tracking a Pokémon card collection usually means a spreadsheet. NookDex turns it into a cosy little room you want to open every night. Personal project, from illustration to code.',
    ),
    blocks: [
      {
        type: 'identity',
        note: T('Aquarelle pour le décor, pixel pour les écrans.', 'Watercolor for the room, pixels for the screens.'),
        alt: { bg: '#2b2230' },
        palette: [
          { c: '#f4ecdc', n: T('Papier', 'Paper') },
          { c: '#2b2230', n: T('Encre', 'Ink') },
          { c: '#b8433d', n: T('Rouge', 'Red') },
          { c: '#a8701a', n: T('Or', 'Gold') },
          { c: '#3f8a4f', n: T('Vert', 'Green') },
        ],
        fonts: [
          { family: 'Press Start 2P', size: 0.5, role: T('NookDex OS', 'NookDex OS') },
          { family: 'VT323', size: 1.1, role: T("L'écran du vieil ordi", 'The old computer screen') },
        ],
      },
      {
        // Vitrine (Johan, 06/11 : le bento recadrait tout, l'outil ne se voyait pas) : les écrans en grand et entiers.
        type: 'showcase',
        items: [
          { img: 'nookdex/room.webp', url: 'nookdex.com', t: T('Le bureau', 'The room'), d: T("Chaque extension est un classeur sur l'étagère ; la lampe, la radio et le chat sont vivants.", 'Each set is a binder on the shelf; the lamp, the radio and the cat are alive.') },
          { img: 'nookdex/binder.webp', url: 'nookdex.com', t: T('Les classeurs', 'Binders'), d: T('Les cartes se rangent page par page, comme dans le vrai.', 'Cards go in page by page, like the real thing.') },
          { img: 'nookdex/os-home.webp', size: 'half', url: 'nookdex.com · NookDex OS', t: T('NookDex OS', 'NookDex OS'), d: T('Le vieil ordinateur affiche la valeur de la collection.', 'The old computer shows the collection value.') },
          { img: 'nookdex/os-cards.webp', size: 'half', url: 'nookdex.com · NookDex OS', t: T('Toutes les cartes', 'All cards'), d: T('Recherche et filtres par langue, rareté, extension.', 'Search and filters by language, rarity, set.') },
          { img: 'nookdex/sheet.webp', url: 'nookdex.com', t: T('La fiche carte', 'Card sheet'), d: T('Prix du jour et tendance sur 7 et 30 jours.', "Today's price and 7 / 30 day trends.") },
          { video: 'nookdex/game.mp4', img: 'nookdex/game-poster.webp', pixel: true, size: 'half', url: 'nookdex.com · NookBoy', t: T('Nook Survivors', 'Nook Survivors'), d: T('Le jeu caché dans la Game Boy du bureau : vague 300, la finale.', "The game hidden in the room's Game Boy: wave 300, the finale.") },
          { img: 'nookdex/game-ligue.webp', pixel: true, size: 'half', url: 'nookdex.com · NookBoy', t: T('La Ligue', 'The League'), d: T('Après la vague 300, le Conseil 4 attend les meilleurs joueurs.', 'Past wave 300, the Elite Four waits for the best players.') },
        ],
      },
      {
        type: 'screens',
        items: [
          { src: 'nookdex/pages/extensions.webp', url: 'nookdex.com/extensions', label: T('Extensions', 'Sets') },
          { src: 'nookdex/pages/marche.webp', url: 'nookdex.com/marche', label: T('Le marché', 'The market') },
          { src: 'nookdex/pages/calendrier.webp', url: 'nookdex.com/calendrier-des-sorties', label: T('Les sorties', 'Releases') },
        ],
      },
      {
        type: 'stack',
        nodes: [
          { name: 'Next.js', d: T("L'app & la boutique", 'App & shop') },
          { name: 'Supabase', d: T('Comptes & synchro', 'Accounts & sync') },
          { name: 'TCGdex', d: T('Données des cartes', 'Card data') },
          { name: 'Cardmarket', d: T('Prix FR & JAP', 'FR & JP prices') },
          { name: 'TCGplayer', d: T('Prix EN & scans', 'EN prices & scans') },
          { name: 'GitHub Actions', d: T('Automatisations', 'Automations') },
        ],
        autos: [
          { when: T('Chaque jour', 'Every day'), d: T('Les prix Cardmarket du jour, puis les posts sociaux des plus grosses variations.', "Today's Cardmarket prices, then social posts on the biggest moves.") },
          { when: T('Chaque lundi', 'Every Monday'), d: T('Le courrier du lundi et la veille des nouvelles cartes.', 'The Monday mail and the new cards watch.') },
          { when: T('Chaque dimanche', 'Every Sunday'), d: T('Les chiffres de la semaine.', "The week's numbers.") },
        ],
      },
      {
        type: 'outcome',
        stats: [
          { v: 43000, l: T('cartes', 'cards'), sep: true },
          { v: 3, l: T('langues de cartes : FR, EN, JAP', 'card languages: FR, EN, JP') },
          { v: 110, suffix: '+', l: T('dresseurs y rangent leurs cartes', 'trainers keep their cards there') },
        ],
      },
    ],
  },

  {
    id: 'myfrenchtool',
    card: 'myfrenchtool/card.webp', // visuel de carte du booster (3:5, sujet centré)
    name: 'MyFrenchTool',
    year: '2026',
    url: 'https://myfrenchtool.com',
    theme: 'blue',
    colors: { bg: '#0052CC', fg: '#ffffff', accent: '#ffffff', line: 'rgba(255,255,255,.18)', tile: '#ffffff', surface: '#F5F5F7', surfaceFg: '#050505', surfaceLine: 'rgba(5,5,5,.1)' },
    logo: { src: 'myfrenchtool/logo.svg', mark: 'myfrenchtool/logo-mark.svg', markScale: 0.68 }, // mark : le coq seul (cartes du tirage), réduit : plein, il pèse plus que les autres
    shot: 'myfrenchtool/home-hero.webp',
    fonts: ['Geist:wght@700', 'Bodoni+Moda:ital,wght@1,500'],
    type: T('Product & brand design', 'Product & brand design'),
    role: T('Design produit & marque', 'Product & brand design'),
    tagline: T("L'annuaire des meilleurs outils SaaS français.", 'The directory of the best French SaaS tools.'),
    context: T(
      "Indés, TPE et PME cherchent des outils français, conformes RGPD et hébergés en Europe. J'ai créé l'annuaire de A à Z : marque, produit, contenu et automatisations.",
      'Freelancers and small businesses look for French, GDPR compliant, EU hosted tools. I built the directory end to end: brand, product, content and automations.',
    ),
    blocks: [
      {
        type: 'identity',
        note: T('Le coq, en formes pleines, lisible jusqu’au favicon.', 'The rooster, in solid shapes, readable down to the favicon.'),
        logoSurface: '#0052CC',
        alt: { bg: '#ffffff', src: 'myfrenchtool/logo-dark.svg' },
        palette: [
          { c: '#0052CC', n: T('Bleu France', 'French blue') },
          { c: '#1a6fe0', n: T('Bleu clair', 'Light blue') },
          { c: '#050505', n: T('Encre', 'Ink') },
          { c: '#F5F5F7', n: T('Gris doux', 'Soft grey') },
        ],
        fonts: [
          { family: 'Geist', weight: 700, role: T('Titres & interface', 'Titles & interface') },
          { family: 'Bodoni Moda', italic: true, weight: 500, role: T('L’accent « made in France »', 'The “made in France” accent') },
        ],
      },
      {
        type: 'pages',
        pages: [
          { src: 'myfrenchtool/pages/home.webp', url: 'myfrenchtool.com', label: T('Accueil', 'Home') },
          { src: 'myfrenchtool/pages/tool.webp', url: 'myfrenchtool.com/tool/aircall', label: T('Fiche outil', 'Tool page') },
          { src: 'myfrenchtool/pages/brand.webp', url: 'myfrenchtool.com/marque', label: T('Page marque', 'Brand page') },
        ],
        mobile: 'myfrenchtool/pages/m-home.webp',
      },
      {
        type: 'features',
        items: [
          { img: 'myfrenchtool/features/tool-hero.webp', size: 'l', t: T('Fiches outil en bento', 'Bento tool pages'), d: T('Prix, avis et alternatives au même endroit.', 'Pricing, reviews and alternatives in one place.') },
          { img: 'myfrenchtool/features/quiz.webp', size: 'w', t: T('Quiz de recommandation', 'Recommendation quiz'), d: T('Quelques questions, les outils adaptés.', 'A few questions, the right tools.') },
          { img: 'myfrenchtool/features/barometre.webp', size: 't', t: T('Baromètre du SaaS français', 'French SaaS barometer'), d: T('Les données du catalogue, publiées en open data.', 'Catalog data, published as open data.') },
          { img: 'myfrenchtool/features/cover-vs.webp', size: 's', t: T('Covers générées', 'Generated covers'), d: T('Chaque comparatif a sa cover, aux couleurs des outils.', 'Every comparison gets its cover, in the tools’ colors.') },
          { img: 'myfrenchtool/features/article.webp', size: 's', t: T('Le blog', 'The blog'), d: T('Écrit pour Google, les lecteurs et les IA.', 'Written for Google, readers and AI.') },
        ],
      },
      {
        type: 'stack',
        nodes: [
          { name: 'Next.js', d: T('Site & contenus MDX', 'Site & MDX content') },
          { name: 'Vercel', d: T('Hébergement & analytics', 'Hosting & analytics') },
          { name: 'Claude', d: T('Routine éditoriale', 'Editorial routine') },
          { name: 'GitHub Actions', d: T('Publication auto', 'Auto publishing') },
          { name: 'Search Console', d: T('Pilotage SEO', 'SEO steering') },
          { name: 'data.gouv.fr', d: T('Open data', 'Open data') },
        ],
        autos: [
          { when: T('2 fois par semaine', 'Twice a week'), d: T('Un agent Claude écrit un article, son post LinkedIn et un mail récap. Une Action le publie.', 'A Claude agent writes an article, its LinkedIn post and a recap email. An Action ships it.') },
          { when: T('Chaque lundi', 'Every Monday'), d: T("L'annuaire officiel des Plateformes Agréées est relu pour mettre les fiches à jour.", 'The official e-invoicing platforms register is checked to keep tool pages current.') },
          { when: T('Chaque jour', 'Every day'), d: T('IndexNow signale les nouvelles pages à Bing.', 'IndexNow pings Bing with the new pages.') },
        ],
      },
      {
        type: 'outcome',
        // Trafic relevé dans le rapport hebdo MFT du 05/11/2026 (Search Console sur 28 jours, Bing Webmaster) ; catalogue à revérifier.
        stats: [
          { v: 60, suffix: '+', l: T('outils SaaS français référencés', 'French SaaS tools listed') },
          { v: 13146, l: T('impressions sur Google en 28 jours', 'Google impressions in 28 days'), sep: true },
          { v: 169, l: T('pages indexées par Bing', 'pages indexed by Bing') },
        ],
      },
    ],
  },

  {
    id: 'mesk',
    card: 'mesk/card.webp', // visuel de carte du booster (3:5, sujet centré)
    name: 'Mesk',
    year: '2026',
    url: null,
    theme: 'dark',
    colors: { bg: '#0E0E0E', fg: '#F2EEE6', accent: '#C2452C', line: 'rgba(242,238,230,.16)', tile: '#E6E0D4', surface: '#F2EEE6', surfaceFg: '#0E0E0E', surfaceLine: 'rgba(14,14,14,.14)' },
    logo: { src: 'mesk/meskal-records-logo.svg', invert: true },
    shot: 'mesk/slides/p11.webp',
    fonts: ['Anton', 'Archivo:wght@400;600'],
    type: T('Identité de marque', 'Brand identity'),
    role: T('Direction artistique', 'Art direction'),
    tagline: T('Trois signes, un visage.', 'Three signs, one face.'),
    context: T(
      'Un disquaire (Meskal Records), une marque (Chez Mesk) et une scène (DJ Mesk). Une seule direction : même lettrage, même trait, même visage.',
      'A record store (Meskal Records), a brand (Chez Mesk) and a stage (DJ Mesk). One direction: same lettering, same line, same face.',
    ),
    blocks: [
      {
        type: 'identity',
        note: T('Le lettrage est dessiné à la main. Le visage circule dans les trois signes.', 'The lettering is hand drawn. The face travels across all three signs.'),
        signs: [
          { src: 'mesk/meskal-records-logo.svg', name: 'Meskal Records', role: T('Le shop', 'The shop'), d: T('Devanture, sacs, étiquettes, tampon.', 'Shopfront, bags, price tags, stamp.') },
          { src: 'mesk/chez-mesk-vertical.svg', name: 'Chez Mesk', role: T('La marque', 'The brand'), d: T('Sticker, tote, casquette, tee.', 'Sticker, tote, cap, tee.') },
          { src: 'mesk/dj-mesk-logo.svg', name: 'DJ Mesk', role: T('La scène', 'The stage'), d: T('Flyers, affiches de set, line-up.', 'Flyers, set posters, line-ups.') },
        ],
        palette: [
          { c: '#0E0E0E', n: T('Noir sillon', 'Groove black') },
          { c: '#F2EEE6', n: T('Blanc pochette', 'Sleeve white') },
          { c: '#C2452C', n: T('Brique', 'Brick') },
          { c: '#E7017F', n: T('Rose Layup', 'Layup pink') },
        ],
        fonts: [
          { family: 'Anton', role: T('Les titres', 'Titles'), upper: true },
          { family: 'Archivo', weight: 400, role: T('Le texte courant', 'Body text') },
        ],
      },
      {
        type: 'slides',
        items: [
          { src: 'mesk/slides/p06.webp', t: T('Le visage', 'The face') },
          { src: 'mesk/slides/p11.webp', t: T('Le shop', 'The shop') },
          { src: 'mesk/slides/p12.webp', t: T('Les caisses', 'The crates') },
          { src: 'mesk/slides/p13.webp', t: T('Les goodies', 'Merch') },
          { src: 'mesk/slides/p09.webp', t: T('Instagram', 'Instagram') },
          { src: 'mesk/slides/p14.webp', t: T('Expo Layup, Toulouse', 'Layup show, Toulouse') },
          { src: 'mesk/slides/p10.webp', t: T('Qui va où', 'What goes where') },
          { src: 'mesk/slides/p16.webp', t: T('Ce qui tient, ce qui casse', 'Dos and don’ts') },
        ],
      },
    ],
  },
];

export const projectById = (id) => PROJECTS.find((p) => p.id === id);
export const nextProject = (id) => PROJECTS[(PROJECTS.findIndex((p) => p.id === id) + 1) % PROJECTS.length];
