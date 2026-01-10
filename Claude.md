# Realine Studio - Practice Management System

## Project Overview

Realine Studio is a comprehensive practice management application designed for Italian technical studios (Studio Tecnico). It manages professional practices including public practices, private practices, APE certificates, access to public records, and generates professional assignment documents.

**Primary Users:** Technical professionals, architects, and engineers managing client practices
**Main Purpose:** Streamline practice workflow, track payments, manage deadlines, and automate document generation
**Language:** Italian (business terminology, UI, documentation)

## Tech Stack

### Core Framework
- **React 18.2.0** - UI framework (Create React App, not ejected)
- **React Router DOM 6.30.0** - Client-side routing
- **Node.js 18.17.0** - Runtime version (see `.nvmrc.txt`)

### Backend & Database
- **Firebase 9.23.0**
  - Firestore: Document database
  - Firebase Auth: Authentication (Google OAuth)
  - Firebase Hosting: Deployment platform
- **Cloudflare Workers** - API proxy for Claude AI (security layer)

### Styling
- **Tailwind CSS 3.3.2** - Utility-first CSS framework
  - Dark mode: Class-based (`dark:` variants)
  - Custom color palette in `tailwind.config.js`
  - PostCSS with Autoprefixer

### AI Integration
- **Claude API (Sonnet 4)** - Document data extraction
  - Model: `claude-sonnet-4-20250514`
  - Proxied through Cloudflare Worker for API key security
  - Use cases: Extract data from cadastral surveys (Visure Catastali) and ID cards

### Document Processing
- **docxtemplater 3.67.6** - DOCX template generation (professional assignment documents)
- **pdf-lib 1.17.1** - PDF manipulation
- **pdfjs-dist 5.4.394** - PDF parsing and text extraction
- **jspdf 3.0.1** - PDF generation
- **html2canvas 1.4.1** - Screenshot generation

### UI Libraries
- **@headlessui/react 1.7.15** - Accessible UI primitives
- **lucide-react 0.503.0** + **react-icons 4.12.0** - Icon libraries
- **react-dropzone 14.3.8** - File upload with drag-and-drop

### Data Visualization
- **chart.js 4.4.8** + **react-chartjs-2 5.3.0** - Dashboard charts
- **recharts 2.15.3** - Responsive charts
- **react-big-calendar 1.18.0** - Calendar views

### Utilities
- **date-fns 2.30.0** - Date manipulation (Italian locale support)
- **fuse.js 7.1.0** - Fuzzy search
- **file-saver 2.0.5** - File download

## Project Structure

```
/home/user/realine2025/
├── src/
│   ├── components/              # Shared UI components
│   │   ├── Login.js            # Google OAuth login
│   │   ├── Navbar.js           # Main navigation bar
│   │   ├── ThemeToggle.js      # Dark/light mode toggle
│   │   ├── SidePeek.js         # Side panel for details
│   │   └── PrivateRoute.js     # Auth-protected route wrapper
│   │
│   ├── contexts/                # Global state management
│   │   ├── AuthContext.js      # Firebase authentication state
│   │   ├── ThemeContext.js     # Dark/light mode preference
│   │   ├── PraticheContext.js  # Public practices CRUD & real-time sync
│   │   └── PratichePrivatoContext.js  # Private practices state
│   │
│   ├── pages/                   # Feature-based page modules
│   │   ├── Dashboard/          # Main overview with stats & charts
│   │   ├── PratichePage/       # Public practices management
│   │   ├── PraticheBoardPage/  # Kanban board view
│   │   ├── PratichePrivatoPage/  # Private practices management
│   │   ├── AccessiAgliAttiPage/  # Public records access requests
│   │   ├── ApePage/            # APE certificates
│   │   ├── CalendarPage/       # Calendar & tasks
│   │   ├── FinanzePage/        # Financial tracking
│   │   └── GeneraIncaricoPage/ # AI-powered document wizard
│   │
│   ├── services/                # Business logic services
│   │   ├── claudeService.js    # Claude API integration
│   │   ├── pdfExtractorService.js  # PDF text extraction
│   │   ├── AutomationService.js    # Task automation rules
│   │   └── taskStateFirebaseService.js  # Task state management
│   │
│   ├── App.js                  # Main app with routing
│   ├── firebase.js             # Firebase configuration
│   └── index.js                # App entry point
│
├── public/
│   ├── template-incarico.docx  # Professional assignment template
│   └── logo.png
│
├── cloudflare-worker/          # Claude API proxy
│   ├── worker.js               # Cloudflare Worker code
│   ├── wrangler.toml           # Worker configuration
│   └── README.md
│
└── package.json

Total: ~154 JavaScript files, ~26,582 lines of code
```

