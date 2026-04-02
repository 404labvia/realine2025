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

### Collections Firestore

| Collection | Scopo | Query pattern |
|---|---|---|
| `pratiche` | Pratiche standard con workflow multi-step | `where('userId', '==', uid)` |
| `pratiche_privato` | Pratiche private (stessa struttura) | `where('userId', '==', uid)` |
| `accessi_atti` | Richieste accesso atti (3 fasi) | `where('userId', '==', uid), orderBy('dataCreazione', 'desc')` |
| `ape` | Certificati energetici (3 fasi) | `where('userId', '==', uid), orderBy('dataCreazione', 'desc')` |
| `collaboratori` | Collaboratori/personale | Lettura globale |
| `taskStates` | Stato completamento task calendario | Doc ID = userId |

**REGOLA CRITICA:** Ogni documento scritto DEVE includere `userId: auth.currentUser.uid`.

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
- UID hardcoded `fSjGJAhUlsQwcCGJAzSWgp4Tpxi1` per uso single-user (non modificare)

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
3. **Sempre includere** `userId: auth.currentUser.uid` in ogni write Firestore
4. **UI in italiano** — Tutti i testi interfaccia devono essere in italiano
5. **Supportare dark mode** — Usare `dark:` classes e token `dark.*` per ogni componente UI
6. **Nuovi context** → seguire pattern `ApeContext.js` (onSnapshot, where userId, orderBy, serverTimestamp)
7. **Nuove pagine** → creare directory `pages/XxxPage/` con subdirs `components/`, `hooks/`, `handlers/`, `utils/` + `index.js`
8. **No TypeScript** — Il progetto è interamente JavaScript
9. **No test obbligatori** — Copertura test minima, non assumere che esistano test per le feature
