// Candidature Haiku (haiku.fr, IA juridique pour les cabinets) : la home « Booster » habillée pour le poste, cinq projets
// imaginés (rien de réalisé pour Haiku). Une entreprise = ce fichier + assets/apply/{slug}/ (voir CLAUDE.md).
//
// Marque, relevés publics sur haiku.fr (13/11/2026) : le logo (trois barres + « Haiku », SVG du site, encre #292929),
// le dégradé des titres (rose #FF6CB3, violet #7834FF, bleu #578CFF), la police du site (Poppins) que la page ne reprend
// pas : le site garde la sienne. Les projets partent de l'offre publique (Recherche, Analyse, Production, Compétences,
// hébergement SecNumCloud) : des pistes de design, aucun chiffre ni résultat.
// Les objets 3D sont originaux (scripts/blender/make-features.py) : ni logo en volume, ni capture du produit.

const T = (fr, en) => ({ fr, en });
const COMPANY = 'Haiku';
const DIR = 'apply/haiku';

const logo = { src: `${DIR}/logo-dark.svg`, mark: `${DIR}/logo-mark-dark.svg`, markScale: 0.9 };
const logoOnLight = { src: `${DIR}/logo.svg`, mark: `${DIR}/logo-mark.svg`, markScale: 0.9 };

// Une carte : son nom, son type, son visuel. Pas de page derrière : au clic, elle glitche et le bouton du vrai book appelle.
const project = (id, model, colors, light, name, type) => ({
  id, name, type, fiction: true,
  logo: light ? logoOnLight : logo,
  colors,
  card: `${DIR}/cards/${id}.webp`,
  cardArt: { poster: `${DIR}/features3d/${model}.webp`, bg: colors.bg, pattern: 'page', lines: light ? 'rgba(41,41,41,.12)' : 'rgba(255,255,255,.14)' },
});

export default {
  slug: 'haiku',
  company: COMPANY,
  logo: `${DIR}/logo.svg`, // sur fond clair
  logoDark: `${DIR}/logo-dark.svg`, // sur fond sombre
  logoRatio: '79.08 / 21.514', // proportions du logo (viewBox), pour le cadre à côté du mien
  logoWidth: 33, // en cqi : la capitale du H à hauteur de celles de mon nom
  title: 'Johan Trigeard, avec Haiku · Candidature',
  desc: 'Candidature de Johan Trigeard : cinq projets imaginés pour Haiku. Projets fictifs, non réalisés pour la marque.',
  theme: { ink: '#292929', paper: '#F7F5F2', paper2: '#ECE6DE', accent: '#7834FF', onAccent: '#FFFFFF' },
  booster: {
    glb: `${DIR}/booster.glb`,
    front: `${DIR}/pack-front.webp`,
    // Imprimé sur le paquet (scripts/make-booster.mjs haiku).
    pack: {
      name: 'Johan Trigeard',
      strip: 'MOI, AVEC VOUS.',
      front: { tl: 'BOOSTER', tr: 'CANDIDATURE', sub: 'PROJETS IMAGINÉS · HAIKU', bl: '05 PROJETS', br: 'UI · UX · PRODUIT' },
      back: ['Lead UI/UX & Product Designer', 'Bordeaux, France', `Projets imaginés, non réalisés pour ${COMPANY}.`],
      skin: { ink: '#FFFFFF', stripBg: '#292929', stripText: '#FFFFFF', stripDash: '#7A7A7A', paperTop: '#D95BB0', paperMid: '#7834FF', paperBottom: '#4F7FF0' },
      logo: `${DIR}/logo-dark.svg`,
      logoWidth: 270,
    },
  },
  ui: {
    fr: {
      'pull.title': 'Votre tirage',
      'pull.count': 'projets imaginés',
      'booster.hint': 'Cliquez pour ouvrir le booster',
      'booster.tap': 'Touchez pour ouvrir le booster',
    },
    en: {
      'pull.title': 'Your draw',
      'pull.count': 'imagined projects',
      'booster.hint': 'Click to open the booster',
      'booster.tap': 'Tap to open the booster',
    },
  },
  projects: [
    project('source-sure', 'codes', { bg: '#EADBC8', fg: '#292929' }, true, 'Source sûre', T('Recherche · Citations vérifiables', 'Research · Verifiable citations')),
    project('le-dossier', 'pieces', { bg: '#292929', fg: '#FFFFFF' }, false, 'Le dossier, d’un regard', T('Analyse · Vue d’ensemble', 'Analysis · Case overview')),
    project('savoir-faire', 'tampon', { bg: '#7834FF', fg: '#FFFFFF' }, false, 'Savoir-faire maison', T('Compétences · Bibliothèque du cabinet', 'Skills · Firm library')),
    project('page-blanche', 'plume', { bg: '#F6D3E3', fg: '#292929' }, true, 'Plus jamais blanche', T('Production · Rédaction dans Word', 'Drafting · Word add-in')),
    project('mes-donnees', 'coffre', { bg: '#578CFF', fg: '#292929' }, true, 'Données en vue', T('Confiance · Sécurité visible', 'Trust · Visible security')),
  ],
};
