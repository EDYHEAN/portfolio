# CLAUDE.md — Portfolio Johan Trigeard

Le portfolio de Johan (Lead UI/UX & Product Designer, Bordeaux), **FR / EN**, pour candidater sur des postes Lead UI/UX /
Product Designer. En ligne sur https://edyhean.github.io/portfolio/ (repo `EDYHEAN/portfolio`). La V1 (bento HTML vanilla)
a été remplacée le 06/11/2026 ; elle reste dans l'historique git (avant le commit « Bascule sur la V2 ») et en local chez Johan.

## Travailler

- Stack : **Vite (multi-pages) + JS vanilla + GSAP (ScrollTrigger, SplitText) + Lenis + three.js** (en différé).
- `npm i` puis `npm run dev -- --port 5180` → http://127.0.0.1:5180/ (tout se teste en local avant de pousser).
- **Déploiement** : chaque push sur `main` lance l'Action `.github/workflows/pages.yml` (build → GitHub Pages, ~1 min,
  le CDN suit en quelques minutes). La source Pages est « GitHub Actions » (plus de Jekyll : il avait écrasé la V2 une fois).
- Commits en français, courts et descriptifs.
- Avant de pousser du visuel : le regarder (Playwright + Chromium, bureau 1400×900 et téléphone 390×800).

## Structure

- Pages : la home (`index.html`) + une page par projet (`projets/{id}/index.html`). Ces HTML sont **générés**
  (`npm run pages`, lancé avant dev/build) par `scripts/shell.mjs`, `make-home.mjs`, `make-pages.mjs` : ne pas les éditer.
  Tout le contenu est rendu en JS.
- `assets/` est servi à la racine du site (`publicDir: 'assets'`). Dans les données, chemins relatifs à `assets/`
  (`vinyl-run/logo.svg`) ; `asset()` ajoute la bonne racine (`./` ou `../../`).
- Fichiers clés : `src/core.js` (socle : langue, header, Lenis, curseur, regard de la hyène, rideau entre pages, outro :
  mâchoire + contact), `src/home.js` + `home.css`, `src/project.js` + `project.css`, `src/blocks.js` (blocs des pages
  projet), `src/data/projects.js`, `src/data/home.js` (marques, contact), `src/i18n.js`, `src/style.css`, `src/logo.js`
  (hyène du hero), `src/scenes3d.js` (3D), `src/sound.js`.
- Scripts de génération (`scripts/`) : `make-lockup.mjs` (logo + `src/wordmark.js`, `npm run lockup`), `make-booster.mjs`
  (texture du booster, `npm run booster`), `blender/make-jaws.py` (mâchoire 3D). `src/hyena.js` est généré depuis
  `assets/brand/hyena.svg` (corps + 2 pupilles séparées pour le regard qui suit la souris).

## La home « Booster »

- À la 1re visite de la session, un booster 3D flotte (il fait office de loader) ; clic : la languette s'arrache, les cartes
  projet sortent et se posent en bento à droite (5 places : projets + cartes « à venir »), Reroll.
- À gauche, une colonne calée en haut (à hauteur de « Ton tirage ») : la hyène SVG (`logo.js` : chaque clic = un tour
  complet sans attente, le rendu change à chaque passage de profil ; 4 tours en 1,6 s = tournis 3,5 s : étoiles, yeux qui
  tournent, son `dizzy`), le nom sur 2 lignes aussi large que son encre (`.who-lock`), poste, phrase (mots-clés en `<em>`,
  surligneur tracé à l'arrivée), boutons « Avec qui j'ai bossé » (logos en surimpression, sans ombre) et « Ouvrir un booster ».
- Le rire de la hyène (`bindLaugh`, home.js) : sélectionner du texte du bloc de gauche le change en « hihihi » (une fois la
  sélection finie), sélection rouge sang, coulures sous les mots, son `laugh` ; tout revient à la désélection.
- Footer : « Johan Trigeard © 1993 – 202+ », LinkedIn, Mail (adresse jamais en clair, morceaux inversés dans `CONTACT.mail`).

## Les pages projet

- **Ajouter un projet** : une entrée dans `src/data/projects.js` (couleurs, logo, `card`, `shot`, polices, textes `{fr,en}`,
  liste `blocks`). Blocs : `identity`, `pages` (captures pleine page dans un navigateur collant + mobile), `showcase` (les
  écrans en grand et entiers, `full` / `half`, vidéo possible : `video` + `pixel`), `screens`, `features` (bento),
  `stack` (services + automatisations), `slides` (horizontal), `outcome` (chiffres). Intro et « projet suivant » automatiques.
  Captures : WebP, 1200 px de large (pleine page ≤ 12000 px de haut), dans `assets/{id}/`. `title: T(…)` remplace le titre
  générique d'un bloc `slides` ou `showcase` (« 8 versions avant la bonne »).
- Rhinov Studio (06/11) : landings retail + immo + app agents. Versions du hero et écrans de l'app rendus depuis Figma (fichier
  « Studio Rhinov », équipe Rhinov), pleines pages capturées sur les prototypes codés (`sources/raw/vibecoded/Rhinov Studio`).
