# CLAUDE.md — Portfolio Johan Trigeard

Guide de travail pour Claude (et pour Johan en multi-poste). Ce projet est un
portfolio **HTML / CSS / JS vanilla**, sans build ni dépendance.

- `index.html` — structure (bento grid, fenêtre, chat widget, showreel…)
- `style.css` — tout le style
- `script.js` — toute la logique (fenêtres, carrousel, projets, compteurs…)
- `assets/` — images, logos, vidéo memoji, CV
- **Déploiement** : GitHub Pages sur la branche `main`. Un `git push` met le
  site à jour sous 1-2 min → https://edyhean.github.io/portfolio/

> ⚠️ Pas de serveur de dev nécessaire. Pour tester en local :
> `python -m http.server 8000` puis http://localhost:8000

---

## ➕ Ajouter un projet

Un projet vit à **deux endroits** dans `script.js`. Il faut éditer les deux,
avec le **même `id`**.

### 1. `carouselProjects` — vignette du carrousel + carte de la mosaïque

```js
{
  title: 'Nom du projet',
  cat:   'Product Design',          // courte catégorie affichée sur la vignette
  color: '#2C3A28',                 // couleur de fond (fallback si l'image charge mal)
  img:   'assets/mon-projet/cover.jpg',
  logo:  'assets/mon-projet/logo.svg',
  logoColor: '#8C6848',             // optionnel : recolore le SVG du logo (sinon blanc)
  logoNative: true,                 // optionnel : garde les couleurs du logo (PNG/WebP détouré, ex. NookDex)
  logoScale: 1.3,                   // optionnel : agrandit le logo sur la vignette
  id:    'mon-projet',              // ⚠️ doit être identique à l'id dans PROJECTS
}
```

Les points du carrousel sont générés automatiquement, rien à toucher dans
`index.html`. Par défaut le logo est affiché en **silhouette blanche** : il
doit donc avoir un fond transparent.

### 2. `PROJECTS` — la page projet complète (fenêtre desktop / bottom sheet mobile)

```js
{
  id: 'mon-projet',                 // ⚠️ même id que ci-dessus
  title: 'Nom du projet — Sous-titre',
  logo: 'assets/mon-projet/logo.svg',
  category: 'Product Design · B2B',
  context: 'Description du projet, du contexte au delivery…',
  collaborator: { name: 'Prénom Nom', url: 'https://…' },  // optionnel
  figma: 'https://www.figma.com/design/…',                 // optionnel (embed desktop, bouton mobile)
  specs: [
    { label: 'Année',   value: '2025' },
    { label: 'Rôle',    value: 'Lead UI/UX' },
    { label: 'Client',  value: 'Client' },
    { label: 'Secteur', value: 'B2B · Ameublement' },
  ],
  images: [
    { src: 'assets/mon-projet/img-1.webp' },               // image pleine largeur
    { src: 'assets/mon-projet/img-2.jpg', zoom: true },    // zoom: true = effet zoom au survol
    [{ src: 'assets/mon-projet/a.jpg' }, { src: 'assets/mon-projet/b.jpg' }], // une LIGNE de 2 colonnes
  ],
  tags: ['Figma', 'Design System', 'UX', 'Web'],
}
```

**Notes :**
- `images` accepte soit un objet `{ src, zoom? }` (pleine largeur), soit un
  **tableau de 2 objets** pour une ligne en 2 colonnes.
