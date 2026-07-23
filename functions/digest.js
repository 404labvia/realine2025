// functions/digest.js
// Digest degli aggiornamenti (SOLO note ufficiali, mai task) delle pratiche:
//  - un'email per agenzia con le sole proprie pratiche (standard + private) e, in coda,
//    gli aggiornamenti dei propri accessi agli atti ancora aperti;
//  - un'email per cliente/committente (campo emailCliente sulla pratica) con la sola sua
//    pratica (gli accessi agli atti NON entrano: non hanno un'email committente).
// Ogni email riporta TUTTE le note ufficiali della pratica (nessun filtro settimanale).
// Invio tramite Resend (https://resend.com) via fetch nativo — nessuna dipendenza npm.
// Usato sia dalla funzione schedulata (giovedì 17:00 Europe/Rome) sia dal callable "Invia ora".

const RESEND_ENDPOINT = "https://api.resend.com/emails";

// Mittente: dominio realine.it registrato su Resend (region eu-west-1).
// Gli invii falliscono con 403 finché i record DNS DKIM/SPF non sono verificati.
const DIGEST_FROM =
  process.env.DIGEST_FROM || "Realine Studio <amministrazione@realine.it>";

// Copia nascosta di archivio su ogni invio reale (non in modalità test):
// arriva nella casella dello studio come registro delle email inviate.
const DIGEST_BCC = process.env.DIGEST_BCC || "amministrazione@realine.it";

// Logo bianco su sfondo trasparente, servito da Firebase Hosting
// (file realine2025/public/logo-email.png).
const LOGO_URL =
  process.env.DIGEST_LOGO_URL || "https://studio-a07a4.web.app/logo-email.png";

// Etichette degli step workflow, specchio di `workflowSteps` in
// src/pages/PratichePage/utils/praticheUtils.js (identiche nella variante privato).
// Le functions non possono importare da src/: tenere allineato a mano.
const STEP_LABELS = {
  intestazione: "Pratica",
  dettagliPratica: "Dettagli Pratica",
  inizioPratica: "Inizio Pratica",
  accessoAtti: "Accesso atti",
  sopralluogo: "Sopralluogo",
  incarico: "Incarico",
  acconto1: "Acconto 30%",
  espletamentoPratica1: "Completamento Pratica",
  acconto2: "Secondo Acconto 30%",
  presentazionePratica: "Presentazione Pratica",
  saldo: "Saldo 40%",
};

// Fasi degli accessi agli atti, specchio di FASI_PROGRESSO_CONFIG in
// src/pages/AccessiAgliAttiPage/components/NewAccessoAttiForm.js (stesso ordine).
// Le functions non possono importare da src/: tenere allineato a mano.
const FASI_ACCESSO = [
  {
    label: "Documenti/Delega",
    flag: "faseDocumentiDelegaCompletata",
    data: "dataFaseDocumentiDelega",
  },
  {
    label: "Richiesta inviata",
    flag: "faseRichiestaInviataCompletata",
    data: "dataFaseRichiestaInviata",
  },
  {
    label: "Documenti ricevuti",
    flag: "faseDocumentiRicevutiCompletata",
    data: "dataFaseDocumentiRicevuti",
  },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Pausa tra un invio e l'altro: il rate limit Resend è 2 req/s.
const SEND_DELAY_MS = 600;

// Specchio di safeDate in src/pages/PratichePage/utils/exportUtils.js:
// accetta ISO string e Firestore Timestamp.
function safeDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function formatDateIt(date) {
  return date.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Rome",
  });
}

// "15 Luglio 2026" — data estesa con mese maiuscolo, usata in oggetto e intestazione.
function formatDateLong(date) {
  const s = date.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Rome",
  });
  return s.replace(/ ([a-zà-ù])/i, (m, c) => ` ${c.toUpperCase()}`);
}

