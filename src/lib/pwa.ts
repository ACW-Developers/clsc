/**
 * Guarded service-worker registration. Registers /sw.js only in real
 * production deployments — never in dev, iframes, or Lovable preview hosts —
 * and unregisters stale workers wherever registration is refused.
 */
const PREVIEW_LABEL = /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/;
const PREVIEW_HOSTS = ["lovable.app", "gpt-eng.com", "gptengineer.run"];

function isRefusedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  if (window.self !== window.top) return true;
  if (new URLSearchParams(window.location.search).has("sw")) {
    if (new URLSearchParams(window.location.search).get("sw") === "off")
      return true;
  }
  const host = window.location.hostname.toLowerCase();
  const label = host.split(".")[0];
  for (const domain of PREVIEW_HOSTS) {
    if (host === domain || host.endsWith(`.${domain}`)) {
      if (PREVIEW_LABEL.test(label) || label.startsWith("project--"))
        return true;
    }
  }
  if (
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev")
  )
    return true;
  return false;
}

async function unregisterStale() {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    regs
      .filter((r) => r.active?.scriptURL.endsWith("/sw.js"))
      .map((r) => r.unregister()),
  );
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (isRefusedContext()) {
    await unregisterStale();
    return;
  }
  const { registerSW } = await import("virtual:pwa-register");
  registerSW({ immediate: true });
}