- **Features en 3D** (item `model`, Vinyl Run puis MFT) : des modèles pâte à modeler faits par `scripts/blender/make-features.py`
  (GLB Draco de 20 à 60 Ko + une affiche WebP transparente, `--glb-only` pour ne refaire que les modèles), animés en temps réel
  par `src/feature3d.js` : UN canvas fixe pour toute la page, chaque modèle dessiné dans le cadre de sa tuile (flottement,
  oscillation, se tourne vers le curseur, grossit au survol, parallaxe au scroll), rien hors écran, chargé à l'approche.
- **Bloc live** (Rhinov Studio) : les vrais prototypes en iframe (`assets/rhinov-studio/live`), rendus à 1440 / 390 px puis réduits
  au cadre, onglets, chargés à l'approche et déchargés (about:blank) loin de l'écran ; au téléphone, le mobile seul.
  Le cadre bureau tient entier sous le header (100svh − 200 px). Au chargement (`tameFrame`, blocks.js) : barres de
  défilement masquées dans les cadres, et la molette passe à la page quand le prototype ne peut plus défiler (sans ça, un
  prototype plein écran piégeait le scroll). Le curseur de la page s'efface au-dessus d'une iframe. Par onglet : `hint`,
  `mobile: false` (pas de mobile au bureau, le navigateur prend toute la largeur ; seuls les cadres affichés se chargent).
- **Maisons du Monde · Labo** (06/11) : trois prototypes en live (Pièce Rare, la Visite sans mobile, 24 h à la maison), puis un
  bloc par prototype : la collection en 3D (meubles de Pièce Rare dans le bento `features` + feature3d.js, affiche = le
  détourage de la carte), le diaporama des pièces de la Visite, le jour / la nuit de 24 h. Les deux copies de Pièce Rare
  (bureau, mobile) ont chacune leur sauvegarde (clé localStorage selon la largeur, patchée par le script). `npm run labo` (`scripts/make-mdm-labo.mjs`) recopie les sources
  (`sources/raw/vibecoded`) dans `assets/mdm-labo/live` en les allégeant (meubles .glb en Draco + textures ≤ 1024 px, scènes
  et produits en WebP : 37 → 22 Mo) et refait `assets/mdm-labo/rooms`. Ne pas retoucher les copies : refaire depuis les sources.
  Carte : la pièce de nuit de 24 h + une vraie carte Pièce Rare (rendue par le code du prototype, `sources/cards/mdm-labo`).
- **Rassembler** les projets cohérents en un seul (ex. Rhinov Studio = landing retail + landing immo + app) plutôt que
  multiplier les cartes.
- **Visuel de carte** (`card`, 3:5) : une image qui illustre le projet avec élégance et donne envie de cliquer sans tout
  dévoiler. Jamais une capture de page d'accueil ou un écran pris au hasard (défaut actuel de MyFrenchTool et Vinyl Run).
  Composés par `scripts/make-cards.mjs` (`npm run cards`, 900×1500) : MFT = le coq et des outils français en orbite,
  Vinyl Run = une photo de la boutique (sources/cards/) et le logo en jaune. Tout dans la bande centrale (y 300 à 1150) : les petites cases recadrent.
  Sur la carte, `logo.mark` (le symbole seul : coq MFT, Pokéball NookDex) et `markScale` pour équilibrer les poids.