function esc(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Raccoglie da ogni pratica TUTTE le note UFFICIALI (mai i task, mai le noteInterne —
// workflow[stepId].noteInterne è l'array delle note interne, escluso per design).
// Nessun filtro temporale: si scartano solo le note vuote o senza data valida.
// Ritorna [{ praticaId, origine, agenzia, cliente, emailCliente, titolo, note: [{ stepLabel, text, date }] }]
function collectUpdates(pratiche) {
  const updates = [];
  for (const pratica of pratiche) {
    // Solo pratiche in corso: le pratiche chiuse (stato 'Completata') non entrano nel digest.
    if (pratica.stato === "Completata") continue;
    const workflow = pratica.workflow || {};
    const note = [];
    for (const stepId of Object.keys(workflow)) {
      const stepNotes = (workflow[stepId] && workflow[stepId].notes) || [];
      for (const n of stepNotes) {
        if (!n || !n.text || !String(n.text).trim()) continue;
        const d = safeDate(n.date);
        // Nessun filtro sulla finestra: si includono TUTTE le note ufficiali della pratica.
        // Si scarta solo la nota senza data valida (renderNoteList formatta n.date).
        if (!d) continue;
        note.push({ stepLabel: STEP_LABELS[stepId] || stepId, text: n.text, date: d });
      }
    }
    if (note.length === 0) continue;
    note.sort((a, b) => a.date - b.date);
    updates.push({
      praticaId: pratica.id,
      origine: pratica.origine,
      agenzia: pratica.agenzia || "",
      cliente: pratica.cliente || "",
      emailCliente: (pratica.emailCliente || "").trim(),
      titolo: `${pratica.indirizzo || "Senza indirizzo"} - ${(pratica.cliente || "N/D").toUpperCase()}`,
      note,
    });
  }
  return updates;
}

// Raccoglie gli aggiornamenti degli accessi agli atti ancora in lavorazione.
// Scarta: accessi completati, accessi già trasformati in pratica (i loro aggiornamenti
// proseguono sulla pratica) e accessi senza nessuna fase completata.
// Ritorna [{ accessoId, agenzia, titolo, fasi: [{ stepLabel, date }], note }]
function collectAccessiUpdates(accessi) {
  const updates = [];
  for (const accesso of accessi) {
    if (accesso.completata || accesso.spostatoInPratica) continue;

    const fasi = [];
    for (const fase of FASI_ACCESSO) {
      if (!accesso[fase.flag]) continue;
      const d = safeDate(accesso[fase.data]);
      if (!d) continue; // senza data valida la riga non è formattabile
      fasi.push({ stepLabel: fase.label, date: d });
    }
    if (fasi.length === 0) continue;

    updates.push({
      accessoId: accesso.id,
      agenzia: accesso.agenzia || "",
      titolo: `${accesso.indirizzo || "Senza indirizzo"} - ${(accesso.proprieta || "N/D").toUpperCase()}`,
      fasi,
      note: (accesso.note || "").trim(),
    });
  }
  return updates;
}

// Oggetto: "Aggiornamenti pratiche al 15 Luglio 2026 - Realine Studio [Barner Viareggio]".
// Il suffisso [agenzia] compare solo nelle email alle agenzie (per i committenti agenzia è assente).
function buildSubject(now, isTest, agenzia) {
  const prefix = isTest ? "[TEST] " : "";
  const suffix = agenzia ? ` [${agenzia}]` : "";
  return `${prefix}Aggiornamenti pratiche al ${formatDateLong(now)} - Realine Studio${suffix}`;
}

// Note: tabella 2 colonne "data | testo". La data resta su una colonna a sé (nowrap,
// allineata in alto); il testo nota va nella seconda cella così che, andando a capo,
// le righe successive restino allineate all'inizio del testo (rientro appeso), non sotto la data.
function renderNoteList(note) {
  const righe = note
    .map(
      (n) =>
        `<tr>
          <td style="padding:0 10px 6px 0;font-size:13px;line-height:1.6;color:#6b7280;white-space:nowrap;vertical-align:top">${formatDateIt(n.date)}</td>
          <td style="padding:0 0 6px;font-size:13px;line-height:1.6;color:#1f2937;vertical-align:top">${esc(n.text)}</td>
        </tr>`
    )
    .join("");
  return `<div style="padding:10px 16px 12px"><table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%"><tbody>${righe}</tbody></table></div>`;
}

function renderTestBanner(realRecipients) {
  return `<div style="background:#fef3c7;border:1px solid #f59e0b;color:#92400e;padding:10px 16px;font-size:12px;border-radius:6px;margin-bottom:16px">MODALITÀ TEST — destinatari reali: ${esc(realRecipients)}</div>`;
}

// Intestazione nera con logo bianco (max 150px), titolo e sottotitolo opzionale.
function renderHeader(title, subtitle) {
  return `<div style="background:#000000;color:#ffffff;padding:24px;border-radius:8px;text-align:center;margin-bottom:16px">
    <img src="${LOGO_URL}" alt="Realine Studio" width="90" height="101" style="display:block;width:90px;height:101px;margin:0 auto 12px">
    <h1 style="margin:0;font-size:20px;font-weight:bold">${esc(title)}</h1>
    ${subtitle ? `<p style="margin:6px 0 0;font-size:13px;color:#d1d5db">${esc(subtitle)}</p>` : ""}
  </div>`;
}

// Card di una pratica: intestazione VERDE CHIARO + elenco note.
function renderPraticaCard(gruppo) {
  return `<div style="border:1px solid #bbf7d0;border-radius:8px;margin-bottom:28px;overflow:hidden">
    <div style="background:#dcfce7;padding:16px;font-weight:bold;font-size:14px;color:#14532d">${esc(gruppo.titolo)}</div>
    ${renderNoteList(gruppo.note)}
  </div>`;
}

// Card di un accesso agli atti: stesso layout della card pratica ma intestazione GIALLO
// AMBRA invece che verde, così a colpo d'occhio non si confonde con le pratiche.
// Righe "data — nome step" e, in coda, il campo note.
function renderAccessoCard(gruppo) {
  const righe = gruppo.fasi
    .map(
      (f) =>
        `<p style="margin:0 0 6px;font-size:13px;line-height:1.6;color:#1f2937"><span style="color:#6b7280">${formatDateIt(f.date)}</span> — ${esc(f.stepLabel)}</p>`
    )
    .join("");
  const note = gruppo.note
    ? `<p style="margin:8px 0 0;font-size:13px;line-height:1.6;color:#1f2937"><span style="color:#6b7280">Note:</span> ${esc(gruppo.note)}</p>`
    : "";
  return `<div style="border:1px solid #fde68a;border-radius:8px;margin-bottom:28px;overflow:hidden">
    <div style="background:#fef9c3;padding:16px;font-weight:bold;font-size:14px;color:#854d0e">${esc(gruppo.titolo)}</div>
    <div style="padding:10px 16px 12px">${righe}${note}</div>
  </div>`;
}

// Sezione accessi agli atti, sotto il blocco delle pratiche. Omessa se vuota.
function renderAccessiSection(gruppiAccessi) {
  if (!gruppiAccessi || gruppiAccessi.length === 0) return "";
  return `<h2 style="margin:8px 0 16px;font-size:16px;font-weight:bold;color:#854d0e;border-top:1px solid #e5e7eb;padding-top:20px">Aggiornamenti accessi agli atti</h2>
    ${gruppiAccessi.map(renderAccessoCard).join("")}`;
}

function renderAgencyDigestHtml({ agenzia, gruppi, gruppiAccessi, now, testRecipients }) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;padding:8px">
    ${renderHeader(`Aggiornamenti pratiche al ${formatDateLong(now)}`, agenzia)}
    ${testRecipients ? renderTestBanner(testRecipients) : ""}
    ${gruppi.map(renderPraticaCard).join("")}
    ${renderAccessiSection(gruppiAccessi)}
  </div>`;
}

function renderClientDigestHtml({ gruppo, now, testRecipients }) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;padding:8px">
    ${renderHeader(`Aggiornamenti pratica al ${formatDateLong(now)}`, null)}
    ${testRecipients ? renderTestBanner(testRecipients) : ""}
    <p style="margin:0 0 12px;font-size:13px;color:#1f2937">Gentile ${esc(gruppo.cliente || "Cliente")},<br>di seguito gli aggiornamenti relativi alla sua pratica.</p>
    ${renderPraticaCard(gruppo)}
  </div>`;
}

async function sendResendEmail({ apiKey, from, to, subject, html, bcc }) {
  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html, ...(bcc ? { bcc } : {}) }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${body}`);
  }
  return res.json(); // { id }
}

// Orchestratore: raccoglie, raggruppa, invia (agenzie poi clienti), logga su digest_log.
// testEmail impostata = tutte le email vanno a quell'indirizzo (le config attiva/emails vengono ignorate).
async function runDigest(db, { trigger, testEmail = null, requestedBy = null, now = new Date() }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Secret RESEND_API_KEY mancante.");

  // Pratiche standard + private (le private hanno una propria agenzia selezionata)
  // e accessi agli atti (blocco in coda all'email di agenzia).
  const [snapStandard, snapPrivato, snapAccessi] = await Promise.all([
    db.collection("pratiche").get(),
    db.collection("pratiche_privato").get(),
    db.collection("accessi_atti").get(),
  ]);
  const pratiche = [
    ...snapStandard.docs.map((d) => ({ id: d.id, origine: "standard", ...d.data() })),
    ...snapPrivato.docs.map((d) => ({ id: d.id, origine: "privato", ...d.data() })),
  ]
    // Solo la nuova gestione (da Settembre): le pratiche storiche non generano digest.
    .filter((p) => p.gestione === "nuova");

  const updates = collectUpdates(pratiche);

  const accessi = snapAccessi.docs.map((d) => ({ id: d.id, ...d.data() }));
  const accessiUpdates = collectAccessiUpdates(accessi);

  // Config agenzie: doc ID = nome esatto agenzia.
  const agenzieSnap = await db.collection("agenzie").get();
  const agenzieConfig = new Map(agenzieSnap.docs.map((d) => [d.id, d.data()]));

  // ---- Fase agenzie: raggruppa per agenzia (escluse falsy e sentinella 'PRIVATO') ----
  const byAgency = new Map();
  for (const u of updates) {
    if (!u.agenzia || u.agenzia === "PRIVATO") continue;
    if (!byAgency.has(u.agenzia)) byAgency.set(u.agenzia, []);
    byAgency.get(u.agenzia).push(u);
  }

  // Stesso raggruppamento per gli accessi agli atti.
  const accessiByAgency = new Map();
  for (const a of accessiUpdates) {
    if (!a.agenzia || a.agenzia === "PRIVATO") continue;
    if (!accessiByAgency.has(a.agenzia)) accessiByAgency.set(a.agenzia, []);
    accessiByAgency.get(a.agenzia).push(a);
  }

  // Destinatari = unione delle agenzie: un'agenzia con soli accessi (nessuna nota
  // pratica) deve comunque ricevere la sua email.
  const agenzieDaInviare = new Set([...byAgency.keys(), ...accessiByAgency.keys()]);

  const agencyResults = [];
  const unknownAgencies = [];
  for (const agenzia of agenzieDaInviare) {
    const gruppi = byAgency.get(agenzia) || [];
    const gruppiAccessi = accessiByAgency.get(agenzia) || [];
    const config = agenzieConfig.get(agenzia);
    if (!config) unknownAgencies.push(agenzia);
    const noteCount = gruppi.reduce((s, g) => s + g.note.length, 0);
    const base = {
      agenzia,
      praticheCount: gruppi.length,
      noteCount,
      accessiCount: gruppiAccessi.length,
    };
    try {
      let to;
      if (testEmail) {
        to = [testEmail];
      } else if (!config || config.attiva !== true) {
        agencyResults.push({ ...base, status: "skipped_inactive" });
        continue;
      } else if (!Array.isArray(config.emails) || config.emails.length === 0) {
        agencyResults.push({ ...base, status: "skipped_no_email" });
        continue;
      } else {
        to = config.emails;
      }
      const realRecipients = testEmail
        ? (config && Array.isArray(config.emails) && config.emails.join(", ")) || "(non configurati)"
        : null;
      const { id } = await sendResendEmail({
        apiKey,
        from: DIGEST_FROM,
        to,
        bcc: testEmail ? null : [DIGEST_BCC],
        subject: buildSubject(now, !!testEmail, agenzia),
        html: renderAgencyDigestHtml({
          agenzia,
          gruppi,
          gruppiAccessi,
          now,
          testRecipients: realRecipients,
        }),
      });
      agencyResults.push({ ...base, to, status: "sent", resendId: id });
    } catch (err) {
      console.error(`Digest agenzia "${agenzia}" fallito:`, err.message);
      agencyResults.push({ ...base, status: "error", error: err.message });
    }
    await sleep(SEND_DELAY_MS);
  }

  // ---- Fase clienti: un invio per pratica con emailCliente valorizzata ----
  const clientResults = [];
  for (const gruppo of updates.filter((u) => u.emailCliente)) {
    const base = {
      praticaId: gruppo.praticaId,
      titolo: gruppo.titolo,
      emailCliente: gruppo.emailCliente,
      noteCount: gruppo.note.length,
    };
    try {
      if (!EMAIL_REGEX.test(gruppo.emailCliente)) {
        clientResults.push({ ...base, status: "skipped_invalid_email" });
        continue;
      }
      const to = testEmail ? [testEmail] : [gruppo.emailCliente];
      const { id } = await sendResendEmail({
        apiKey,
        from: DIGEST_FROM,
        to,
        bcc: testEmail ? null : [DIGEST_BCC],
        subject: buildSubject(now, !!testEmail),
        html: renderClientDigestHtml({
          gruppo,
          now,
          testRecipients: testEmail ? gruppo.emailCliente : null,
        }),
      });
      clientResults.push({ ...base, to, status: "sent", resendId: id });
    } catch (err) {
      console.error(`Digest cliente pratica "${gruppo.praticaId}" fallito:`, err.message);
      clientResults.push({ ...base, status: "error", error: err.message });
    }
    await sleep(SEND_DELAY_MS);
  }

  const allResults = [...agencyResults, ...clientResults];
  const totals = {
    agencies: agencyResults.length,
    clients: clientResults.length,
    accessi: accessiUpdates.length,
    sent: allResults.filter((r) => r.status === "sent").length,
    skipped: allResults.filter((r) => r.status.startsWith("skipped")).length,
    errors: allResults.filter((r) => r.status === "error").length,
    unknownAgencies,
  };

  const summary = {
    runAt: now.toISOString(),
    trigger,
    testEmail,
    requestedBy,
    agencyResults,
    clientResults,
    totals,
  };
  await db.collection("digest_log").add(summary);
  console.log("Digest completato:", JSON.stringify(totals));
  return summary;
}

module.exports = {
  runDigest,
  // Esportati solo per generare anteprime/test del layout, non usati dalle functions.
  _preview: { buildSubject, renderAgencyDigestHtml, renderClientDigestHtml },
};