- La **1re image** est chargée en `eager` (visible à l'ouverture), les autres
  en `lazy` automatiquement — rien à gérer.
- Mets les assets du projet dans `assets/mon-projet/`.

---

## 🖼 Compresser les images (important pour les perfs)

Les exports Figma sont souvent énormes (plusieurs Mo). **Toujours** redimensionner
+ convertir en WebP avant de committer. `ffmpeg` est dispo et fait le job :

```bash
# Redimensionne à 2200px de large max + WebP qualité 82
ffmpeg -y -i "source.png" -vf "scale=2200:-1" -c:v libwebp -quality 82 "sortie.webp"
```

Repère : une image hero de 3840px / 6,4 Mo → ~260 Ko en WebP, sans perte visible.
Vérifie le rendu avant de supprimer l'original.

---

## 🎨 Mur de marques (« On a collaboré »)

Logos dans le tableau `BRANDS` (`script.js`). Chaque logo a un champ **`scale`**
= correction optique pour que tous aient la **même présence visuelle** (les
logos larges comme Samsung sont réduits, les compacts agrandis). La hauteur de
base est dans `.brands-track img` (`style.css`). Filtre gris uniforme appliqué à
tous via `filter: brightness(0) invert(0.62)`.

- Les logos **multi-tons** (ex. cible Ledvance) doivent utiliser des **trous
  transparents** (`fill-rule="evenodd"`) pour rester lisibles une fois aplatis
  en gris — sinon ils deviennent une tache pleine.

---

## 🚧 V2 (branche `v2`, dossier `v2/`)

Site expérientiel au scroll, **FR / EN**, pour candidater sur des postes Lead UI/UX / Product Designer.
La V1 (racine) reste en ligne sur `main` tant que la V2 n'est pas basculée.

- Stack : **Vite (multi-pages) + JS vanilla + GSAP (ScrollTrigger, SplitText) + Lenis**. `cd v2 && npm i && npm run dev` (port libre au choix).
- Pages : la home (`index.html`) + une page par projet (`projets/{id}/index.html`). Ces HTML sont **générés** (`npm run pages`, lancé auto avant dev/build) depuis `scripts/shell.mjs` : ne pas les éditer à la main. Tout le contenu est rendu en JS.
- Assets dans `assets/` (racine), servis à la racine du site (`publicDir: '../assets'`). Dans les données, chemins relatifs à `assets/` (`vinyl-run/logo.svg`) ; `asset()` ajoute la bonne racine (`./` ou `../../`).
- Fichiers clés : `src/core.js` (socle : langue, header, Lenis, curseur, regard de la hyène, rideau entre pages, morsure + contact).
- **Morsure du footer** (pages projet) : une mâchoire 3D (`assets/3d/jaws.glb`, faite par `scripts/blender/make-jaws.py` : `blender -b --factory-startup -P scripts/blender/make-jaws.py -- ../assets/3d/jaws.glb`, ou lancé depuis Blender ouvert via le MCP), rendue par `mountJaws` (scenes3d.js, chargée 3 écrans avant). Le scroll (`outroMotion`) pilote `JAWS` : a = elle arrive, b = elle claque (son `chomp` + secousse), c = elle s'ouvre, le bas se pose au pied de l'écran et sa gencive (#0B0B0B exact, MeshBasic) se fond dans le contact. Pas de WebGL : la section saute.
- **Rideau** : piloté par GSAP en yPercent uniquement (pas de transform en CSS, il s'y ajoutait) ; la page d'arrivée naît couverte (`html.came`, script inline du shell)., `src/home.js`, `src/project.js`, `src/blocks.js` (blocs des pages projet), `src/data/projects.js`, `src/data/home.js` (parcours, marques), `src/i18n.js`, `src/style.css`, `src/project.css`.
- **Home « Booster »** (`src/home.js` + `src/home.css`) : à la 1re visite de la session, un booster 3D flotte (il fait office de loader) ; clic / tap : la languette s'arrache, les cartes projet sortent et se posent en bento à droite. Hero sans scroll : à gauche la hyène SVG (`logo.js` : chaque clic = un tour complet, sans attente, le rendu change à chaque passage de profil ; 4 tours en 1,6 s = tournis 3,5 s : étoiles en orbite, yeux qui tournent, tête qui tangue, son `dizzy`), le nom sur 2 lignes aussi large que son encre (`.who-lock`), poste, poste, phrase, boutons « Avec qui j'ai bossé » (affiche/masque les logos) et « Rouvrir un booster » ; à droite le tirage (5 places : projets + cartes « à venir ») avec Reroll. Footer discret : « edyhean © 1993 – 202+ », LinkedIn, Mail (adresse jamais en clair dans la page, morceaux inversés dans `CONTACT.mail`, assemblée au clic).
- **3D** (`src/scenes3d.js`, three.js en différé) : modèles Blender dans `assets/3d/` : `booster.glb` (objets Pack + Strip, texture `pack-tex.jpg` : recto à gauche, verso à droite, générée par `npm run booster` = `scripts/make-booster.mjs` depuis hyena.svg et les polices, textes dans `PACK` ; le script remet l'image dans le .glb et refait le repli `pack-front.webp`), `hyena-solo.glb` (logo extrudé), `hyena-plaque.glb` (piste plaque, en réserve). Source unique `hyena-plaque.blend`. Repli 2D : `pack-front.webp`. Décodeur Draco local `assets/3d/draco/`. Tone mapping neutre (ACES grise les noirs).
- **Son** : `src/sound.js`, sons synthétisés en Web Audio (tick, press, release, ding, stamp, needle), activés au premier geste, toggle « Son » dans le header (localStorage), pas de son de survol au tactile. Ajouter `data-sound` à un élément pour lui donner le feedback.
- **Ajouter un projet** : une entrée dans `src/data/projects.js` (couleurs, logo, `shot` pour la tuile, polices, textes `{fr,en}`, liste `blocks`). Blocs dispo : `identity`, `pages` (captures pleine page qui défilent dans un navigateur collant + mobile), `screens`, `features` (bento, tailles `l`/`w`/`t`/`s`), `stack` (services + automatisations), `slides` (horizontal), `outcome` (chiffres). Intro et "projet suivant" sont automatiques. Captures : WebP, 1200 px de large (pleine page ≤ 12000 px de haut), dans `assets/{id}/pages|features/`.
- **Parcours** : photos à déposer dans `assets/me/` (`2013.jpg`, `2018.jpg`, `2020.jpg`, `2023.jpg`, `2024.jpg`, `2026.jpg`), filtre argentique en CSS. Sans fichier, cadre « Photo à venir ».
- Faits vérifiés uniquement (repos, sites live, kit de marque). Chiffres MFT à revérifier avant mise en ligne.
- Règles motion : le CSS décrit l'état **final**, les tweens partent d'un état "avant" (lisible sans JS et en `prefers-reduced-motion`). ScrollTriggers créés **dans l'ordre de la page**. Motion minimaliste : apparitions en tuiles (`spawn`), titres lettre à lettre, scrub seulement là où il guide (pages, horizontaux, morsure).
- Images de logo : toujours en `position:absolute` dans un cadre dimensionné (les SVG sans taille intrinsèque débordent sinon).
- Changement de langue = `mm.revert()` + re-rendu + reconstruction des animations, position de scroll conservée.
- `src/hyena.js` est généré depuis `assets/brand/hyena.svg` (corps + 2 pupilles séparées pour le regard qui suit la souris).
- Déploiement (à faire à la bascule) : build `v2/dist` publié via une GitHub Action Pages.

---

## 🐺 Marque (validée le 04/11/2026)

Tout vit dans `assets/brand/` :
- `hyena.svg` (noir) / `hyena-paper.svg` (crème) : la bête, gravure vectorisée (1 tracé evenodd).
- `hyena-favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `icon-512.png` : petites tailles (tête recadrée).
- `lockups/logo-johan-trigeard.svg` (+ `-paper`) : **lockup officiel** (06/11/2026, « edyhean » abandonné) = hyène + « Johan / Trigeard » sur 2 lignes, Bricolage Grotesque 800 opsz 96, approche -0,03 em, interligne 0,94 em, texte vectorisé, **sans effet sur la typo**. La capitale du J à hauteur des oreilles, la base de « Trigeard » au pied de la hyène (le g dépasse), gouttière d'encre 0,16 x la hauteur de la hyène. Aperçus PNG 1600×900 : `logo-johan-trigeard.png` (fond papier) / `-noir.png`. Les `logo-edyhean*` restent en archive.
- Sur le site : le header des pages projet dessine le nom avec `v2/src/wordmark.js` (les mêmes tracés, à côté de la hyène vivante) ; le hero de la home est le même lockup en grand, en texte (`.who-lock`, proportions en commentaire dans home.css).
- `hyena-source.webp` : génération d'origine (référence).

Couleurs : encre `#0B0B0B`, papier `#EFE9DD`. Le point rouge a été écarté.
Règle : la bête garde son aspect gravure, la typo reste propre (contraste sale / net).

---

## ✅ Conventions

- Tout en **français** côté contenu.
- Couleur d'accent pilotée par le **hue slider** via les variables CSS
  `--blue-rgb` / `--blue-mid-rgb` / `--blue-deep-rgb` (et `--blue`, `--blue-mid`,
  `--blue-deep`). Pour qu'un élément suive l'accent, utilise ces variables.
- Mobile = `≤ 960px` : les pages projet passent en **bottom sheet** (le scroll y
  est natif ; le swipe-pour-fermer est limité à la poignée du haut).
- Commits en français, messages courts et descriptifs.
