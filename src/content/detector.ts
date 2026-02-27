import { API_KEY_FIELD_SELECTORS } from "../lib/constants";

export interface DetectedField {
  element: HTMLInputElement | HTMLTextAreaElement;
  type: "input" | "textarea";
  confidence: "high" | "medium";
}

export function detectApiKeyFields(): DetectedField[] {
  const fields: DetectedField[] = [];
  const seen = new WeakSet();

  // Check explicit selectors
  for (const selector of API_KEY_FIELD_SELECTORS) {
    try {
      const elements = document.querySelectorAll<HTMLInputElement>(selector);
      elements.forEach((el) => {
        if (!seen.has(el) && isVisible(el)) {
          seen.add(el);
          fields.push({ element: el, type: "input", confidence: "high" });
        }
      });
    } catch {
      // Invalid selector, skip
    }
  }

  // Check all text/password inputs for API key patterns in labels
  const inputs = document.querySelectorAll<HTMLInputElement>(
    'input[type="text"], input[type="password"], input:not([type]), textarea',
  );

  inputs.forEach((el) => {
    if (seen.has(el) || !isVisible(el)) return;

    const label = getFieldLabel(el).toLowerCase();
    const apiKeyPatterns = [
      "api key",
      "api_key",
      "apikey",
      "secret key",
      "secret_key",
      "access token",
      "access_token",
      "auth token",
      "bearer token",
      "api token",
      "client secret",
    ];

    if (apiKeyPatterns.some((p) => label.includes(p))) {
      seen.add(el);
      fields.push({
        element: el as HTMLInputElement,
        type: el.tagName === "TEXTAREA" ? "textarea" : "input",
        confidence: "medium",
      });
    }
  });

  return fields;
}

function isVisible(el: HTMLElement): boolean {
  const style = window.getComputedStyle(el);
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0" &&
    el.offsetParent !== null
  );
}

function getFieldLabel(el: HTMLElement): string {
  const parts: string[] = [];

  // aria-label
  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel) parts.push(ariaLabel);

  // placeholder
  const placeholder = (el as HTMLInputElement).placeholder;
  if (placeholder) parts.push(placeholder);

  // name / id
  const name = el.getAttribute("name");
  if (name) parts.push(name);
  const id = el.id;
  if (id) parts.push(id);

  // Associated label
  if (el.id) {
    const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (label?.textContent) parts.push(label.textContent);
  }

  // Parent label
  const parentLabel = el.closest("label");
  if (parentLabel?.textContent) parts.push(parentLabel.textContent);

  return parts.join(" ");
}
