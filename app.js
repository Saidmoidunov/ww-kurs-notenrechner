const SUBJECTS = {
  1: ["Deutsch", "Mathematik", "VWL", "Informatik", "Englisch", "Wirtschaftspsychologie"],
  2: ["Deutsch", "Mathematik", "BWL", "Informatik", "Englisch", "Wirtschaftspsychologie"],
};

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

const KEY = "wwkurs_v1";
function load() { try { return JSON.parse(localStorage.getItem(KEY)) ?? {}; } catch { return {}; } }
function save(data) { localStorage.setItem(KEY, JSON.stringify(data)); }

function ensureSem(data, sem) { if (!data[sem]) data[sem] = { subjects: {}, targets: {} }; return data[sem]; }
function ensureSubject(semData, subject) { if (!semData.subjects[subject]) semData.subjects[subject] = []; return semData.subjects[subject]; }

function parseNum(v) { return Number(String(v ?? "").replace(",", ".").trim()); }
function clampNote(x) { return Math.max(1.0, Math.min(5.0, x)); }

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

function calcEndNote(subjects) {
  let totalSumW = 0;
  let totalSumNW = 0;

  subjects.forEach(subject => {
    const result = calc(subject.grades);
    totalSumW += result.sumW;
    totalSumNW += result.sumNW;
  });

  const finalRaw = totalSumNW / totalSumW;
  const finalRounded = roundHalfDown(finalRaw);

  return { finalRaw, finalRounded };
}

function neededForTarget(subjects, target) {
  const { sumW, sumNW } = calc(subjects);
  const remaining = 100 - sumW;
  const threshold = clampNote(target + 0.5);

  const needed = (threshold * 100 - sumNW) / remaining;
  return { needed: Math.max(1, Math.min(needed, 5)), remaining };
}

document.getElementById("btnMotivation").addEventListener("click", () => {
  const elMotivation = document.getElementById("motivationBox");
  elMotivation.textContent = "✨ " + QUOTES[Math.floor(Math.random() * QUOTES.length)];
});

document.getElementById("btnCalculate").addEventListener("click", () => {
  const subjects = [
    { name: 'Deutsch', grades: [{ note: 2.5, weight: 40 }, { note: 3.0, weight: 60 }] },
    { name: 'Mathematik', grades: [{ note: 3.5, weight: 70 }, { note: 2.5, weight: 30 }] },
    { name: 'VWL', grades: [{ note: 4.0, weight: 50 }, { note: 4.5, weight: 50 }] },
    { name: 'BWL', grades: [{ note: 3.0, weight: 80 }, { note: 3.2, weight: 20 }] },
  ];

  const finalGrade = calcEndNote(subjects);
  document.getElementById("result").innerHTML = `
    <b>Endnote: </b>${finalGrade.finalRounded}
  `;
});
