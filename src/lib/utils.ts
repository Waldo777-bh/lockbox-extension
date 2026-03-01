export function generateId(): string {
  return crypto.randomUUID();
}

export function maskValue(value: string): string {
  if (value.length <= 8) return "••••••••";
  const prefix = value.slice(0, 7);
  const suffix = value.slice(-4);
  return `${prefix}...${suffix}`;
}

export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function getPasswordStrength(password: string): {
  score: number;
  label: "weak" | "fair" | "strong" | "very strong";
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: "weak", color: "#ef4444" };
  if (score <= 2) return { score: 2, label: "fair", color: "#f59e0b" };
  if (score <= 3) return { score: 3, label: "strong", color: "#00d87a" };
  return { score: 4, label: "very strong", color: "#10b981" };
}

export function isKeyExpiringSoon(expiresAt: string | null, daysThreshold = 7): boolean {
  if (!expiresAt) return false;
  const expiry = new Date(expiresAt).getTime();
  const now = Date.now();
  const threshold = daysThreshold * 24 * 60 * 60 * 1000;
  return expiry - now < threshold && expiry > now;
}

export function isKeyExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function generateIdenticon(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 65%, 55%)`;
}

export function countAllKeys(vaults: { keys: any[] }[]): number {
  return vaults.reduce((sum, v) => sum + v.keys.length, 0);
}

export function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}