### Feature Module Pattern

Each page module follows this consistent structure:

```
PageName/
├── index.js              # Main page component
├── components/           # Page-specific components
│   ├── cells/           # Table cell renderers
│   └── forms/           # Form components
├── contexts/            # Page-specific contexts (if needed)
├── handlers/            # Event handlers (actions, clicks)
├── hooks/               # Custom React hooks
└── utils/               # Utility functions (calculations, formatters)
```

**Benefits:**
- Self-contained features (easy to understand and modify)
- Clear separation of concerns
- Reduces prop drilling
- Easier to locate related code

## Key Architecture Patterns

### 1. Context-Based State Management

Uses React Context API instead of Redux for simpler state management:

```javascript
// Each major feature has its own context
<AuthContext.Provider>
  <ThemeContext.Provider>
    <PraticheContext.Provider>
      <PratichePrivatoContext.Provider>
        <App />
```

**Responsibilities:**
- CRUD operations
- Real-time Firebase sync with `onSnapshot()`
- User authentication checks
- Loading and error states

**When to use contexts:**
- Data needed by multiple components
- Real-time data synchronization
- User-scoped data (filtered by `userId`)

### 2. Workflow Tracking System

Complex nested workflow objects track practice progress through multiple stages:

```javascript
workflow: {
  acconto1: {
    completed: boolean,
    completedDate: timestamp,
    importoCommittente: number,
    importoCollaboratore: number,
    checklist: { item1: {...}, item2: {...} },
    tasks: [...],
    notes: string
  },
  acconto2: {...},
  saldo: {...}
  // ... other workflow steps
}
```

**Key Concepts:**
- Each workflow step is independent
- Color-coded status indicators (gray → yellow → green)
- Supports checklists, tasks, notes, dates per step
- Payment tracking at each stage
- Used in: Public Practices, Private Practices

### 3. AI-Powered Data Extraction

Claude AI extracts structured data from uploaded documents:

```javascript
// Usage pattern
const result = await extractDataFromVisuraCatastale(file, {
  onProgress: (message) => setProgressMessage(message)
});

// Returns structured JSON matching expected schema
```

**Implementation Details:**
- Proxied through Cloudflare Worker (API key security)
- Structured prompts for consistent JSON responses
- Progress callbacks for user feedback
- Fallback to manual entry if extraction fails
- Models used: Claude Sonnet 4

**Supported Document Types:**
1. **Visura Catastale** (Cadastral Survey) - Property details
2. **Carta d'Identità** (ID Card) - Client information

### 4. Payment Calculation System

Standardized payment calculations across the app:

```javascript
// Utility pattern
import {
  calcolaImportoConCassaEIVA,
  calcolaImportoConSoloCassa
} from './utils/paymentCalculations';

// Example
const totaleCommittente = calcolaImportoConCassaEIVA(
  importoBase,
  applyCassa,
  applyIVA
);
```

**Key Points:**
- Separate calculations for committente (client) vs collaboratore
- Optional Cassa (4%) and IVA (22%)
- Split payment tracking: 30% (acconto1), 30% (acconto2), 40% (saldo)
- Consistent rounding and formatting

**Formula:**
```
Cassa = base × 4%
Imponibile = base + Cassa
IVA = Imponibile × 22%
Totale = Imponibile + IVA
```

### 5. Document Template System

DOCX templates with dynamic placeholder replacement:

```javascript
// Template placeholders: {{cliente}}, {{indirizzo}}, etc.
const doc = await generateIncaricoDocument(data);
doc.download('incarico-committente.docx');
```

**Template Location:** `/public/template-incarico.docx`

**Supported Placeholders:**
- Client info: `{{cliente}}`, `{{cliente_codice_fiscale}}`
- Property: `{{indirizzo}}`, `{{comune}}`, `{{particella}}`
- Dates: `{{data_oggi}}` (format: "15 gennaio 2025")
- Amounts: `{{importo_netto}}`, `{{importo_totale}}`
- Conditional sections: `{{#if hasCondition}}...{{/if}}`

**Italian Date Formatting:**
- Uses `date-fns` with `it` locale
- Format: "d MMMM yyyy" → "15 gennaio 2025"

### 6. Real-Time Data Synchronization

Firebase Firestore real-time updates:

```javascript
// Pattern used in contexts
useEffect(() => {
  const q = query(
    collection(db, 'pratiche'),
    where('userId', '==', currentUser.uid),
    orderBy('dataCreazione', 'desc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setPratiche(data);
  });

  return unsubscribe;
}, [currentUser]);
```

**Important:**
- All data is user-scoped (filtered by `userId`)
- Automatic updates when data changes
- Clean up subscriptions on unmount
- Loading states during initial fetch

### 7. Multi-Step Wizard Pattern

Complex workflows use wizard pattern (e.g., GeneraIncaricoPage):

```javascript
// State management
const [currentStep, setCurrentStep] = useState(1);
const [wizardData, setWizardData] = useState({});

// Navigation
const nextStep = () => setCurrentStep(prev => prev + 1);
const prevStep = () => setCurrentStep(prev => prev - 1);

// Data collection across steps
const updateWizardData = (stepData) => {
  setWizardData(prev => ({ ...prev, ...stepData }));
};
```

**Steps Pattern:**
1. Source selection (from existing practice or manual)
2. Document upload & AI extraction
3. Data review & editing
4. Document generation & download

## Firebase Collections Schema

### `pratiche` (Public Practices)

```javascript
{
  id: string,                    // Auto-generated document ID
  userId: string,                // Owner (from Firebase Auth)
  codice: string,                // Practice code (e.g., "PR-2025-001")
  indirizzo: string,             // Property address
  cliente: string,               // Client name
  agenzia: string,               // Real estate agency
  collaboratore: string,         // Assigned collaborator name
  importoTotale: number,         // Total amount (EUR)
  dataInizio: timestamp,         // Start date
  dataFine: timestamp,           // Expected end date
  stato: "In Corso" | "Completata",

  workflow: {
    acconto1: {
      completed: boolean,
      completedDate: timestamp,
      importoCommittente: number,
      importoCollaboratore: number,
      checklist: object,
      tasks: array,
      notes: string
    },
    acconto2: {...},
    saldo: {...}
  }
}
```

### `pratiche_privato` (Private Practices)

Similar to `pratiche` but with additional fields:

```javascript
{
  // ... base fields from pratiche ...

  // Financial breakdown
  importoBaseCommittente: number,
  applyCassaCommittente: boolean,
  applyIVACommittente: boolean,

  importoBaseCollaboratore: number,
  applyCassaCollaboratore: boolean,

  collaboratoreFirmatario: string,
  importoBaseFirmatario: number,
  applyCassaFirmatario: boolean,

  // Calculated totals
  importoTotale: number,
  importoCollaboratore: number,
  importoFirmatario: number,

  // Extended workflow
  workflow: {
    dettagliPratica: {...},
    inizioPratica: {...},
    accessoAtti: {
      checklist: {
        delegafirmata: {...},
        richiestacomune: {...}
      }
    },
    sopralluogo: {...},
    incarico: {...},
    acconto1: {...},    // 30%
    acconto2: {...},    // 30%
    saldo: {...}        // 40%
  }
}
```

### `accessi_atti` (Access to Public Records)

