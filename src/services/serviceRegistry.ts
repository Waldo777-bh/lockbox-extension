import type { ServiceDefinition } from "@/types";

export const SERVICES: Record<string, ServiceDefinition> = {
  openai: {
    name: "OpenAI",
    icon: "openai.svg",
    color: "#10a37f",
    keyPrefixes: ["sk-proj-", "sk-"],
    dashboardUrls: ["platform.openai.com"],
    commonKeyNames: ["API_KEY"],
  },
  anthropic: {
    name: "Anthropic",
    icon: "anthropic.svg",
    color: "#d4a27f",
    keyPrefixes: ["sk-ant-"],
    dashboardUrls: ["console.anthropic.com"],
    commonKeyNames: ["API_KEY"],
  },
  stripe: {
    name: "Stripe",
    icon: "stripe.svg",
    color: "#635bff",
    keyPrefixes: ["sk_test_", "sk_live_", "pk_test_", "pk_live_", "rk_test_", "rk_live_"],
    dashboardUrls: ["dashboard.stripe.com"],
    commonKeyNames: ["SECRET_KEY", "PUBLISHABLE_KEY", "RESTRICTED_KEY"],
  },
  aws: {
    name: "AWS",
    icon: "aws.svg",
    color: "#ff9900",
    keyPrefixes: ["AKIA"],
    dashboardUrls: ["console.aws.amazon.com"],
    commonKeyNames: ["ACCESS_KEY", "SECRET_KEY"],
  },
  github: {
    name: "GitHub",
    icon: "github.svg",
    color: "#ffffff",
    keyPrefixes: ["ghp_", "gho_", "ghu_", "ghs_", "ghr_"],
    dashboardUrls: ["github.com/settings"],
    commonKeyNames: ["PERSONAL_ACCESS_TOKEN"],
  },
  google_cloud: {
    name: "Google Cloud",
    icon: "google-cloud.svg",
    color: "#4285f4",
    keyPrefixes: ["AIza"],
    dashboardUrls: ["console.cloud.google.com"],
    commonKeyNames: ["API_KEY"],
  },
  vercel: {
    name: "Vercel",
    icon: "vercel.svg",
    color: "#ffffff",
    keyPrefixes: [],
    dashboardUrls: ["vercel.com/account/tokens"],
    commonKeyNames: ["TOKEN"],
  },
  supabase: {
    name: "Supabase",
    icon: "supabase.svg",
    color: "#3ecf8e",
    keyPrefixes: ["eyJ"],
    dashboardUrls: ["supabase.com/dashboard"],
    commonKeyNames: ["ANON_KEY", "SERVICE_ROLE_KEY"],
  },
  firebase: {
    name: "Firebase",
    icon: "firebase.svg",
    color: "#ffca28",
    keyPrefixes: ["AIza"],
    dashboardUrls: ["console.firebase.google.com"],
    commonKeyNames: ["API_KEY"],
  },
  clerk: {
    name: "Clerk",
    icon: "clerk.svg",
    color: "#6c47ff",
    keyPrefixes: ["pk_test_", "pk_live_", "sk_test_", "sk_live_"],
    dashboardUrls: ["dashboard.clerk.com"],
    commonKeyNames: ["PUBLISHABLE_KEY", "SECRET_KEY"],
  },
  railway: {
    name: "Railway",
    icon: "railway.svg",
    color: "#ffffff",
    keyPrefixes: [],
    dashboardUrls: ["railway.app"],
    commonKeyNames: ["TOKEN"],
  },
  cloudflare: {
    name: "Cloudflare",
    icon: "cloudflare.svg",
    color: "#f38020",
    keyPrefixes: [],
    dashboardUrls: ["dash.cloudflare.com"],
    commonKeyNames: ["API_TOKEN", "API_KEY"],
  },
  twilio: {
    name: "Twilio",
    icon: "twilio.svg",
    color: "#f22f46",
    keyPrefixes: ["SK"],
    dashboardUrls: ["console.twilio.com"],
    commonKeyNames: ["AUTH_TOKEN", "API_KEY"],
  },
  sendgrid: {
    name: "SendGrid",
    icon: "sendgrid.svg",
    color: "#1a82e2",
    keyPrefixes: ["SG."],
    dashboardUrls: ["app.sendgrid.com"],
    commonKeyNames: ["API_KEY"],
  },
  netlify: {
    name: "Netlify",
    icon: "netlify.svg",
    color: "#00c7b7",
    keyPrefixes: [],
    dashboardUrls: ["app.netlify.com"],
    commonKeyNames: ["ACCESS_TOKEN"],
  },
  digitalocean: {
    name: "DigitalOcean",
    icon: "digitalocean.svg",
    color: "#0080ff",
    keyPrefixes: ["dop_v1_"],
    dashboardUrls: ["cloud.digitalocean.com"],
    commonKeyNames: ["TOKEN"],
  },
  heroku: {
    name: "Heroku",
    icon: "heroku.svg",
    color: "#430098",
    keyPrefixes: [],
    dashboardUrls: ["dashboard.heroku.com"],
    commonKeyNames: ["API_KEY"],
  },
  resend: {
    name: "Resend",
    icon: "resend.svg",
    color: "#ffffff",
    keyPrefixes: ["re_"],
    dashboardUrls: ["resend.com"],
    commonKeyNames: ["API_KEY"],
  },
  neon: {
    name: "Neon",
    icon: "neon.svg",
    color: "#00e599",
    keyPrefixes: [],
    dashboardUrls: ["console.neon.tech"],
    commonKeyNames: ["API_KEY", "CONNECTION_STRING"],
  },
  planetscale: {
    name: "PlanetScale",
    icon: "planetscale.svg",
    color: "#000000",
    keyPrefixes: ["pscale_tkn_"],
    dashboardUrls: ["app.planetscale.com"],
    commonKeyNames: ["TOKEN", "PASSWORD"],
  },
};

export function getServiceByKey(serviceKey: string): ServiceDefinition | null {
  return SERVICES[serviceKey] ?? null;
}

export function getServiceName(serviceKey: string): string {
  return SERVICES[serviceKey]?.name ?? serviceKey;
}

export function getServiceColor(serviceKey: string): string {
  return SERVICES[serviceKey]?.color ?? "#6b7280";
}

export function getAllServiceKeys(): string[] {
  return Object.keys(SERVICES);
}

export function getServiceOptions(): { value: string; label: string }[] {
  return Object.entries(SERVICES)
    .map(([key, def]) => ({ value: key, label: def.name }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
