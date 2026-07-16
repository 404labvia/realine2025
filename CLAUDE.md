# REALINE Studio

Gestionale per studi tecnici/immobiliari italiani. Gestisce pratiche, accessi agli atti, certificati energetici (APE), finanze e calendario.

## Tech Stack

- **React 18** (Create React App, JavaScript — NO TypeScript)
- **Firebase 9.x** — Auth (Google OAuth), Firestore (database), Hosting
- **Tailwind CSS 3** — Dark mode con strategia `class` e token custom `dark.*`
- **React Router DOM 6** — Routing flat in `src/App.js`
- **Context API** — State management (no Redux)
- **Google Calendar API** — Integrazione multi-calendario (4 sedi)
- **Librerie chiave:** chart.js, recharts, date-fns, docxtemplater, tesseract.js, jspdf, html2canvas, fuse.js, react-big-calendar, lucide-react, react-icons

## Struttura Progetto

```
src/
├── components/          # Componenti globali (Login, Navbar, PrivateRoute, SidePeek, ThemeToggle)
├── contexts/            # State globale
│   ├── AuthContext.js         # Firebase Auth, Google OAuth
│   ├── PraticheContext.js     # Pratiche standard (getDocs, no real-time)
│   ├── PratichePrivatoContext.js  # Pratiche private
│   └── ThemeContext.js        # Dark/light mode, persiste in localStorage
├── services/
│   ├── AutomationService.js         # Engine regole automazione task
│   ├── taskStateFirebaseService.js  # Sync ibrido localStorage + Firebase
│   └── todoStateService.js          # Legacy, solo localStorage
├── pages/
│   ├── Dashboard/               # Dashboard con KPI, grafici, task
│   ├── AccessiAgliAttiPage/     # Accessi agli atti (ha proprio context)
│   ├── ApePage/                 # Certificati energetici (ha proprio context)
│   ├── PratichePage/            # Gestione pratiche (vista tabella)
│   ├── PraticheBoardPage/       # Gestione pratiche (vista Kanban)
│   ├── PratichePrivatoPage/     # Pratiche private
│   ├── CalendarPage/            # Google Calendar integration
│   ├── CalendarTaskPage/        # Calendario + Task unificato
│   ├── FinanzePage/             # Dashboard finanziaria
│   └── GeneraIncaricoPage/      # Wizard generazione incarico (OCR + DOCX)
├── firebase.js          # Config Firebase + export db, auth
├── App.js               # Router principale + context wrapping
└── index.js             # Entry point + Google OAuth wrapper
```

Ogni page module ha sottodirectory: `components/`, `hooks/`, `handlers/`, `utils/`.

### Branch calendar-task (versione più recente)
Il branch `calendar-task` aggiunge:
- **PrezziarioPage** — Listino prezzi/tariffario
- **AutomationConfigPage** — UI configurazione regole automazione
- Rimuove GeneraIncaricoPage
- Migliora integrazione Calendar/Task con sync Firebase bidirezionale

## Firebase

- **Project ID:** `studio-a07a4`
- **Credenziali:** Hardcoded in `src/firebase.js` e `src/index.js` (intenzionale, NON modificare)
- **Auth:** Google OAuth via `signInWithPopup`, utente identificato da `auth.currentUser.uid`

### Multi-utente / Studio condiviso (allowlist)
- Lo studio è **condiviso**: tutti gli utenti autorizzati vedono/modificano gli **stessi** dati (pratiche, pratiche_privato, ape, accessi_atti, taskStates).
- Autorizzazione gestita **a dati**, non nelle regole: collezione `allowedUsers/{email}` — un documento per ogni email abilitata (ID documento = email Google, minuscolo).
- **Aggiungere un utente** = creare un doc in `allowedUsers` da Console (il data editor bypassa le regole). NON serve toccare/deployare le regole.
- Le letture nei context NON filtrano più per `userId` (vedi `ApeContext`, `AccessoAttiContext`, `PraticheContext`): leggono l'intera collezione. Si continua comunque a scrivere `userId` (tracciamento creatore).

