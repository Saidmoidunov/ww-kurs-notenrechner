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

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {};
  } catch {
    return {};
  }
}

function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

function ensureSem(data, sem) {
  if (!data[sem]) {
    data[sem] = { subjects: {} };
  }

  if (!data[sem].subjects) {
    data[sem].subjects = {};
  }

  return data[sem];
}

function ensureSubject(semData, subject) {
  if (!semData.subjects[subject]) {
    semData.subjects[subject] = [];
  }

  return semData.subjects[subject];
}

function parseNum(v) {
  return Number(String(v ?? "").replace(",", ".").trim());
}

function clampNote(x) {
  return Math.max(1.0, Math.min(5.0, x));
}

// Немисче нормалдуу тегеректөө:
// 2,4 -> 2
// 2,5 -> 3
// 2,6 -> 3
function roundGerman(x) {
  return Math.round(x);
}

function calc(list) {
  const sumW = list.reduce((a, it) => a + it.weight, 0);
  const sumNW = list.reduce((a, it) => a + it.note * it.weight, 0);

  if (sumW <= 0) {
    return {
      raw: null,
      rounded: null,
      status: "—"
    };
  }

  const raw = sumNW / sumW;
  const rounded = roundGerman(raw);
  const status = rounded <= 4 ? "bestanden ✅" : "nicht bestanden ❌";

  return {
    raw,
    rounded,
    status
  };
}

const elSemester = document.getElementById("semester");
const elSubject = document.getElementById("subject");
const elTitle = document.getElementById("title");
const elNote = document.getElementById("note");
const elWeight = document.getElementById("weight");
const elList = document.getElementById("list");
const elResult = document.getElementById("result");
const elMotivation = document.getElementById("motivationBox");

document.getElementById("btnMotivation").addEventListener("click", () => {
  elMotivation.textContent = "✨ " + QUOTES[Math.floor(Math.random() * QUOTES.length)];
});

document.getElementById("btnResetSubject").addEventListener("click", () => {
  const sem = Number(elSemester.value);
  const subject = elSubject.value;

  const data = load();
  const semData = ensureSem(data, sem);

  semData.subjects[subject] = [];

  save(data);
  render();
});

document.getElementById("btnAdd").addEventListener("click", () => {
  const sem = Number(elSemester.value);
  const subject = elSubject.value;
  const title = (elTitle.value || "").trim();

  let note = parseNum(elNote.value);
  let weight = parseNum(elWeight.value);

  if (title.length < 2) {
    return alert("Bitte einen Namen eingeben (mind. 2 Zeichen).");
  }

  if (!Number.isFinite(note)) {
    return alert("Bitte eine gültige Note eingeben (z.B. 3,3).");
  }

  if (!Number.isFinite(weight)) {
    return alert("Bitte eine gültige Gewichtung eingeben (z.B. 40).");
  }

  note = clampNote(note);

  if (weight < 10 || weight > 100) {
    return alert("Gewichtung muss zwischen 10 und 100 liegen.");
  }

  const data = load();
  const semData = ensureSem(data, sem);
  const list = ensureSubject(semData, subject);

  // 100% ашып кетсе дагы билдирүү чыкпайт.
  list.push({
    title,
    note,
    weight,
    ts: Date.now()
  });

  save(data);

  elTitle.value = "";
  elNote.value = "";
  elWeight.value = "";

  render();
});

document.getElementById("btnExport").addEventListener("click", () => {
  const data = load();

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = "wwkurs-export.json";
  a.click();

  URL.revokeObjectURL(url);
});

document.getElementById("importFile").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];

  if (!file) return;

  const text = await file.text();

  try {
    const data = JSON.parse(text);

    localStorage.setItem(KEY, JSON.stringify(data));

    alert("Import erfolgreich!");
    render();
  } catch {
    alert("Import fehlgeschlagen: Datei ist kein gültiges JSON.");
  }
});

