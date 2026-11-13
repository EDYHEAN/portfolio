# CLAUDE.md — Portfolio Johan Trigeard

Le portfolio de Johan (Lead UI/UX & Product Designer, Bordeaux), **FR / EN**, pour candidater sur des postes Lead UI/UX /
Product Designer. En ligne sur https://johantrigeard.com/ (repo `EDYHEAN/portfolio`). La V1 (bento HTML vanilla)
a été remplacée le 06/11/2026 ; elle reste dans l'historique git (avant le commit « Bascule sur la V2 ») et en local chez Johan.

## Travailler

- Stack : **Vite (multi-pages) + JS vanilla + GSAP (ScrollTrigger, SplitText) + Lenis + three.js** (en différé).
- `npm i` puis `npm run dev -- --port 5180` → http://127.0.0.1:5180/ (tout se teste en local avant de pousser).
- **Déploiement** : Vercel (équipe EDYHEAN, projet `portfolio`), chaque push sur `main` part en production, les autres branches en prévisualisation (protégées : lien de partage pour les montrer). Domaine johantrigeard.com acheté chez Namecheap (DNS là-bas, `www` redirige vers la racine). `vercel.json` : slash final des URL (les chemins relatifs des pages en dépendent) et cache des fichiers.
- `edyhean.github.io/portfolio` ne sert plus qu'à rediriger vers le domaine en gardant le chemin (`.github/redirect/index.html`, publié par l'Action `pages.yml`).
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
  (texture du booster, `npm run booster`). `src/hyena.js` est généré depuis
  `assets/brand/hyena.svg` (corps + 2 pupilles séparées pour le regard qui suit la souris).

## Le scroll des pages projet

`src/heroSnap.js` : depuis l'intro, le premier geste (molette, clavier, doigt) ancre en douceur sur le premier bloc, le geste inverse y ramène ; en remontant, on s'arrête d'abord sur le premier bloc. Ensuite, le scroll Lenis normal. Une intro plus haute que l'écran n'ancre pas (rien à sauter).

## Le responsive et les performances (09/11)

