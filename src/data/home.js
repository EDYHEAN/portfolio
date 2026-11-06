const T = (fr, en) => ({ fr, en });

// Contact. Le mail n'est jamais écrit en clair dans la page (anti robots) : morceaux inversés, assemblés au clic.
export const CONTACT = { mail: ['draegirt.nahoj','moc.liamg'], linkedin: 'https://www.linkedin.com/in/hyrule-hero/' };

// Parcours : le poste et la boîte d'abord, la date en second.
// photo : déposer les photos dans assets/me/ (nom = clé `photo`). Sans fichier, un cadre vide s'affiche.
export const PATH = [
  { photo: 'me/2013.jpg', years: '2013 – 2018', org: 'ECV Bordeaux', role: T('Master Web Design', 'Master in Web Design'), d: T('Communication visuelle, spécialité web.', 'Visual communication, web major.') },
  { photo: 'me/2018.jpg', years: '2018 – 2020', org: 'Intento & Fière Allure', role: T('Web Designer', 'Web Designer'), d: T('Sites, branding et print pour deux start-ups bordelaises.', 'Sites, branding and print for two Bordeaux start-ups.') },
  { photo: 'me/2020.jpg', years: '2020 – 2022', org: 'Infograpik', role: T('Motion Designer', 'Motion Designer'), d: T('Animation 2D pour Twitch, Activision, Microsoft.', '2D animation for Twitch, Activision, Microsoft.') },
  { photo: 'me/2023.jpg', years: '2023', org: 'Rhinov · Maisons du Monde', role: T('Graphic Designer', 'Graphic Designer'), d: T('Assets marketing et interfaces produit.', 'Marketing assets and product interfaces.') },
  { photo: 'me/2024.jpg', years: '2024', org: 'Rhinov · Maisons du Monde', role: T('Lead UI Designer', 'Lead UI Designer'), d: T('Interfaces web et mobile, design system.', 'Web and mobile interfaces, design system.') },
  { photo: 'me/2026.jpg', years: '2026', org: 'Rhinov · Maisons du Monde', role: T('Lead UI/UX', 'Lead UI/UX'), d: T('Pilotage UX des produits, entre produit et tech.', 'Leading product UX, between product and tech.') },
  { next: true, years: T('La suite', "What's next"), org: '', role: T('Votre équipe ?', 'Your team?'), d: T('Le prochain chapitre. On en parle ?', "The next chapter. Let's talk?") },
];

export const BRANDS = [
  { name: 'Maisons du Monde', src: 'maisonsdumonde/logo_mdm.svg', scale: 1.25 },
  { name: 'Rhinov', src: 'rhinov-rebrand/logo-rhinov.svg', scale: 1.7 },
  { name: 'Activision', src: 'Activision.svg', scale: 0.95 },
  { name: 'Samsung', src: 'Samsung.svg', scale: 0.7 },
  { name: 'Webedia', src: 'Webedia-logo-2022.svg', scale: 0.75 },
  { name: 'Lapeyre', src: 'lapeyre.svg', scale: 1.5 },
  { name: 'Ledvance', src: 'ledvance.svg', scale: 1.25 },
  { name: 'ixina', src: 'ixina.svg', scale: 0.85 },
];
