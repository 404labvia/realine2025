// functions/index.js
// Runtime: Node.js 22 (impostato in firebase.json → functions.runtime).
// Cloud Functions callable per Google Calendar tramite Service Account.
// Nessun OAuth utente: il service account ha accesso permanente ai calendari
// condivisi con la sua email. La chiave JSON sta SOLO in Secret Manager (GOOGLE_SA_KEY),
// mai nel repo né nel browser.
//
// Sicurezza: ogni funzione richiede un utente Firebase autenticato la cui email
// sia presente nella collezione `allowedUsers` (stesso modello di firestore.rules).

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { google } = require("googleapis");
const { runDigest } = require("./digest");

initializeApp();
const db = getFirestore();

const RESEND_API_KEY = defineSecret("RESEND_API_KEY");

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];
const SA_SECRET = "GOOGLE_SA_KEY";

// ⚠️ DA COMPILARE: ID reale del calendario "REALINE Badalucco" (quello che il client
// chiama 'primary'), condiviso con l'email del service account.
//   - Se è un calendario personale, l'ID è l'email del proprietario (es. 'nome@gmail.com').
//   - Se è un calendario condiviso dedicato, l'ID è del tipo '....@group.calendar.google.com'.
// In alternativa puoi impostarlo come env var BADALUCCO_CALENDAR_ID.
const BADALUCCO_CALENDAR_ID =
  process.env.BADALUCCO_CALENDAR_ID || "badalucco.g@gmail.com";

// 'primary' non esiste per un service account: lo mappiamo sul calendario Badalucco reale.
function resolveCalendarId(calendarId) {
  return calendarId === "primary" ? BADALUCCO_CALENDAR_ID : calendarId;
}

// Converte un errore delle Google Calendar API (GaxiosError) in un HttpsError leggibile,
// così il client riceve un messaggio utile invece del generico "INTERNAL".
// Il 404 di Google su un calendario tipicamente significa: SA non condiviso su quel calendario.
function toHttpsError(err, calendarId) {
  const status = (err && (err.code || (err.response && err.response.status))) || null;
  const cal = calendarId || "(sconosciuto)";
  if (status === 404) {
    return new HttpsError(
      "not-found",
      `Calendario "${cal}" non trovato o service account non autorizzato. Condividilo con l'email del service account (permesso "Apportare modifiche agli eventi").`
    );
  }
  if (status === 403) {
    return new HttpsError(
      "permission-denied",
      `Permessi insufficienti sul calendario "${cal}". Il service account deve avere il permesso "Apportare modifiche agli eventi".`
    );
  }
  return new HttpsError("internal", (err && err.message) || "Errore Google Calendar.");
}

// Opzioni comuni: monta il secret e fissa la region (deve combaciare col client getFunctions).
const callOpts = { secrets: [SA_SECRET], region: "us-central1" };

// Crea un client Calendar autenticato con la chiave del service account.
function getCalendarClient() {
  const raw = process.env.GOOGLE_SA_KEY;
  if (!raw) {
    throw new HttpsError(
      "failed-precondition",
      "Service account non configurato (secret GOOGLE_SA_KEY mancante)."
    );
  }
  let credentials;
  try {
    credentials = JSON.parse(raw);
  } catch (e) {
    throw new HttpsError("failed-precondition", "GOOGLE_SA_KEY non è un JSON valido.");
  }
  const auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
  return google.calendar({ version: "v3", auth });
}

// Verifica login Firebase + appartenenza alla allowlist `allowedUsers/{email}`.
async function assertAllowed(request) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Devi essere autenticato.");
  }
  const email = (request.auth.token.email || "").toLowerCase();
  if (!email) {
    throw new HttpsError("permission-denied", "Email mancante nel token.");
  }
  const snap = await db.collection("allowedUsers").doc(email).get();
  if (!snap.exists) {
    throw new HttpsError("permission-denied", "Utente non autorizzato.");
  }
  return email;
}

