const ANALYTICS_ENDPOINT = import.meta.env.VITE_ANALYTICS_URL || '/api/analytics/events';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function send(event, payload = {}) {
  const entry = {
    event,
    payload,
    ts: new Date().toISOString(),
    path: window.location.pathname,
    referrer: document.referrer,
  };

  if (import.meta.env.DEV) {
    console.log('[analytics]', entry);
  }

  const blob = new Blob([JSON.stringify(entry)], { type: 'application/json' });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(ANALYTICS_ENDPOINT, blob);
  } else {
    fetch(ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(entry),
      keepalive: true,
    }).catch(() => {});
  }
}

export function trackProductView(productId, productName) {
  send('product_view', { productId, productName });
}

export function trackProductClick(productId, productName, action) {
  send('product_click', { productId, productName, action });
}

export function trackCatalogView() {
  send('catalog_view');
}

export function trackCTAClick(cta, productId, productName) {
  send('cta_click', { cta, productId, productName });
}

export default { trackProductView, trackProductClick, trackCatalogView, trackCTAClick };