### Security Rules (versionate)
- File: `firestore.rules` (referenziato in `firebase.json` → sezione `firestore`).
- Modello: helper `isAllowed()` = `exists(allowedUsers/{request.auth.token.email})`, applicato a ogni collezione dati.
- Deploy: `firebase deploy --only firestore` (oppure MCP `firebase` → `firebase_deploy only=firestore`).
- ⚠️ Le regole bloccano tutto se l'email del richiedente non è in `allowedUsers`: prima di deployare regole nuove, assicurarsi che i doc `allowedUsers` esistano (altrimenti lockout immediato).

### MCP Firebase
- Configurato in `.mcp.json` (root workspace `REALINE-WEBAPP`, NON nel subdir): `npx -y firebase-tools@latest mcp --dir <realine2025> --only firestore,auth,hosting`.
- Tool utili: `firebase_get_security_rules`, `firebase_deploy` (firestore/hosting), `firebase_deploy_status`. NON espone scrittura dati Firestore né lista utenti Auth (usare la Console per quelli).

### Collections Firestore

| Collection | Scopo | Query pattern |
|---|---|---|
| `pratiche` | Pratiche standard con workflow multi-step | Lettura intera collezione (condivisa) |
| `pratiche_privato` | Pratiche private (stessa struttura) | Lettura intera collezione (condivisa) |
| `accessi_atti` | Richieste accesso atti (3 fasi) | `orderBy('dataCreazione', 'desc')` (condivisa) |
| `ape` | Certificati energetici (3 fasi) | `orderBy('dataCreazione', 'desc')` (condivisa) |
| `collaboratori` | Collaboratori/personale | Lettura globale |
| `taskStates` | Stato completamento task calendario | Doc ID = UID hardcoded (condiviso) |
| `allowedUsers` | Email autorizzate (allowlist) | Doc ID = email; gestita da Console |

**Scrittura:** ogni documento scritto include comunque `userId: auth.currentUser.uid` (tracciamento creatore). Le pratiche includono anche `createdAt` (ISO) per l'export giornaliero e `gestione` (`"nuova"` | `"vecchia"`) per la divisione vecchie/nuove (vedi sotto). Le pratiche pre-esistenti senza il campo sono trattate come `"vecchia"`.

## Pattern Architetturali

### Context Providers
Wrappati per-route in `App.js` (dentro `<Routes>`), NON a livello root. Ogni route riceve solo i context necessari.
`PraticheProvider` / `PratichePrivatoProvider` sono parametrizzati con prop `gestione` (`"nuova"` | `"vecchia"` | `"all"`); `PraticheProvider` accetta anche `autoCodice`. Il collection name resta hardcoded (`pratiche` / `pratiche_privato`) — la prop cambia solo la vista/scrittura, non la collezione.

### Gestione pratiche (vecchie/nuove) — filtro logico
Da Settembre 2026 le pratiche sono divise tra "da completare" (storiche) e "nuova gestione", **senza collezioni separate**: discriminante = campo `gestione` sul doc. La prop `gestione` del provider (a) filtra `praticheView` esposta come `pratiche`, (b) stampa il contrassegno in `addPratica`.
- **Rotte**: `/pratiche-nuove` (`gestione="nuova"` + `autoCodice`) e `/pratiche-privato-nuove` riusano `PraticheBoardPage`/`PratichePrivatoPage`; `/pratiche-board` e `/pratiche-privato` sono ora "... da completare" (`gestione="vecchia"`). Dashboard/Finanze/Report → `"nuova"`; Calendario/Genera Incarico → `"all"` (vedono tutto).
- **Codice auto `NNN-SIGLA-AA`** (es. `001-VIA-26`): solo agenzie Barner. Sigle in `src/pages/PratichePage/utils/agenzieCodici.js` (`getSiglaAgenzia`, case-insensitive; private → null → codice manuale). `generateNextCodice(agenzia)` nel `PraticheContext` scansiona `pratiche` filtrando `codice.endsWith('-SIGLA-AA')`, max+1, pad3; reset annuale automatico. Auto-fill in `NewPraticaForm` via `useEffect` su `agenzia`, attivo solo con prop `autoCodice`.
- **Accesso agli atti → pratica**: `spostaInPratica(accesso)` in `AccessoAttiContext` (self-contained: scrive su `pratiche` con `gestione:"nuova"`, riusa `migratePraticaData` per il workflow). Checkbox in `AccessoAttiTableRow` reso condizionale a `onSpostaInPratica` (non compare nel `CollapsibleAccessoAttiCard` del board). Badge "In pratica" + `spostatoInPratica:true` anti-duplicato. Mappatura `proprieta→cliente`.
- **Digest** (`functions/digest.js`): filtra `gestione === "nuova"` — solo le pratiche nuove generano email alle agenzie.

