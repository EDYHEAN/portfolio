// Candidature Lacoste : la home « Booster » habillée pour le poste, cinq projets imaginés (rien de réalisé pour Lacoste).
// Une entreprise = ce fichier + assets/apply/{slug}/ (voir scripts/make-applications.mjs et CLAUDE.md).
//
// Marque, relevés publics : couleurs prises dans le logo 2026 (Wikimedia Commons, « Logo Lacoste 2026.svg », source lacoste.com/fr) :
// vert #06532A, noir #181713, rouge #D30018. Pas de charte publique : la police de la marque est sur mesure
// (corporate.lacoste.com, « Lacoste unveils a new visual identity », 21/04/2026), le site garde donc la sienne.
// Les objets 3D sont originaux (scripts/blender/make-features.py) : ni crocodile en volume, ni photo, ni création Lacoste.

const T = (fr, en) => ({ fr, en });
const COMPANY = 'Lacoste';
const DIR = 'apply/lacoste';

const logo = { src: `${DIR}/logo-dark.svg`, mark: `${DIR}/logo-mark-dark.svg`, markScale: 1.25 };
const logoOnLight = { src: `${DIR}/logo.svg`, mark: `${DIR}/logo-mark.svg`, markScale: 1.25 };

// Une carte : son nom, son type, son visuel. Pas de page derrière : au clic, elle glitche et le bouton du vrai book appelle.
const project = (id, model, colors, light, name, type) => ({
  id, name, type, fiction: true,
  logo: light ? logoOnLight : logo,
  colors,
  card: `${DIR}/cards/${id}.webp`,
  cardArt: { poster: `${DIR}/features3d/${model}.webp`, bg: colors.bg, lines: light ? 'rgba(24,23,19,.13)' : 'rgba(251,248,241,.16)' },
});

export default {
  slug: 'lacoste',
  company: COMPANY,
  logo: `${DIR}/logo.svg`, // sur fond clair
  logoDark: `${DIR}/logo-dark.svg`, // sur fond sombre
  title: 'Johan Trigeard, avec Lacoste · Candidature',
  desc: 'Candidature de Johan Trigeard : cinq projets imaginés pour Lacoste. Projets fictifs, non réalisés pour la marque.',
  theme: { ink: '#0F2A1B', paper: '#F3EFE4', paper2: '#E6E1D3', accent: '#06532A', onAccent: '#FBF8F1' },
  booster: {
    glb: `${DIR}/booster.glb`,
    front: `${DIR}/pack-front.webp`,
    // Imprimé sur le paquet (scripts/make-booster.mjs lacoste).
    pack: {
      name: 'Johan Trigeard',
      strip: 'MOI, AVEC VOUS.',
      front: { tl: 'BOOSTER', tr: 'CANDIDATURE', sub: 'PROJETS IMAGINÉS · LACOSTE', bl: '05 PROJETS', br: 'UI · UX · PRODUIT' },
      back: ['Lead UI/UX & Product Designer', 'Bordeaux, France', `Projets imaginés, non réalisés pour ${COMPANY}.`],
      skin: { ink: '#FBF8F1', stripBg: '#181713', stripText: '#FBF8F1', stripDash: '#7F8A82', paperTop: '#0A6335', paperBottom: '#06532A' },
      logo: `${DIR}/logo-dark.svg`,
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
    project('le-club', 'coupe', { bg: '#181713', fg: '#FBF8F1' }, false, 'Le Club, en vrai', T('Fidélité · App mobile', 'Loyalty · Mobile app')),
    project('mon-polo', 'polo', { bg: '#F3EFE4', fg: '#181713' }, true, 'Mon polo', T('Personnalisation · E-commerce', 'Personalisation · E-commerce')),
    project('la-bonne-taille', 'cintre', { bg: '#D30018', fg: '#FBF8F1' }, false, 'La bonne taille', T('E-commerce · Fiche produit', 'E-commerce · Product page')),
    project('le-vestiaire', 'casier', { bg: '#DCE6D8', fg: '#0F2A1B' }, true, 'Le Vestiaire', T('Compte client · Durabilité', 'Customer account · Sustainability')),
    project('jour-de-match', 'raquette', { bg: '#06532A', fg: '#FBF8F1' }, false, 'Jour de match', T('Expérience mobile · Tennis', 'Mobile experience · Tennis')),
  ],
};
