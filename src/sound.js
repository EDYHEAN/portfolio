// Sons d'interface, 100 % synthétisés en Web Audio (0 Ko d'assets).
// Règles : rien avant un premier geste (contrainte navigateur), toggle visible mémorisé,
// pas de son de survol au tactile, un son de survol max toutes les 60 ms, hauteur qui varie de ±4 %.
let ctx = null;
let master = null;
let enabled = true;
let lastHover = 0;

try { enabled = localStorage.getItem('edy-sound') !== 'off'; } catch { /* stockage indispo */ }

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
// Le premier geste "arme" l'audio.
['pointerdown', 'keydown'].forEach((ev) => addEventListener(ev, () => ensure(), { once: true, passive: true }));

const vary = (f) => f * (1 + (Math.random() - 0.5) * 0.08);

function env(g, t, peak, attack, decay) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}
function osc(type, f0, f1, dur, peak, t, attack = 0.002) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  env(g, t, peak, attack, dur);
  o.connect(g).connect(master);
  o.start(t); o.stop(t + attack + dur + 0.02);
}
let noiseBuf = null;
function noise(dur, peak, t, filter) {
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const s = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
  s.buffer = noiseBuf;
  f.type = filter.type; f.frequency.value = filter.f; if (filter.q) f.Q.value = filter.q;
  env(g, t, peak, 0.002, dur);
  s.connect(f).connect(g).connect(master);
  s.start(t); s.stop(t + dur + 0.03);
}

const SOUNDS = {
  // Survol : tick feutré (triangle qui glisse + souffle aigu très court).
  tick(t) { osc('triangle', vary(1800), 1200, 0.03, 0.05, t); noise(0.008, 0.015, t, { type: 'highpass', f: 4000 }); },
  // Appui : clic de touche + petit "thump" grave.
  press(t) { noise(0.012, 0.1, t, { type: 'bandpass', f: 2500, q: 1.5 }); osc('sine', vary(140), 60, 0.06, 0.12, t); },
  // Relâché : clic aigu, très léger.
  release(t) { noise(0.008, 0.04, t, { type: 'bandpass', f: 3200, q: 1.5 }); },
  // Copié : ding en quinte.
  ding(t) { osc('sine', 880, null, 0.18, 0.045, t, 0.003); osc('sine', 1320, null, 0.18, 0.045, t + 0.07, 0.003); },
  // Coup de tampon (plaque) : coup sourd + grain de papier.
  stamp(t) { osc('sine', 90, 50, 0.12, 0.16, t); noise(0.05, 0.05, t, { type: 'lowpass', f: 900 }); },
  // Déchirure de l'emballage du booster : bruit filtré qui monte, en deux temps.
  tear(t) {
    const s = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    noise(0.001, 0.0001, t, { type: 'lowpass', f: 100 }); // initialise le buffer de bruit
    s.buffer = noiseBuf; f.type = 'bandpass'; f.Q.value = 2.2;
    f.frequency.setValueAtTime(1800, t); f.frequency.exponentialRampToValueAtTime(6500, t + 0.26);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.02);
    g.gain.setValueAtTime(0.05, t + 0.12); g.gain.exponentialRampToValueAtTime(0.11, t + 0.16); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    s.connect(f).connect(g).connect(master); s.start(t); s.stop(t + 0.32);
  },
  // Carte distribuée / retournée : souffle de carton (passe-bas qui descend).
  deal(t) {
    const s = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    noise(0.001, 0.0001, t, { type: 'lowpass', f: 100 });
    s.buffer = noiseBuf; f.type = 'lowpass';
    f.frequency.setValueAtTime(vary(3000), t); f.frequency.exponentialRampToValueAtTime(700, t + 0.07);
    env(g, t, 0.07, 0.003, 0.07); s.connect(f).connect(g).connect(master); s.start(t); s.stop(t + 0.1);
  },
  // Tournis (la hyène a trop tourné) : une vrille qui descend en tremblant, puis des petits oiseaux de dessin animé.
  dizzy(t) {
    const o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), depth = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(720, t); o.frequency.exponentialRampToValueAtTime(240, t + 0.85);
    lfo.frequency.value = 11; depth.gain.value = 45; lfo.connect(depth).connect(o.frequency);
    env(g, t, 0.07, 0.02, 0.85); o.connect(g).connect(master);
    o.start(t); lfo.start(t); o.stop(t + 0.9); lfo.stop(t + 0.9);
    for (let i = 0; i < 3; i++) { const s = t + 0.5 + i * 0.2; osc('sine', vary(2300), 3400, 0.05, 0.03, s); osc('sine', vary(2700), 3900, 0.045, 0.024, s + 0.075); }
  },
  // Ouverture d'un projet : l'aiguille qui se pose + quelques crépitements.
  needle(t) {
    osc('sine', 55, 45, 0.08, 0.1, t);
    for (let i = 0; i < 7; i++) noise(0.0015, 0.03 + Math.random() * 0.03, t + 0.06 + Math.random() * 0.4, { type: 'lowpass', f: 5000 });
  },
};

export function play(name, e) {
  if (!enabled) return;
  if (name === 'tick') {
    if (e && e.pointerType && e.pointerType !== 'mouse') return; // pas de survol au tactile
    const now = performance.now();
    if (now - lastHover < 60) return;
    lastHover = now;
  }
  if (!ensure() || ctx.state !== 'running') return;
  SOUNDS[name]?.(ctx.currentTime + 0.005);
}

export const isSoundOn = () => enabled;
export function setSound(on) {
  enabled = on;
  try { localStorage.setItem('edy-sound', on ? 'on' : 'off'); } catch { /* rien */ }
  if (on) { ensure(); play('ding'); }
}

/** Branche les sons sur tout élément [data-sound] (hover = tick, appui = press/release). */
export function bindSounds(root = document) {
  root.addEventListener('pointerover', (e) => {
    const el = e.target.closest?.('[data-sound]');
    if (!el || el.contains(e.relatedTarget)) return;
    play('tick', e);
  });
  root.addEventListener('pointerdown', (e) => { if (e.target.closest?.('[data-sound]')) play('press'); });
  root.addEventListener('pointerup', (e) => { if (e.target.closest?.('[data-sound]')) play('release'); });
  root.addEventListener('focusin', (e) => { if (e.target.matches?.('[data-sound]:focus-visible')) play('tick'); });
}
