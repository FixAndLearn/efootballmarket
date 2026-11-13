/* eFootball Market Official App Service Worker — Notifications & Offline Resilience */

const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>eFootball Market — Offline</title>
  <style>
    body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; background:#0b1120; color:#f8fafc; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; padding:24px; text-align:center; }
    .card { max-width:360px; background:#111c33; border:1px solid #1e293b; border-radius:20px; padding:28px 24px; }
    .badge { display:inline-block; padding:4px 12px; border-radius:999px; background:#065f46; color:#a7f3d0; font-size:11px; font-weight:700; margin-bottom:12px; }
    h1 { margin:0 0 8px; font-size:20px; font-weight:800; }
    p { margin:0 0 20px; font-size:13px; line-height:1.5; color:#94a3b8; }
    button { width:100%; padding:13px 18px; border:0; border-radius:12px; background:#006340; color:#fff; font-weight:800; font-size:14px; cursor:pointer; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">eFootball Market App</span>
    <h1>You&apos;re Currently Offline</h1>
    <p>Turn on Safaricom / Airtel mobile data or Wi-Fi to view live squads and escrow orders.</p>
    <button onclick="window.location.reload()">Tap to Reconnect</button>
  </div>
</body>
</html>`;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(
        () =>
          new Response(OFFLINE_HTML, {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          })
      )
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const rawUrl =
    event.notification.data && typeof event.notification.data.url === "string"
      ? event.notification.data.url.trim()
      : "/notifications";
  const targetUrl =
    rawUrl.startsWith("/") && !rawUrl.startsWith("//") && !rawUrl.includes("\\")
      ? rawUrl
      : "/notifications";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            if ("navigate" in client && targetUrl) {
              return client.navigate(targetUrl);
            }
            return client;
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
        return undefined;
      })
  );
});