```javascript
{
  id: string,
  userId: string,
  cliente: string,
  indirizzo: string,
  comune: string,
  oggetto: string,
  note: string,
  dataCreazione: timestamp,
  dataUltimaModifica: timestamp,
  completata: boolean,

  // Phase tracking
  faseDocumentiDelegaCompletata: boolean,
  dataFaseDocumentiDelega: timestamp,
  faseRichiestaInviataCompletata: boolean,
  dataFaseRichiestaInviata: timestamp,
  faseDocumentiRicevutiCompletata: boolean,
  dataFaseDocumentiRicevuti: timestamp
}
```

### `ape` (Energy Performance Certificates)

```javascript
{
  id: string,
  userId: string,
  cliente: string,
  indirizzo: string,
  comune: string,
  dataCreazione: timestamp,
  dataUltimaModifica: timestamp,
  completata: boolean,

  // Phase tracking
  faseRichiestaCompletata: boolean,
  dataFaseRichiesta: timestamp,
  faseEsecuzioneCompletata: boolean,
  dataFaseEsecuzione: timestamp,
  fasePagamentoCompletata: boolean,
  dataFasePagamento: timestamp
}
```

### `collaboratori` (Collaborators)

```javascript
{
  id: string,
  nome: string,
  // Shared across all practices
}
```

## Common Development Tasks

### Running the Application

```bash
# Start development server (port 3000)
npm start

# Run tests
npm test

# Build for production
npm run build

# Deploy to Firebase
firebase deploy
```

### Setting Up Environment

1. **Create `.env` file** (copy from `.env.example`):
```bash
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_CLAUDE_PROXY_URL=your_worker_url
```

2. **Set up Cloudflare Worker**:
```bash
cd cloudflare-worker
npx wrangler login
npx wrangler secret put CLAUDE_API_KEY
npx wrangler deploy
```

### Adding a New Practice Type

1. **Create Firestore collection schema** (document structure)
2. **Create Context** (`src/contexts/[Feature]Context.js`):
   - CRUD operations
   - Real-time sync with `onSnapshot()`
   - User filtering
3. **Create Page Module** (`src/pages/[Feature]Page/`):
   - `index.js` - Main component
   - `components/` - Tables, forms, modals
   - `utils/` - Calculations, formatters
4. **Add Route** in `App.js`:
```javascript
<Route path="/new-feature" element={
  <PrivateRoute>
    <NewFeaturePage />
  </PrivateRoute>
} />
```
5. **Update Navbar** - Add navigation link

### Modifying Workflow Steps

Workflow steps are defined in the page's workflow configuration:

```javascript
// Example: src/pages/PratichePage/utils/workflowUtils.js
export const workflowSteps = [
  {
    key: 'acconto1',
    label: 'Acconto 1 (30%)',
    color: 'yellow'
  },
  {
    key: 'acconto2',
    label: 'Acconto 2 (30%)',
    color: 'yellow'
  },
  {
    key: 'saldo',
    label: 'Saldo (40%)',
    color: 'green'
  }
];
```

**To add/modify steps:**
1. Update `workflowSteps` array
2. Add corresponding UI in workflow component
3. Update Firestore schema (initialize in CRUD operations)
4. Update calculation logic if needed

### Adding AI Extraction for New Document Type

1. **Create extraction function** in `src/services/claudeService.js`:
```javascript
export async function extractDataFromNewDocType(file, options = {}) {
  const { onProgress } = options;

  onProgress?.('Lettura documento...');
  const text = await extractTextFromPDF(file);

  onProgress?.('Estrazione dati con AI...');
  const result = await callClaudeAPI({
    system: "Extract data from document and return JSON",
    userMessage: `Document text: ${text}`,
    temperature: 0.0
  });

  return JSON.parse(result);
}
```

2. **Update wizard** to use new extraction function
3. **Add progress indicators** for user feedback
4. **Handle errors** gracefully with fallback to manual entry

### Modifying Document Templates

1. **Edit DOCX template** - `public/template-incarico.docx`
   - Use Microsoft Word or LibreOffice
   - Placeholders: `{{variableName}}`
   - Conditional sections: `{{#if condition}}...{{/if}}`
   - Lists: `{{#items}}{{name}}{{/items}}`