elSemester.addEventListener("change", () => {
  populateSubjects();
  render();
});

elSubject.addEventListener("change", render);

// DELETE handler
elList.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-del]");

  if (!btn) return;

  const idx = Number(btn.getAttribute("data-del"));
  const sem = Number(elSemester.value);
  const subject = elSubject.value;

  const data = load();
  const semData = ensureSem(data, sem);
  const list = ensureSubject(semData, subject);

  if (!Number.isFinite(idx) || idx < 0 || idx >= list.length) return;

  if (!confirm("Eintrag wirklich löschen?")) return;

  list.splice(idx, 1);

  save(data);
  render();
});

function populateSubjects() {
  const sem = Number(elSemester.value);
  const subjects = SUBJECTS[sem];

  elSubject.innerHTML = "";

  for (const s of subjects) {
    const opt = document.createElement("option");

    opt.value = s;
    opt.textContent = s;

    elSubject.appendChild(opt);
  }
}

function render() {
  const sem = Number(elSemester.value);
  const subject = elSubject.value;

  const data = load();
  const semData = ensureSem(data, sem);
  const list = ensureSubject(semData, subject);

  if (list.length === 0) {
    elList.innerHTML = `<p class="muted">Noch keine Einträge für <b>${subject}</b>.</p>`;
  } else {
    const rows = list.map((it, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${escapeHtml(it.title)}</td>
        <td>${it.note.toFixed(2).replace(".", ",")}</td>
        <td>${it.weight}%</td>
        <td style="text-align:right;">
          <button class="mini danger" data-del="${idx}" type="button">🗑️</button>
        </td>
      </tr>
    `).join("");

    elList.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Leistung</th>
            <th>Note</th>
            <th>Gew.</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  const res = calc(list);

  let html = `
    <div><b>${subject}</b> (Semester ${sem})</div>
  `;

  if (res.raw == null) {
    html += `<div class="muted">Noch nichts zu berechnen.</div>`;
  } else {
    html += `
      <div>Durchschnitt (roh): <b>${res.raw.toFixed(1).replace(".", ",")}</b></div>
      <div>Gerundet: <b>${res.rounded}</b> <span class="badge ${res.rounded <= 4 ? "ok" : "no"}">${res.status}</span></div>
    `;
  }

  elResult.innerHTML = html;

  save(data);
}

function escapeHtml(s) {
  return (s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

populateSubjects();
render();
    <section class="card">
      <h2>2) Leistung hinzufügen</h2>

      <label>Name der Leistung</label>
      <input id="title" placeholder="z.B. Klausur 1 / Präsentation / Test" />

      <div class="row">
        <div class="col">
          <label>Note (1,0–5,0)</label>
          <input id="note" placeholder="z.B. 3.3" inputmode="decimal" />
        </div>

        <div class="col">
          <label>Gewichtung % (10–100)</label>
          <input id="weight" placeholder="z.B. 40" inputmode="decimal" />
        </div>
      </div>

      <button id="btnAdd" type="button">➕ Speichern</button>

      <hr />

      <div class="row">
        <button id="btnExport" type="button">⬇️ Export (JSON)</button>

        <label class="file">
          ⬆️ Import (JSON)
          <input id="importFile" type="file" accept="application/json" />
        </label>
      </div>

      <p class="muted small">Automatische Speicherung im Browser (localStorage).</p>
    </section>

    <section class="card span2">
      <h2>3) Übersicht</h2>
      <div id="list"></div>
      <div id="result" class="result"></div>
    </section>
  </main>

  <footer class="wrap footer">
    <div class="brand">
      <div class="logo" aria-hidden="true">SBM</div>
      <div class="brandText">
        <div class="brandLine">Made by <b>Saidburkan Moydunov</b></div>
        <div class="muted small">WW-Kurs Notenrechner · Studienkolleg</div>
      </div>
    </div>
  </footer>

  <script src="app.js"></script>
</body>
</html>