Au téléphone, chaque fonctionnalité est repensée pour le doigt, le bureau ne bouge pas (media queries et `(hover: none)`).
- Home : hyène et nom côte à côte, tirage en 2 colonnes, tout l'écran tactile sur le paquet, rire = appui long sur le bloc touché, film sur fond sombre.
- Au téléphone, la hyène de la home n'a ni libellé de rendu, ni contour animé, ni changement de rendu (`PLAIN`, core.js ; Johan, 09/11) ; elle tourne au tap et garde son tournis.
- Pages projet au téléphone, façon galerie (réf. tomdimajo.com, Johan 09/11) : pile de visuels en tuiles, pas de numéros ni de faux navigateur, pas de bloc `stack`, intro à sa hauteur, pas d'ancrage du hero. `src/viewer.js` : un tap ouvre une capture en plein écran.
- Rien d'interactif ni d'animé par le scroll dans une maquette au tactile (`STILL`, blocks.js) : bloc `pages` = la maquette mobile seule et fixe (plus de maquette bureau au téléphone, `PHONE`), sans agrandissement ; `mobileShots` + `titlePhone` la remplacent par plusieurs écrans à balayer (Vinyl Run, MFT : captures des vrais sites en 390×844). `variants` pareil. `live` : aucune iframe dans la page (les prototypes MDM faisaient planter l'onglet) : `stills` = captures en action au format 4:5, rendues à une fenêtre 4:5 pour que rien ne soit coupé (`assets/mdm-labo/stills`), sinon carte `poster` qui ouvre le prototype dans un nouvel onglet, et `gallery` = captures 4:5 sous les cartes (Rhinov Studio). `flatOnTouch` (bloc `features`) coupe la 3D au tactile, `titleStill` donne le titre de ces blocs en images. Au bureau, rien ne change.
- Socle : langue en une touche sous 480 px, nav complète dès 720 px, regard de la hyène guidé par le toucher et le scroll, contact direct si pas de WebGL.
- Booster : l'image du paquet s'affiche d'abord (préchargée, option `preload` de `scripts/shell.mjs`), three.js arrive une fois la page au calme, et l'installation rend la main entre chaque étape (`breathe`, `compileAsync`). Reste un gel d'environ 0,8 s (`PMREMGenerator`, derrière le paquet en image qui flotte en CSS).
- `canRun3D` (home.js) : sans vrai processeur graphique, avec peu de mémoire ou en économie de données, le paquet reste en image. Donc un Chrome sans GPU (serveur, PageSpeed) ne voit pas le paquet 3D : c'est voulu.
- Cartes : `xxx-480.webp` à côté de chaque `xxx.webp` (`srcset`), faite par `scripts/make-card-sizes.mjs`, lancé à la fin de `make-cards.mjs`. Une carte sans sa version 480 s'affiche mal dans les petites cases.

## La home « Booster »

- À la 1re visite de la session, un booster 3D flotte (il fait office de loader) ; clic : la languette s'arrache, les cartes
  projet sortent et se posent en bento à droite (5 places : projets + cartes « à venir »), Reroll.
- À gauche, une colonne calée en haut (à hauteur de « Ton tirage ») : la hyène SVG (`logo.js` : chaque clic = un tour
  complet sans attente, le rendu change à chaque passage de profil ; 4 tours en 1,6 s = tournis 3,5 s : étoiles, yeux qui
  tournent, son `dizzy`), le nom sur 2 lignes aussi large que son encre (`.who-lock`), poste, phrase (mots-clés en `<em>`,
  surligneur tracé à l'arrivée), boutons « Télécharger le CV » (`assets/cv-johan-trigeard.pdf`) et « Ouvrir un booster ».
- Le rire de la hyène (`bindLaugh`, home.js) : sélectionner du texte du bloc de gauche le change en « hihihi » (une fois la
  sélection finie), sélection rouge sang, coulures sous les mots, son `laugh` ; tout revient à la désélection.
- Showreel (`src/reel.js`, Vimeo 591673847) : une carte tirée au hasard comme les autres, toujours à la dernière place (en bas à droite), aperçu muet (`assets/reel/preview.mp4`). Au clic, la carte passe en 16:9 dans la zone du tirage, les autres cartes s'écartent, le film se charge ; Fermer, Échap ou un clic ailleurs ramène l'état neutre.
- Footer : « Johan Trigeard © 1993 – 202+ », LinkedIn, Mail (adresse jamais en clair, morceaux inversés dans `CONTACT.mail`).

## L'image de partage

`npm run og` (`scripts/make-og.mjs`) : `assets/og.jpg`, 1200×630, le lockup, le poste et trois vraies cartes du tirage. Balises Open Graph dans `scripts/shell.mjs`, la même image sur toutes les pages (adresse absolue vers johantrigeard.com). LinkedIn garde l'aperçu en cache : après un changement, le rafraîchir avec son Post Inspector.

## Le CV

Variante deux colonnes gardée en option : `node scripts/make-cv-aere.mjs` (`sources/cv-aere/`).

`npm run cv` (`scripts/make-cv.mjs`) : une page web (`sources/cv/index.html`) exportée en PDF A4 dans `assets/cv-johan-trigeard.pdf`, parti pris « carte tirée » (photo en gravure, nom énorme, talon à découper), en vrai texte (le HTML suit l'ordre de lecture, tous les blocs sont positionnés), QR vers johantrigeard.com (constante `SITE`).

## La signature mail (13/11)

johantrigeard.com/signature/ (`assets/signature/index.html`, `noindex`, liée nulle part, téléphone assemblé en JS) : aperçu clair / sombre, bouton « Copier la signature » à coller dans Gmail ou Outlook, et le mode d'emploi. Tableau HTML et styles en ligne, texte en vrai texte (Helvetica / Arial), liens site, LinkedIn, CV, téléphone. La hyène : `assets/signature/hyena.gif` (servi sur johantrigeard.com/signature/hyena.gif, donc en ligne avant de coller), fait par `node scripts/make-signature.mjs` : tour de carte et changement de rendu au passage de profil (gravure, riso, trame, holo), sur une tuile papier pour le mode sombre, 1re image = gravure de face (Outlook classique n'affiche qu'elle), environ 170 Ko.

## « C'est qui celui-là ? » (`/a-propos/`, 09/11)

La page « qui suis-je », tout sur un écran au bureau (`src/about.js` + `about.css`) : ma carte « hors tirage » (mêmes inclinaison et reflet que le tirage ; au clic elle tourne et passe à la suivante, liste `SLIDES` dans about.js : moi, puis Warwick ; photos dans `assets/about/`), le texte, le parcours (`PATH`, data/home.js), les outils, les marques. Lien dans le header sur toutes les pages (sur la home, à droite avec le son et la langue, au téléphone aussi). Faits vérifiés uniquement.

## Les candidatures (`/{slug}/`)

La home habillée pour une entreprise, avec cinq projets imaginés, façon « Moi, avec vous. » (`/lacoste/`). Toujours en `noindex`, jamais listée sur le vrai portfolio, bandeau promotionnel en haut (LinkedIn ou mail), à gauche mon logo × le sien, « This could be us… » et le bouton vers le vrai book, mention « Projet imaginé » sur chaque carte. Pas de page derrière les cartes (Johan, 09/11) : au clic, la carte glitche et ses éclats filent vers le bouton du vrai book (`glitchCard`, `src/application.js`). Sur le vrai portfolio, `APP` (`src/application.js`) vaut `null` et rien ne change.

Décliner pour une entreprise :
1. `src/data/applications/{slug}.js` (copier `lacoste.js`) : nom, logos, couleurs, textes `ui`, paquet `booster.pack`, 5 cartes (nom, type, visuel). Le `slug` donne l'URL.
2. Visuels dans `assets/apply/{slug}/` : `logo.svg`, `logo-dark.svg`, et pour la carte de chaque projet l'affiche 3D : une entrée `SCENES['apply/{slug}']` dans `scripts/blender/make-features.py`, puis `blender -b --factory-startup -P scripts/blender/make-features.py -- apply/{slug}` (seule l'affiche WebP sert).
3. `node scripts/make-booster.mjs {slug}` (le paquet), `node scripts/make-cards.mjs apply:{slug}` (les cartes), `npm run pages` (la page, `scripts/make-applications.mjs`).

Options par entreprise : `logoRatio` + `logoWidth` (cqi) pour le logo à côté du mien (défaut : celui de Lacoste), `cardArt.pattern` (`court` par défaut, `page` = page réglée), `skin.paperMid` (dégradé à trois arrêts sur le paquet), `pack.logoWidth`.

Faites : `/lacoste/` (09/11), `/haiku/` (13/11, IA juridique : logo et dégradé rose / violet / bleu relevés sur haiku.fr, objets de cabinet d'avocats).

Rester honnête : aucun chiffre ni résultat inventé présenté comme réel, des hypothèses à vérifier, pas de reproduction de créations de la marque. Lacoste : couleurs relevées dans le logo 2026 (Wikimedia Commons, « Logo Lacoste 2026.svg », source lacoste.com/fr ; marque déposée) ; la police de la marque est sur mesure, le site garde la sienne.

## Les pages projet

- **Ajouter un projet** : une entrée dans `src/data/projects.js` (couleurs, logo, `card`, `shot`, polices, textes `{fr,en}`,
  liste `blocks`). Blocs : `identity`, `pages` (captures pleine page dans un navigateur + mobile : la molette sur un cadre fait défiler la capture, ailleurs la page ; pages au clic, plus d'épinglage depuis le 07/11), `showcase` (les
  écrans en grand et entiers, `full` / `half`, vidéo possible : `video` + `pixel`), `screens`, `features` (bento),
  `stack` (services + automatisations), `slides` (horizontal), `outcome` (chiffres). Intro et « projet suivant » automatiques.
  Captures : WebP, 1200 px de large (pleine page ≤ 12000 px de haut), dans `assets/{id}/`. `title: T(…)` remplace le titre
  générique d'un bloc `slides` ou `showcase` (« 8 versions avant la bonne »).
- rhinov.fr (09/11, id `rhinov-site`) : pages Dev Ready du fichier Figma « Site Web 2026 », tests de la page Optimisations conversion 2026 (bloc `variants` : pistes bureau + mobile au clic, `photos` en grille) + slides du deck. Le tunnel « Order V5 » a encore l'ancien logo : pas montré. Vitrine : `size: 'phone'` met un écran mobile dans un téléphone.
- iA Déco (09/11, id `ia-deco`) : fichier Figma « iA Déco ». Écrans au nouveau logo seulement : sur les écrans du chat mobile de V9, l'en-tête est remplacé par celui de l'écran palette. Pas d'écran avec du texte de test (« Canapé trop sympa… ») ni les prototypes co-brandés Maisons du Monde. Carte = couloir bleu sans logo (`sources/cards/ia-deco`). Bloc `chat` : la conversation jouée en vrai HTML (scénario dans `steps`, choix cliquables, se joue seulement à l'écran, reboucle, pas de scroll capturé ; sans animation, tout est affiché et se lit dans le cadre). Bloc marque retiré à la demande de Johan. Mon Salon de Noël (fichier Figma « Diag de Noël », page VFinale, écrans dans `assets/ia-deco/noel`) : les 6 destinations en bloc `fan` (éventail de visuels distribué au scroll, pas d'onglets), le parcours en téléphones, la page de résultat en bloc `pages`.
- Rhinov Studio (06/11) : landings retail + immo + app agents. Versions du hero et écrans de l'app rendus depuis Figma (fichier
  « Studio Rhinov », équipe Rhinov), pleines pages capturées sur les prototypes codés (`sources/raw/vibecoded/Rhinov Studio`).
- Système Rhinov (09/11) : fichier Figma « Design System » (équipe Rhinov). Aucune page de la charte PDF (mention « Document confidentiel »).
  Bloc `foundations` (logos, co-brand, couleurs et typographie en vrai HTML). Options de bloc ajoutées : `features` : `tall` (rangées hautes), item `pad` (marge autour de l'image) ; `slides` : item `pos` ; `pages` : `title`.
- **Features en 3D** (item `model`, Vinyl Run puis MFT) : des modèles pâte à modeler faits par `scripts/blender/make-features.py`
  (GLB Draco de 20 à 60 Ko + une affiche WebP transparente, `--glb-only` pour ne refaire que les modèles), animés en temps réel
  par `src/feature3d.js` : UN canvas fixe pour toute la page, chaque modèle dessiné dans le cadre de sa tuile (flottement,
  oscillation, se tourne vers le curseur, grossit au survol, parallaxe au scroll), rien hors écran, chargé à l'approche.
  Sur tuiles claires, `soft: true` sur le bloc `features` (MFT) : lumière douce, sinon les couleurs de marque délavent.
- **Bloc live** (Rhinov Studio) : les vrais prototypes en iframe (`assets/rhinov-studio/live`), rendus à 1440 / 390 px puis réduits
  au cadre, onglets, chargés à l'approche puis jamais rechargés en scrollant : hors écran ils sont en pause, et un seul
  cadre tourne à la fois (celui qu'on survole). Chaque prototype doit passer par `scripts/patch-live.mjs` (pause + densité
  réduite dans le cadre ; fait par `npm run labo`, à relancer à la main sur un nouveau prototype). Au téléphone, le mobile seul.
  Le cadre bureau tient entier sous le header (100svh − 200 px). Au chargement (`tameFrame`, blocks.js) : barres de
  défilement masquées dans les cadres, et la molette passe à la page quand le prototype ne peut plus défiler (sans ça, un
  prototype plein écran piégeait le scroll). Le curseur de la page s'efface au-dessus d'une iframe. Par onglet : `hint`,
  `mobile: false` (pas de mobile au bureau, le navigateur prend toute la largeur ; seuls les cadres affichés se chargent).
  Onglets en cartes (numéro, nom, ligne `sum`), voile « chargement » levé quand le prototype tourne fluide (~24 images
  < 34 ms, 6 s max), lien « Ouvrir dans un onglet » dans la barre du navigateur.
- **Maisons du Monde · Labo** (06/11) : trois prototypes en live, du plus léger au plus lourd pour que le premier charge vite (24 h à la maison, la Visite sans
  mobile, Pièce Rare), puis un
  bloc par prototype : la collection en 3D (meubles de Pièce Rare dans le bento `features` + feature3d.js, affiche = le
  détourage de la carte), le diaporama des pièces de la Visite, le jour / la nuit de 24 h. Les deux copies de Pièce Rare
  (bureau, mobile) ont chacune leur sauvegarde (clé localStorage selon la largeur, patchée par le script). `npm run labo` (`scripts/make-mdm-labo.mjs`) recopie les sources
  (`sources/raw/vibecoded`) dans `assets/mdm-labo/live` en les allégeant (meubles .glb en Draco + textures ≤ 1024 px, scènes
  et produits en WebP : 37 → 22 Mo) et refait `assets/mdm-labo/rooms`. Ne pas retoucher les copies : refaire depuis les sources.
  Carte : la pièce de nuit de 24 h + une vraie carte Pièce Rare (rendue par le code du prototype, `sources/cards/mdm-labo`).
- **Rassembler** les projets cohérents en un seul (ex. Rhinov Studio = landing retail + landing immo + app) plutôt que
  multiplier les cartes.
- **Visuel de carte** (`card`, 3:5) : une image qui illustre le projet avec élégance et donne envie de cliquer sans tout
  dévoiler. Jamais une capture de page d'accueil ou un écran pris au hasard.
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
- **Rideau** entre pages : piloté par GSAP en yPercent uniquement (un transform CSS s'y ajoutait) ; la page d'arrivée naît
  couverte (`html.came`, script et style inline du shell).
- Faits vérifiés uniquement (repos, sites live, kit de marque). Chiffres MFT à revérifier.

## 3D, son, motion

- `src/scenes3d.js` (three.js en différé), modèles dans `assets/3d/` : `booster.glb` (objets Pack + Strip ; texture
  `pack-tex.jpg` recto à gauche / verso à droite, faite par `npm run booster` qui remet l'image dans le .glb et refait le repli
  2D `pack-front.webp`, et le nombre de projets du paquet suit `PROJECTS`), `skull.glb`. Sources Blender et scans hors du site : `sources/` (`hyena-plaque.blend`) ; les fichiers bruts trop lourds pour git dans `sources/raw/` (ignoré), seule leur version allégée va dans `assets/`. Décodeur Draco local `assets/3d/draco/`.
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