2. **Update generation logic** - `src/pages/GeneraIncaricoPage/utils/documentGenerator.js`

3. **Test with various data** - Ensure all placeholders are replaced

### Dark Mode Styling

All components support dark mode using Tailwind's `dark:` variant:

```javascript
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  <button className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700">
    Click me
  </button>
</div>
```

**Theme Toggle:**
- Component: `src/components/ThemeToggle.js`
- Context: `src/contexts/ThemeContext.js`
- Persisted in localStorage

### Firebase Security Rules

**Important:** All data is user-scoped. Security rules enforce this:

```javascript
// Firestore rules (conceptual - not in repo)
match /pratiche/{praticaId} {
  allow read, write: if request.auth != null
    && resource.data.userId == request.auth.uid;
}
```

**In code:**
```javascript
// Always filter by userId
const q = query(
  collection(db, 'pratiche'),
  where('userId', '==', currentUser.uid)
);
```

## Code Conventions

### Naming Conventions

- **Components:** PascalCase (`PratichePage.js`, `WorkflowPanel.js`)
- **Functions/Variables:** camelCase (`calculateTotal`, `importoBase`)
- **Constants:** UPPER_SNAKE_CASE (`API_ENDPOINT`, `MAX_RETRY`)
- **Files:** Match component name or descriptive camelCase
- **CSS Classes:** Tailwind utilities (kebab-case if custom)

### Italian Business Terminology

Key terms used throughout the codebase:

| Italian | English | Context |
|---------|---------|---------|
| Pratica | Practice/Case | Main work unit |
| Committente | Client | Person commissioning work |
| Collaboratore | Collaborator | Team member assigned |
| Acconto | Down payment | Partial payment |
| Saldo | Final payment | Balance/settlement |
| Visura Catastale | Cadastral survey | Property records |
| APE | Energy certificate | Building energy rating |
| Incarico | Assignment | Professional engagement letter |
| Cassa | Professional fund | 4% professional tax |
| IVA | VAT | 22% value-added tax |
| Comune | Municipality | City/town |
| Indirizzo | Address | Property location |

### File Organization

**Imports Order:**
1. React imports
2. Third-party libraries
3. Local contexts
4. Local components
5. Local utilities
6. Styles

```javascript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';

import { useAuth } from '../../contexts/AuthContext';
import WorkflowPanel from './components/WorkflowPanel';
import { calculateTotal } from './utils/paymentCalculations';
```

### Component Structure

```javascript
// 1. Imports
import React, { useState } from 'react';

// 2. Component definition
export default function ComponentName() {
  // 3. Contexts & hooks
  const { user } = useAuth();
  const navigate = useNavigate();

  // 4. State
  const [data, setData] = useState([]);

  // 5. Effects
  useEffect(() => {
    // ...
  }, []);

  // 6. Handlers
  const handleSubmit = (e) => {
    // ...
  };

  // 7. Render helpers (if needed)
  const renderItem = (item) => {
    // ...
  };

  // 8. Return JSX
  return (
    <div>
      {/* ... */}
    </div>
  );
}
```

### Error Handling

```javascript
try {
  const result = await someAsyncOperation();
  setData(result);
} catch (error) {
  console.error('Error:', error);
  // User-facing error message (Italian)
  alert('Si è verificato un errore. Riprova.');
}
```

## Important Gotchas & Known Issues

### 1. Firebase onSnapshot Memory Leaks

**Problem:** Forgetting to unsubscribe from real-time listeners causes memory leaks.

**Solution:**
```javascript
useEffect(() => {
  const unsubscribe = onSnapshot(query, (snapshot) => {
    // Handle data
  });

  return unsubscribe; // Cleanup on unmount
}, []);
```

### 2. Date Handling

**Problem:** Firestore timestamps vs JavaScript Dates

**Solution:**
```javascript
// Saving to Firestore
import { Timestamp } from 'firebase/firestore';
dataInizio: Timestamp.fromDate(new Date())

// Reading from Firestore
const jsDate = firestoreTimestamp.toDate();
```