- **Outro** : un crâne de hyène 3D (`assets/3d/skull.glb`, 378 Ko : scan University of Dundee, CC BY 4.0, crédité en bas du
  contact ; brut dans `sources/raw/`, allégé et articulé dans `sources/hyena-skull.blend` : Skull + Jaw, origine = la
  charnière, occlusion cuite en couleur de sommets). Rendu gravure maison (`mountSkull`, scenes3d.js) : os papier, hachures
  d'encre calées sur la lumière et l'occlusion, grain qui frémit, contour encre. Au scroll (`outroMotion`, état `JAWS`) :
  a = il naît 10 px sous le dernier bloc (image accrochée au haut de l'outro par `setViewOffset`), rejoint le centre et
  fonce vers l'écran en ouvrant la gueule jusqu'à le recouvrir (la page s'assombrit en fin d'approche), c = on plonge dans
  la gueule ouverte, il disparaît, le contact épinglé est derrière. Pas de morsure (Johan, 06/11). Course courte
  (`.bite-run` 45vh) : pas de vide. Le canvas reste caché tant que rien n'est dessiné (un canvas WebGL vierge s'affichait
  en noir : le flash noir avant le crâne). Pas de WebGL : le contact s'affiche normalement (l'erreur est dans la console).
  L'ancienne mâchoire (`jaws.glb`, `scripts/blender/make-jaws.py`) est à supprimer une fois le crâne validé.
- **Rideau** entre pages : piloté par GSAP en yPercent uniquement (un transform CSS s'y ajoutait) ; la page d'arrivée naît
  couverte (`html.came`, script et style inline du shell).
- Faits vérifiés uniquement (repos, sites live, kit de marque). Chiffres MFT à revérifier.

## 3D, son, motion

- `src/scenes3d.js` (three.js en différé), modèles dans `assets/3d/` : `booster.glb` (objets Pack + Strip ; texture
  `pack-tex.jpg` recto à gauche / verso à droite, faite par `npm run booster` qui remet l'image dans le .glb et refait le repli
  2D `pack-front.webp`), `jaws.glb`. Sources Blender et scans hors du site : `sources/` (`hyena-plaque.blend`) ; les fichiers bruts trop lourds pour git dans `sources/raw/` (ignoré), seule leur version allégée va dans `assets/`. Décodeur Draco local `assets/3d/draco/`.
  Tone mapping neutre (ACES grise les noirs). Blender 5.2 + MCP for Blender sur le poste de Johan.
- Son : `src/sound.js`, synthétisé en Web Audio, activé au premier geste, toggle « Son » (localStorage), rien au survol
  tactile. `data-sound` sur un élément = feedback.
- Motion : le CSS décrit l'état **final**, les tweens partent d'un état « avant » (lisible sans JS et en
  `prefers-reduced-motion`). ScrollTriggers créés **dans l'ordre de la page**. Apparitions en tuiles (`spawn`), titres lettre
  à lettre, scrub seulement là où il guide. Changement de langue = `mm.revert()` + re-rendu + animations reconstruites.
- Images de logo : toujours en `position:absolute` dans un cadre dimensionné (les SVG sans taille intrinsèque débordent).
- Compresser avant de committer : `ffmpeg -y -i source.png -vf "scale=2200:-1" -c:v libwebp -quality 82 sortie.webp`.

## Marque (04 et 06/11/2026)

Tout vit dans `assets/brand/` :
- `hyena.svg` (noir) / `hyena-paper.svg` (crème) : la bête, gravure vectorisée (1 tracé evenodd) ; `hyena-source.webp` :
  génération d'origine. Petites tailles : `hyena-favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `icon-512.png`.
- `lockups/logo-johan-trigeard.svg` (+ `-paper`, + aperçus PNG) : **lockup officiel** = hyène + « Johan / Trigeard » sur
  2 lignes, Bricolage Grotesque 800 opsz 96, approche -0,03 em, interligne 0,94 em, texte vectorisé, sans effet sur la typo.
  La capitale du J à hauteur des oreilles, la base de « Trigeard » au pied de la hyène (le g dépasse). « edyhean » est
  abandonné (le compte Instagram @edyhean reste).
- Couleurs : encre `#0B0B0B`, papier `#EFE9DD`. La bête garde son aspect gravure, la typo reste propre (contraste sale / net).

## Matière pour les prochains projets

Projets vibecodés de Johan (zip « Rhinov Studio », 06/11) dans `sources/raw/vibecoded/` (ignoré, 1,2 Go) : Booster « Pièce Rare »
(cartes de meubles 3D en boosters), Catalogue Visite (la maison MDM pièce par pièce), Catalogue « 24 h à la maison » (le
scroll fait tourner l'heure), et `Rhinov Studio/` (prototypes codés des landings retail et immo, app agents, landing).
`assets/rhinov-ia/`, `assets/rhinov-rebrand/`, `assets/maisonsdumonde/` : visuels de la V1, à reprendre dans les projets
Rhinov en préparation (Rhinov Studio, Système Rhinov, rhinov.fr 2026, iA Déco), avec les fichiers Figma de l'équipe Rhinov.