### Pattern Context di riferimento
Usare `src/pages/ApePage/contexts/ApeContext.js` come template per nuovi context:
- `onSnapshot` per real-time sync
- `where('userId', '==', currentUserId)` + `orderBy`
- `serverTimestamp()` per audit trail
- Auth state listener per ottenere userId

### Handler Pattern
Le funzioni handler in `handlers/` prendono: `(id, data, updateFn, localState, setLocalState)` — modificano sia Firestore che stato locale.

### Dark Mode
- Tailwind `dark:` prefix su tutti i componenti
- Token custom in `tailwind.config.js`: `dark.bg`, `dark.surface`, `dark.border`, `dark.hover`, `dark.text.primary/secondary/muted`
- Toggle gestito da `ThemeContext`, persiste in localStorage, applica classe `dark` a document root

### Task State Sync
`taskStateFirebaseService.js` usa approccio ibrido:
- **Primario:** localStorage per feedback immediato (offline-first)
- **Secondario:** Firebase sync via collection `taskStates`
- UID hardcoded `fSjGJAhUlsQwcCGJAzSWgp4Tpxi1`: doc `taskStates` condiviso tra gli utenti (non modificare)

### Export PDF
- Helper condivisi in `src/pages/PratichePage/utils/exportHelpers.js` (`htmlToPdf`, `listStyles`, `agenzieColors`, `formatDate`, `formatCurrency`) — riusati da tutti gli export.
- `exportUtils.js` (PratichePage): `generatePDF`, `generateListPDF`, `generateDailyPDF` (aggiunte del giorno: note+task+nuove pratiche), `generateMonthlyAttiPDF` (atti fissati nel mese, per `dataFine`). Bottoni in `PraticheBoardPage`.
- `ApePage/utils/exportUtils.js` → `generateApeListPDF`; `AccessiAgliAttiPage/utils/exportUtils.js` → `generateAccessiListPDF`. Bottoni "Esporta Lista PDF" nelle rispettive pagine.
- Tecnica: render HTML offscreen → `html2canvas` → `jsPDF` (A4, multipagina automatica in `htmlToPdf`).

## Comandi Sviluppo

```bash
npm start              # Dev server (localhost:3000)
npm run build          # Build produzione → /build
npm test               # Jest (copertura minima, solo App.test.js)
firebase deploy --only hosting     # Deploy su Firebase Hosting
firebase deploy --only functions   # Deploy Cloud Functions (digest + calendar)
```

**Functions runtime:** `nodejs22` (in `firebase.json` → `functions.runtime`; `engines.node` in `functions/package.json`). Il deploy functions SALTA i cambi di sola config (es. runtime) se il source è invariato ("No changes detected") — per forzarlo modificare il source (anche solo un commento).

## Branches

| Branch | Stato | Note |
|---|---|---|
| `main` | v4 stabile | Include GeneraIncaricoPage |
| `calendar-task` | Latest development | +PrezziarioPage, +AutomationConfigPage, -GeneraIncaricoPage, Calendar/Task migliorato |

Convenzione commit: `feat:`, `fix:`, `refactor:`, `docs:` (conventional commits).

## Regole Critiche

1. **NON modificare** credenziali hardcoded in `firebase.js` e `index.js`
2. **NON modificare** l'UID hardcoded in `taskStateFirebaseService.js`
3. **Includere** `userId: auth.currentUser.uid` in ogni write Firestore (tracciamento creatore; NON usato come filtro di lettura — dati condivisi via allowlist `allowedUsers`)
4. **UI in italiano** — Tutti i testi interfaccia devono essere in italiano
5. **Supportare dark mode** — Usare `dark:` classes e token `dark.*` per ogni componente UI
6. **Nuovi context** → seguire pattern `ApeContext.js` (onSnapshot, where userId, orderBy, serverTimestamp)
7. **Nuove pagine** → creare directory `pages/XxxPage/` con subdirs `components/`, `hooks/`, `handlers/`, `utils/` + `index.js`
8. **No TypeScript** — Il progetto è interamente JavaScript
9. **No test obbligatori** — Copertura test minima, non assumere che esistano test per le feature