// Elenca eventi su uno o più calendari. Ritorna { results: [{ calendarId, items }] }.
exports.listCalendarEvents = onCall(callOpts, async (request) => {
  await assertAllowed(request);
  const { calendarIds = [], timeMin, timeMax } = request.data || {};
  const calendar = getCalendarClient();

  const results = await Promise.all(
    calendarIds.map(async (calendarId) => {
      try {
        const res = await calendar.events.list({
          calendarId: resolveCalendarId(calendarId),
          timeMin,
          timeMax,
          maxResults: 250,
          singleEvents: true,
          orderBy: "startTime",
        });
        // Rimandiamo indietro il calendarId ORIGINALE (es. 'primary') così il client
        // conserva il suo ID logico per colori/nomi/filtri.
        return { calendarId, items: res.data.items || [] };
      } catch (err) {
        console.error(`Errore list eventi ${calendarId}:`, err && err.message);
        return { calendarId, items: [], error: (err && err.message) || "errore" };
      }
    })
  );

  return { results };
});

// Crea un evento. Ritorna l'evento creato (res.data).
exports.createCalendarEvent = onCall(callOpts, async (request) => {
  await assertAllowed(request);
  const { calendarId, resource } = request.data || {};
  if (!calendarId || !resource) {
    throw new HttpsError("invalid-argument", "calendarId e resource sono richiesti.");
  }
  const calendar = getCalendarClient();
  try {
    const res = await calendar.events.insert({
      calendarId: resolveCalendarId(calendarId),
      requestBody: resource,
    });
    return res.data;
  } catch (err) {
    console.error(`Errore insert evento ${calendarId}:`, err && err.message);
    throw toHttpsError(err, calendarId);
  }
});

// Aggiorna un evento. Ritorna l'evento aggiornato (res.data).
exports.updateCalendarEvent = onCall(callOpts, async (request) => {
  await assertAllowed(request);
  const { calendarId, eventId, resource } = request.data || {};
  if (!calendarId || !eventId || !resource) {
    throw new HttpsError("invalid-argument", "calendarId, eventId e resource sono richiesti.");
  }
  const calendar = getCalendarClient();
  try {
    const res = await calendar.events.update({
      calendarId: resolveCalendarId(calendarId),
      eventId,
      requestBody: resource,
    });
    return res.data;
  } catch (err) {
    console.error(`Errore update evento ${calendarId}/${eventId}:`, err && err.message);
    throw toHttpsError(err, calendarId);
  }
});

// Elimina un evento. Ritorna { success: true }.
exports.deleteCalendarEvent = onCall(callOpts, async (request) => {
  await assertAllowed(request);
  const { calendarId, eventId } = request.data || {};
  if (!calendarId || !eventId) {
    throw new HttpsError("invalid-argument", "calendarId ed eventId sono richiesti.");
  }
  const calendar = getCalendarClient();
  try {
    await calendar.events.delete({ calendarId: resolveCalendarId(calendarId), eventId });
    return { success: true };
  } catch (err) {
    console.error(`Errore delete evento ${calendarId}/${eventId}:`, err && err.message);
    throw toHttpsError(err, calendarId);
  }
});

// ---------------------------------------------------------------------------
// Digest settimanale aggiornamenti pratiche (solo note) — vedi digest.js.
// ---------------------------------------------------------------------------

// Ogni giovedì alle 17:00 Europe/Rome. retryCount 0: niente retry automatici,
// per evitare email duplicate se la run fallisce dopo alcuni invii riusciti.
exports.weeklyAgencyDigest = onSchedule(
  {
    schedule: "0 17 * * 4",
    timeZone: "Europe/Rome",
    region: "us-central1",
    secrets: [RESEND_API_KEY],
    timeoutSeconds: 540,
    retryCount: 0,
  },
  async () => {
    await runDigest(db, { trigger: "scheduled" });
  }
);

// Invio manuale dalla pagina Agenzie. Con testEmail tutte le email vanno
// a quell'indirizzo (anteprima) invece che ai destinatari reali.
exports.sendAgencyDigestNow = onCall(
  { region: "us-central1", secrets: [RESEND_API_KEY], timeoutSeconds: 540 },
  async (request) => {
    const email = await assertAllowed(request);
    const { testEmail = null } = request.data || {};
    if (testEmail && typeof testEmail !== "string") {
      throw new HttpsError("invalid-argument", "testEmail deve essere una stringa.");
    }
    return await runDigest(db, { trigger: "manual", testEmail, requestedBy: email });
  }
);
