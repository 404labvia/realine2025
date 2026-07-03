# Setup Calendario via Service Account

Operazioni **manuali una tantum** per attivare il calendario senza più login/scadenza token.
Tutto il codice è già pronto: questi sono solo i passi di configurazione su Google Cloud / Firebase.

## 0. Prerequisiti
- Piano **Firebase Blaze** attivo sul progetto `studio-a07a4` (Cloud Functions lo richiede).
- I documenti in `allowedUsers/{email}` devono esistere per gli utenti abilitati (già così).

## 1. Crea il Service Account + chiave
1. Google Cloud Console → progetto **studio-a07a4** → *IAM e amministrazione → Account di servizio*.
2. Crea account (es. `calendar-bot`). Copia la sua **email** (`...@studio-a07a4.iam.gserviceaccount.com`).
3. *Chiavi → Aggiungi chiave → JSON* → scarica il file (NON committarlo nel repo).
4. *API e servizi → Libreria* → abilita **Google Calendar API**.

## 2. Condividi i calendari con il service account
Per ognuno dei 4 calendari, da Google Calendar (web) → *Impostazioni calendario → Condividi con persone specifiche* → aggiungi l'**email del service account** con permesso **"Apportare modifiche agli eventi"**:
- REALINE De Antoni
- REALINE Castro
- REALINE Antonelli
- **REALINE Badalucco** (quello prima usato come `primary`)

Dalle impostazioni del calendario Badalucco copia anche l'**ID calendario** (in *Integra calendario*):
- calendario personale → l'ID è l'email del proprietario (es. `nome@gmail.com`)
- calendario dedicato → l'ID è del tipo `...@group.calendar.google.com`

## 3. Inserisci l'ID Badalucco nel codice
In [functions/index.js](index.js) sostituisci il placeholder:
```js
const BADALUCCO_CALENDAR_ID = process.env.BADALUCCO_CALENDAR_ID || "INSERISCI_ID_CALENDARIO_BADALUCCO";
```
con l'ID reale copiato al passo 2 (oppure impostalo come env var `BADALUCCO_CALENDAR_ID`).

## 4. Carica la chiave del service account come secret
```bash
cd functions
firebase functions:secrets:set GOOGLE_SA_KEY
# incolla TUTTO il contenuto del file JSON scaricato al passo 1, poi invio
```

## 5. Installa le dipendenze e fai il deploy
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```
Al primo deploy Firebase potrebbe chiedere di abilitare alcune API (Cloud Functions, Cloud Build, Artifact Registry): conferma.

## 6. Deploy frontend
```bash
npm run build
firebase deploy --only hosting
```

## Verifica
- Apri l'app, vai su **Calendario**: gli eventi dei 4 calendari si caricano **senza alcun popup Google**.
- Crea/modifica/elimina un evento su ogni calendario → controlla su Google Calendar.
- Tieni l'app aperta **> 1 ora con ad blocker attivo**: il calendario continua a funzionare, **nessun re-login**. ✅

## Note
- Gli eventi creati risultano creati dall'account del service account (ok per studio condiviso).
- Il client OAuth `956807791511-...` e lo scope `calendar.events` non servono più; lo stato *Testing/Production* è ora irrilevante per il calendario.
- La chiave JSON vive **solo** in Secret Manager: mai nel repo né nel bundle browser.
