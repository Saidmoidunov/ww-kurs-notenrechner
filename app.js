// ---------- Subjects ----------
const SUBJECTS = {
  1: ["Deutsch", "Mathematik", "VWL", "Informatik", "Englisch", "Wirtschaftspsychologie"],
  2: ["Deutsch", "Mathematik", "BWL", "Informatik", "Englisch", "Wirtschaftspsychologie"],
};

// ---------- Quotes (German) ----------
const QUOTES = [
  "Disziplin schlägt Motivation, wenn Motivation fehlt.",
  "Kleine Schritte führen zu großen Ergebnissen.",
  "Nicht perfekt sein – konsequent sein.",
  "Du musst nicht schnell sein. Du musst nur dranbleiben.",
  "Erfolg ist die Summe kleiner Anstrengungen – jeden Tag.",
  "Wenn es schwer wird, bist du auf dem richtigen Weg.",
  "Konstanz ist eine Superpower.",
  "Heute lernen, morgen gewinnen.",
  "Fokus ist wichtiger als Talent.",
  "Ein gutes Ergebnis beginnt mit einem guten Plan."
];

// ---------- Storage ----------
const KEY = "wwkurs_v1";
function load() { try { return JSON.parse(localStorage.getItem(KEY)) ?? {}; } catch { return {}; } }
function save(data) { localStorage.setItem(KEY, JSON.stringify(data)); }
function ensureSem(data, sem) { if (!data[sem]) data[sem] = { subjects: {}, targets: {} }; return data[sem]; }
function ensureSubject(semData, subject) { if (!semData.subjects[subject]) semData.subjects[subject] = []; return semData.subjects[subject]; }

// ---------- Helpers ----------
function parseNum(v) { return Number(String(v ?? "").replace(",", ".").trim()); }
function clampNote(x) { return Math.max(1.0, Math.min(5.0, x)); }

// Rundung: 4,5 -> 4 ; 4,6 -> 5  (half-down)
function roundHalfDown(x) {
  const base = Math.floor(x);
  const frac = x - base;
  return (frac <= 0.5) ? base : base + 1;
}

function calc(list) {
  const sumW = list.reduce((a, it) => a + it.weight, 0);
  const sumNW = list.reduce((a, it) => a + it.note * it.weight, 0);
  if (sumW <= 0) return { sumW: 0, sumNW: 0, raw: null, rounded: null, status: "—" };
  const raw = sumNW / sumW;
  const rounded = roundHalfDown(raw);
  const status = (rounded <= 4) ? "bestanden ✅" : "nicht bestanden ❌";
  return { sumW, sumNW, raw, rounded, status };
}

// Zielnote „… oder besser“: gerundet <= target  <=> raw <= target + 0.5
function neededForTarget(list, target) {
  const { sumW, sumNW } = calc(list);
  const remaining = 100 - sumW;
  if (remaining <= 0) return { remaining, needed: null, msg: "Keine offenen Prozente mehr." };

  const threshold = clampNote(target + 0.5);
  const needed = (threshold * 100 - sumNW) / remaining;

  if (needed < 1.0) return { remaining, needed: 1.0, msg: "Du liegst bereits im Zielbereich (oder besser)." };
  if (needed > 5.0) return { remaining, needed: 5.0, msg: "Selbst mit 5,0 auf dem Rest wird es knapp." };
  return { remaining, needed: clampNote(needed), msg: null };
}

// ---------- UI ----------
const el
