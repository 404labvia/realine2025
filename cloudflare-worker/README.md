# Claude API Proxy - Cloudflare Worker

Questo worker fa da proxy sicuro tra il frontend React e l'API di Anthropic Claude.

## Setup

### 1. Installa Wrangler CLI
```bash
npm install -g wrangler
```

### 2. Effettua il login su Cloudflare
```bash
npx wrangler login
```
Si aprirà il browser per l'autenticazione.

### 3. Configura la chiave API Claude
```bash
cd cloudflare-worker
npx wrangler secret put CLAUDE_API_KEY
```
Ti verrà chiesto di inserire la chiave API. Incollala e premi Invio.

### 4. Deploy del worker
```bash
npx wrangler deploy
```

### 5. Copia l'URL del worker
Dopo il deploy, vedrai un URL tipo:
```
https://claude-api-proxy.TUO_ACCOUNT.workers.dev
```

Copia questo URL e inseriscilo nel file `.env` del progetto React:
```
REACT_APP_CLAUDE_PROXY_URL=https://claude-api-proxy.TUO_ACCOUNT.workers.dev
```

## Sicurezza

- La chiave API Claude è memorizzata come "secret" in Cloudflare, non è mai esposta
- In produzione, modifica `Access-Control-Allow-Origin` in worker.js con il tuo dominio specifico
- Il worker accetta solo richieste POST

## Test locale
```bash
npx wrangler dev
```

## Limiti Free Tier Cloudflare Workers
- 100.000 richieste/giorno
- 10ms CPU time per richiesta (più che sufficiente per un proxy)