### 3. User Authentication Race Condition

**Problem:** Component tries to access `currentUser` before authentication completes.

**Solution:** Use loading state in AuthContext:
```javascript
const { currentUser, loading } = useAuth();

if (loading) return <div>Caricamento...</div>;
```

### 4. Cloudflare Worker CORS

**Problem:** CORS errors when calling Claude API proxy.

**Solution:** Worker already includes CORS headers:
```javascript
// In worker.js
headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
```

### 5. PDF Text Extraction Quality

**Problem:** OCR quality varies based on PDF type (scanned vs text-based).

**Solution:**
- Always provide manual fallback option
- Show extracted data for review before saving
- Inform user about extraction quality

### 6. Payment Calculation Rounding

**Problem:** JavaScript floating-point arithmetic errors.

**Solution:** Round to 2 decimals consistently:
```javascript
const rounded = Math.round(value * 100) / 100;
```

### 7. Tailwind Purging Production CSS

**Problem:** Dynamic class names get purged in production build.

**Solution:** Use complete class names (no string interpolation):
```javascript
// ❌ Bad - will be purged
<div className={`text-${color}-500`}>

// ✅ Good - preserved
<div className={color === 'blue' ? 'text-blue-500' : 'text-red-500'}>
```

### 8. React Router v6 Navigation

**Problem:** Old `history.push()` doesn't work in Router v6.

**Solution:** Use `useNavigate()` hook:
```javascript
const navigate = useNavigate();
navigate('/pratiche');
```

## Testing Guidelines

### Test Structure

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import ComponentName from './ComponentName';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', () => {
    render(<ComponentName />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Result')).toBeInTheDocument();
  });
});
```

### Testing Contexts

```javascript
const wrapper = ({ children }) => (
  <AuthContext.Provider value={{ currentUser: mockUser }}>
    {children}
  </AuthContext.Provider>
);

render(<ComponentName />, { wrapper });
```

### Current Test Coverage

⚠️ **Minimal coverage** - Only basic smoke test in `App.test.js`. Consider adding:
- Context providers tests
- Form validation tests
- Payment calculation tests
- Workflow state machine tests

## Deployment

### Firebase Hosting

```bash
# Build production bundle
npm run build

# Deploy to Firebase
firebase deploy --only hosting

# Deploy with specific project
firebase use production
firebase deploy
```

### Cloudflare Worker

```bash
cd cloudflare-worker

# Deploy worker
npx wrangler deploy

# Update secret (API key)
npx wrangler secret put CLAUDE_API_KEY
```

### Environment Variables

**Never commit `.env` file!**

For production:
1. Set environment variables in Firebase Hosting configuration
2. Or use build-time substitution in CI/CD pipeline

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading Routes:**
```javascript
const PratichePage = lazy(() => import('./pages/PratichePage'));

<Suspense fallback={<div>Caricamento...</div>}>
  <PratichePage />
</Suspense>
```

2. **Memoization:**
```javascript
const memoizedValue = useMemo(() =>
  expensiveCalculation(data),
  [data]
);
```

3. **Virtualization for Long Lists:**
Consider `react-window` for tables with >100 rows

4. **Firestore Query Limits:**
```javascript
// Limit initial load
const q = query(collection(db, 'pratiche'), limit(50));
```

### Bundle Size

Current build size: ~1.5MB (check with `npm run build`)

**Largest dependencies:**
- Firebase (~400KB)
- React (~130KB)
- pdfjs-dist (~300KB)
- chart.js (~200KB)

Consider code splitting for chart libraries if not used on every page.

## Security Best Practices

1. **API Keys:** Never expose Claude API key in frontend
   - ✅ Use Cloudflare Worker proxy
   - ❌ Don't put API key in React app

2. **Authentication:** All Firebase operations check user authentication
   ```javascript
   if (!currentUser) {
     navigate('/login');
     return;
   }
   ```

3. **Data Isolation:** Always filter by `userId`
   ```javascript
   where('userId', '==', currentUser.uid)
   ```

4. **Input Validation:** Sanitize user inputs before Firestore writes
   ```javascript
   const sanitized = userInput.trim().slice(0, 1000);
   ```

5. **File Uploads:** Validate file types and sizes
   ```javascript
   if (file.size > 10 * 1024 * 1024) {
     alert('File troppo grande (max 10MB)');
     return;
   }
   ```

## Debugging Tips

### Firebase Emulator

Run local Firebase emulator for testing:
```bash
firebase emulators:start
```

Update `firebase.js` to connect to emulator in development.

### React DevTools

- Install React DevTools browser extension
- Inspect component props and state
- Profile performance issues

### Console Logging Best Practices

```javascript
// Descriptive logs
console.log('Pratiche loaded:', pratiche.length);

