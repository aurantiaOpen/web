# 🍊 aranciaopen — web

client web non ufficiale per [arancialive.com](https://www.arancialive.com), costruito con react + vite + tailwind. permette di sfogliare e guardare eventi on demand direttamente dal browser, senza bisogno dell'web-app ufficiale.

---

## ✨ features

- 🏠 **homepage** con hero banner animato (framer-motion) e griglia eventi
- 📂 **categorie** — naviga gli eventi per categoria
- 🔍 **ricerca** — cerca tra tutti gli eventi disponibili
- 🎬 **player hls** — riproduzione video in streaming via `hls.js` con proxy trasparente
- 📡 **chromecast** — cast del video su dispositivi google cast
- 🌐 **proxy vercel** — serverless function che aggira i cors di arancialive
- 🔄 **fix mezzani 2024** — playlist m3u8 riparate per la festa dei ceri mezzani 2024 (evento #123), servite da supabase

---

## 🗂 struttura

```
web-main/
├── api/
│   └── proxy.js          # vercel serverless function proxy principale
├── src/
│   ├── api.js            # fetch eventi, trasformazioni, stream url helpers
│   ├── App.jsx           # router (/, /categorie/:slug, /eventi/:id, /cerca)
│   ├── main.jsx
│   ├── index.css
│   └── pages/
│       ├── HomePage.jsx
│       ├── ParentComponent.jsx   # layout con sidebar
│       ├── Sidebar.jsx
│       ├── HeroBanner.jsx        # carosello animato
│       ├── EventsGrid.jsx
│       ├── EventCard.jsx
│       ├── EventRow.jsx
│       ├── EventDetails.jsx      # pagina dettaglio + lista episodi
│       ├── VideoPlayer.jsx       # hls.js player + chromecast
│       ├── CategoryPage.jsx
│       └── SearchPage.jsx
├── proxy-server.mjs      # server node.js per self-hosting (serve dist + proxy)
├── vercel.json           # rewrite rules per vercel
├── vite.config.js        # proxy dev locale
├── tailwind.config.js
|── worker.js # proxy per i .ts
└── .env.example
```

---

## 🚀 setup

### prerequisiti

- node.js 18+
- npm

### installazione

```bash
git clone https://github.com/aurantiaOpen/web.git
cd web
npm install
```

### variabili d'ambiente

copia `.env.example` in `.env` e compila:

```bash
cp .env.example .env
```

```env
# device id hardcoded nell'app ufficiale (decompilato dall'apk)
VITE_LONGSTRING=your_longstring_here

# url del tuo cloudflare worker per il proxy dei segmenti .ts
VITE_CF_WORKER=https://your-worker.your-subdomain.workers.dev

# porta per il server node.js (solo self-hosting)
PORT=3000
```

> **nota:** `VITE_CF_WORKER` è necessario per la riproduzione video. il worker funge da proxy cors per i segmenti `.ts` e per i flussi cdn di arancialive.

---

## 🧑‍💻 sviluppo

```bash
npm run dev
```

il server vite gira su `http://localhost:5173` e proxia automaticamente `/arancialive-proxy/*` verso `arancialive.com`.

---

## 🏗 build & deploy

### vercel (raccomandato)

1. fai il deploy del repo su vercel
2. imposta le variabili d'ambiente nel pannello vercel (`VITE_LONGSTRING`, `VITE_CF_WORKER`)
3. le rotte sono già configurate in `vercel.json`

### self-hosting (node.js)

```bash
npm run build
npm run serve
```

il server `proxy-server.mjs` serve la `dist/` e gestisce il proxy internamente sulla porta definita da `PORT` (default: `3000`).

---

## ⚙️ come funziona il proxy

arancialive richiede un `user-agent` specifico e non espone cors. il proxy risolve entrambi i problemi:

| percorso | destinazione |
|---|---|
| `/arancialive-proxy/*` | `https://www.arancialive.com/*` con headers app |
| `/arancialive-proxy/stream/{host}/{path}` | cdn hls — riscrive gli url `.m3u8` al volo |
| `/arancialive-proxy/supabase/{path}` | `supabase.co` — playlist mezzani 2024 |
| segmenti `.ts` | cloudflare worker (`VITE_CF_WORKER`) |

---

## 📦 dipendenze principali

| pacchetto | uso |
|---|---|
| `react` + `react-dom` | ui |
| `react-router-dom` | routing |
| `hls.js` | riproduzione stream hls |
| `framer-motion` | animazioni |
| `react-icons` | icone |
| `tailwindcss` | stile |

---

## 📝 note

- questo progetto è **non ufficiale** e non è affiliato ad arancialive.com
- il `VITE_LONGSTRING` è un device id pubblico estratto dall'apk ufficiale, non è una credenziale personale
- le playlist fisse per la **festa dei ceri mezzani 2024** sono hardcodate in `src/api.js` perché l'api ufficiale restituisce url non funzionanti per quell'evento

---

## 📄 licenza

uso personale / educativo. nessuna affiliazione con arancialive.com.
