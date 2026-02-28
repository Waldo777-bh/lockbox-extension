# Privacy Policy — Lockbox Chrome Extension

**Last updated:** February 28, 2026

## Overview

The Lockbox Chrome Extension ("Extension") is developed by Lockbox ("we", "us", "our"). This privacy policy explains how the Extension handles your data.

## Data Collection

The Extension does **not** collect, store, or transmit any personal data to third parties.

### What the Extension accesses:

- **Authentication tokens**: Stored locally in your browser (`chrome.storage.local`) to authenticate with your Lockbox dashboard account. These tokens are never shared with any third party.
- **Vault and key metadata**: Names of vaults, key names, and service names are cached locally for search and display purposes. This cache is refreshed every 5 minutes and can be cleared by signing out.
- **API key values**: Decrypted key values are **never cached**. They are fetched on-demand from the Lockbox API when you copy or reveal a key, and are only held in memory momentarily.

### What the Extension does NOT access:

- Browsing history
- Personal files
- Other browser extension data
- Passwords or autofill data

## Data Storage

All data is stored locally in your browser using `chrome.storage.local`. No data is sent to any server other than `dashboard.yourlockbox.dev` (your Lockbox account).

## Third-Party Services

The Extension communicates only with `dashboard.yourlockbox.dev` — the Lockbox dashboard API. No other third-party services are contacted.

## Content Scripts

The Extension runs content scripts on specific sites (OpenAI, Stripe, AWS, GitHub, Anthropic, Clerk) solely to detect API key input fields and offer auto-fill functionality. No page content is collected or transmitted.

## Permissions Justification

| Permission | Purpose |
|------------|---------|
| `activeTab` | Access the current tab to detect API key fields and inject the auto-fill UI |
| `storage` | Store authentication tokens and cached vault/key metadata locally |
| `contextMenus` | Add "Paste API Key" option to the right-click menu on input fields |
| `clipboardWrite` | Copy decrypted key values to your clipboard |
| `notifications` | Alert you about expiring API keys |
| `alarms` | Schedule periodic checks for expiring keys and cache refresh |
| `cookies` | Read your Lockbox dashboard session cookie for authentication |

## Host Permissions

The Extension requests access to specific hosts:

- `dashboard.yourlockbox.dev` — To communicate with the Lockbox API
- `platform.openai.com`, `dashboard.stripe.com`, `console.aws.amazon.com`, `github.com`, `console.anthropic.com`, `dashboard.clerk.com` — To detect API key input fields and offer auto-fill on these sites

## Data Deletion

Signing out of the Extension clears all locally stored data. You can also remove the Extension from Chrome at any time, which deletes all associated local storage.

## Changes to This Policy

We may update this privacy policy from time to time. Changes will be posted at this URL.

## Contact

For questions about this privacy policy, please contact us at:
- GitHub: https://github.com/Waldo777-bh/lockbox-extension/issues
- Website: https://yourlockbox.dev