// Error context
console.error('Failed to save pratica:', error, { praticaId });

// Remove in production
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}
```

### Network Tab

- Check Firebase requests (Firestore API calls)
- Verify Cloudflare Worker responses
- Monitor Claude API usage

## Useful Resources

- **Firebase Docs:** https://firebase.google.com/docs/firestore
- **React Router v6:** https://reactrouter.com/
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Claude API:** https://docs.anthropic.com/
- **docxtemplater:** https://docxtemplater.com/docs/get-started/
- **date-fns:** https://date-fns.org/

## Contributing Guidelines

### Before Making Changes

1. **Read this document** thoroughly
2. **Explore related code** before modifying
3. **Check existing patterns** - follow established conventions
4. **Test locally** before committing

### Making Changes

1. **Create feature branch:** `git checkout -b feature/description`
2. **Make focused commits** with clear messages (Italian or English)
3. **Test thoroughly** - manual testing at minimum
4. **Update this Claude.md** if you add new patterns or change architecture

### Commit Message Format

```
feat: add nuovo campo importo to pratiche private

- Added importoExtra field to schema
- Updated calculation logic
- Added UI input in form
```

Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`

## Future Considerations

### Potential Improvements

1. **Comprehensive Testing:** Unit tests for calculations, integration tests for workflows
2. **TypeScript Migration:** Type safety for complex data structures
3. **Internationalization:** Support multiple languages (currently Italian-only)
4. **Mobile App:** React Native version for field work
5. **Offline Support:** Service workers for offline-first experience
6. **Advanced Reporting:** Export to Excel, PDF reports
7. **Email Integration:** Automated client notifications
8. **Calendar Sync:** Google Calendar integration for deadlines
9. **Webhook System:** External integrations (accounting software)
10. **Audit Log:** Track all changes for compliance

### Known Technical Debt

1. **Duplicated Logic:** Payment calculations repeated across pages (needs shared library)
2. **Inconsistent Error Handling:** Some components use alerts, others inline messages
3. **Limited Validation:** Form validation is basic, needs comprehensive schema validation
4. **No Rollback Mechanism:** Failed operations don't rollback Firestore changes
5. **Hardcoded Values:** Some thresholds and rates should be configurable

---

## Quick Reference

### Key Files

- `src/App.js` - Routing configuration
- `src/firebase.js` - Firebase initialization
- `src/contexts/AuthContext.js` - Authentication state
- `src/services/claudeService.js` - AI integration
- `public/template-incarico.docx` - Document template
- `cloudflare-worker/worker.js` - API proxy

### Key Commands

```bash
npm start              # Development server
npm test               # Run tests
npm run build          # Production build
firebase deploy        # Deploy to Firebase
```

### Key Contexts

```javascript
import { useAuth } from './contexts/AuthContext';
import { usePratiche } from './contexts/PraticheContext';
import { useTheme } from './contexts/ThemeContext';
```

### Key Utilities

```javascript
import { calcolaImportoConCassaEIVA } from './utils/paymentCalculations';
import { formatCurrency } from './utils/formatters';
import { extractTextFromPDF } from './services/pdfExtractorService';
```

---

**Last Updated:** January 2025
**Project Version:** 1.0.0
**Maintained By:** Realine Studio Development Team

For questions or issues, refer to the codebase or consult with the development team.
