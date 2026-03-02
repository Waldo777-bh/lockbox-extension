# Lockbox Chrome Extension

> Encrypted API key vault — access, copy, and auto-fill your API keys from anywhere in the browser.

The Lockbox Chrome Extension brings your [Lockbox](https://yourlockbox.dev) vault to the browser toolbar. Quickly search, copy, and auto-fill API keys without ever leaving the page you're working on.

## Features

- **Popup Vault** — Click the toolbar icon to search and copy keys instantly
- **Auto-detect Fields** — Detects API key input fields on supported sites (OpenAI, Stripe, AWS, GitHub, Anthropic, Clerk) and offers to fill them
- **Context Menu** — Right-click any input field to paste a key from your vault
- **Omnibox Search** — Type `lb` in the address bar then Tab to search keys
- **Keyboard Shortcut** — `Alt+Shift+L` opens the popup
- **Expiry Badges** — Badge on the extension icon shows count of expiring keys
- **Notifications** — Alerts for expiring keys and security events

## Development Setup

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
git clone https://github.com/lockboxdev/lockbox-extension.git
cd lockbox-extension
npm install
```

### Build

```bash
npm run build
```

### Development (watch mode)

```bash
npm run dev
```

### Load in Chrome

1. Run `npm run build` to create the `dist/` folder
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** and select the `dist/` folder
5. The Lockbox icon appears in the toolbar — click it to test

## Architecture

```
src/
├── popup/            # React popup UI (toolbar click)
│   ├── components/   # UI components (Header, SearchBar, KeyList, etc.)
│   ├── hooks/        # React hooks (useAuth, useVaults, useSearch)
│   ├── Popup.tsx     # Main popup component
│   └── PopupApp.tsx  # Entry point with React root
├── background/
│   └── service-worker.ts   # Background service worker (context menus, omnibox, alarms)
├── content/
│   ├── detector.ts   # API key field detection logic
│   ├── injector.ts   # Lockbox icon injection and key picker
│   └── content-script.ts  # Content script entry point
├── lib/
│   ├── api.ts        # API client for dashboard.yourlockbox.dev
│   ├── auth.ts       # Authentication helpers (Clerk session + token)
│   ├── cache.ts      # Local caching (vault/key metadata, NOT values)
│   └── constants.ts  # URLs, selectors, config
├── styles/
│   └── globals.css   # Tailwind CSS imports + custom styles
└── types/
    └── index.ts      # TypeScript types and service icon mapping
```

### Key Design Decisions

- **Manifest V3** — Required for Chrome Web Store. Uses service worker instead of background page.
- **Key values are NEVER cached** — Only metadata (names, services) is cached locally. Decrypted values are always fetched fresh from the API.
- **Clerk authentication** — Reads the session cookie from dashboard.yourlockbox.dev, or uses a token-based flow via extension-auth.
- **Tailwind CSS** — Matches the dark theme of the Lockbox dashboard.

## API Endpoints

The extension connects to `https://dashboard.yourlockbox.dev/api`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/vaults` | List all vaults |
| GET | `/vaults/[id]/keys` | List keys in a vault |
| GET | `/vaults/[id]/keys/[keyId]/reveal` | Get decrypted key value |
| POST | `/vaults/[id]/keys` | Add a new key |
| GET | `/audit` | Recent activity log |

## Related

- [Lockbox Dashboard](https://dashboard.yourlockbox.dev) — Web dashboard
- [Lockbox npm package](https://www.npmjs.com/package/lockbox) — Node.js SDK
- [Lockbox GitHub](https://github.com/lockboxdev/lockbox) — Main repository

## License

MIT
