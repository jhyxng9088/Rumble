export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
    return;
  }

  const scope = import.meta.env.BASE_URL;
  void navigator.serviceWorker.register(`${scope}sw.js`, { scope }).catch((error: unknown) => {
    console.warn("RUMBLE service worker registration failed.", error);
  });
}
