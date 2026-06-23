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

**Scrittura:** ogni documento scritto include comunque `userId: auth.currentUser.uid` (tracciamento creatore). Le pratiche includono anche `createdAt` (ISO) per l'export giornaliero.

## Pattern Architetturali

### Context Providers
Wrappati per-route in `App.js` (righe 177-255), NON a livello root. Ogni route riceve solo i context necessari.

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
firebase deploy --only hosting  # Deploy su Firebase Hosting
```

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
