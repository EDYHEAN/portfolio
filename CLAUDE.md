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
  id:    'mon-projet',              // ⚠️ doit être identique à l'id dans PROJECTS
}
```

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

## ✅ Conventions

- Tout en **français** côté contenu.
- Couleur d'accent pilotée par le **hue slider** via les variables CSS
  `--blue-rgb` / `--blue-mid-rgb` / `--blue-deep-rgb` (et `--blue`, `--blue-mid`,
  `--blue-deep`). Pour qu'un élément suive l'accent, utilise ces variables.
- Mobile = `≤ 960px` : les pages projet passent en **bottom sheet** (le scroll y
  est natif ; le swipe-pour-fermer est limité à la poignée du haut).
- Commits en français, messages courts et descriptifs.
