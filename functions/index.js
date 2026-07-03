// functions/index.js
// Cloud Functions callable per Google Calendar tramite Service Account.
// Nessun OAuth utente: il service account ha accesso permanente ai calendari
// condivisi con la sua email. La chiave JSON sta SOLO in Secret Manager (GOOGLE_SA_KEY),
// mai nel repo né nel browser.
//
// Sicurezza: ogni funzione richiede un utente Firebase autenticato la cui email
// sia presente nella collezione `allowedUsers` (stesso modello di firestore.rules).

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { google } = require("googleapis");

initializeApp();
const db = getFirestore();

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
  const res = await calendar.events.insert({
    calendarId: resolveCalendarId(calendarId),
    requestBody: resource,
  });
  return res.data;
});

// Aggiorna un evento. Ritorna l'evento aggiornato (res.data).
exports.updateCalendarEvent = onCall(callOpts, async (request) => {
  await assertAllowed(request);
  const { calendarId, eventId, resource } = request.data || {};
  if (!calendarId || !eventId || !resource) {
    throw new HttpsError("invalid-argument", "calendarId, eventId e resource sono richiesti.");
  }
  const calendar = getCalendarClient();
  const res = await calendar.events.update({
    calendarId: resolveCalendarId(calendarId),
    eventId,
    requestBody: resource,
  });
  return res.data;
});

// Elimina un evento. Ritorna { success: true }.
exports.deleteCalendarEvent = onCall(callOpts, async (request) => {
  await assertAllowed(request);
  const { calendarId, eventId } = request.data || {};
  if (!calendarId || !eventId) {
    throw new HttpsError("invalid-argument", "calendarId ed eventId sono richiesti.");
  }
  const calendar = getCalendarClient();
  await calendar.events.delete({ calendarId: resolveCalendarId(calendarId), eventId });
  return { success: true };
});
