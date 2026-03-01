// API key field detection on web pages

const API_KEY_SELECTORS = [
  'input[name*="api_key" i]',
  'input[name*="apikey" i]',
  'input[name*="api-key" i]',
  'input[name*="secret_key" i]',
  'input[name*="secretkey" i]',
  'input[name*="secret-key" i]',
  'input[name*="access_token" i]',
  'input[name*="accesstoken" i]',
  'input[name*="access-token" i]',
  'input[name*="api_token" i]',
  'input[name*="bearer" i]',
  'input[name*="authorization" i]',
  'input[id*="api_key" i]',
  'input[id*="apikey" i]',
  'input[id*="api-key" i]',
  'input[id*="secret_key" i]',
  'input[id*="secretkey" i]',
  'input[id*="access_token" i]',
  'input[id*="api_token" i]',
  'input[placeholder*="api key" i]',
  'input[placeholder*="secret key" i]',
  'input[placeholder*="access token" i]',
  'input[placeholder*="api token" i]',
  'input[placeholder*="sk-" i]',
  'input[placeholder*="pk_" i]',
  'input[aria-label*="api key" i]',
  'input[aria-label*="secret key" i]',
  'input[aria-label*="token" i]',
  'textarea[name*="api_key" i]',
  'textarea[name*="secret" i]',
  'textarea[placeholder*="api key" i]',
  'textarea[placeholder*="token" i]',
];

const KEYWORD_PATTERNS = [
  /api[_-]?key/i,
  /secret[_-]?key/i,
  /access[_-]?token/i,
  /api[_-]?token/i,
  /bearer/i,
  /authorization/i,
  /api[_-]?secret/i,
];

export interface DetectedField {
  element: HTMLInputElement | HTMLTextAreaElement;
  type: "input" | "textarea";
  confidence: "high" | "medium";
  label: string;
}

function isVisible(el: HTMLElement): boolean {
  const style = getComputedStyle(el);
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0" &&
    el.offsetWidth > 0 &&
    el.offsetHeight > 0
  );
}

function getFieldLabel(el: HTMLElement): string {
  const attrs = [
    el.getAttribute("aria-label"),
    el.getAttribute("placeholder"),
    el.getAttribute("name"),
    el.getAttribute("id"),
  ];
  for (const attr of attrs) {
    if (attr) return attr;
  }

  // Check associated label
  const id = el.getAttribute("id");
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) return label.textContent?.trim() || "";
  }

  return "";
}

export function detectApiKeyFields(): DetectedField[] {
  const fields: DetectedField[] = [];
  const seen = new Set<Element>();

  // Phase 1: Direct CSS selectors (high confidence)
  for (const selector of API_KEY_SELECTORS) {
    try {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        if (seen.has(el)) continue;
        if (!isVisible(el as HTMLElement)) continue;
        seen.add(el);
        fields.push({
          element: el as HTMLInputElement | HTMLTextAreaElement,
          type: el.tagName === "TEXTAREA" ? "textarea" : "input",
          confidence: "high",
          label: getFieldLabel(el as HTMLElement),
        });
      }
    } catch {}
  }

  // Phase 2: Keyword pattern matching on all text/password inputs (medium confidence)
  const allInputs = document.querySelectorAll(
    'input[type="text"], input[type="password"], input:not([type]), textarea'
  );
  for (const el of allInputs) {
    if (seen.has(el)) continue;
    if (!isVisible(el as HTMLElement)) continue;

    const label = getFieldLabel(el as HTMLElement);
    const matches = KEYWORD_PATTERNS.some((p) => p.test(label));
    if (matches) {
      seen.add(el);
      fields.push({
        element: el as HTMLInputElement | HTMLTextAreaElement,
        type: el.tagName === "TEXTAREA" ? "textarea" : "input",
        confidence: "medium",
        label,
      });
    }
  }

  return fields;
}

// Export for use by injector
(window as any).__lockboxDetectFields = detectApiKeyFields;
