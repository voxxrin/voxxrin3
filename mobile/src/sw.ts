import {
    NavigationRoute,
    registerRoute,
    Route,
    setCatchHandler,
    setDefaultHandler
} from 'workbox-routing';
import {NetworkOnly, StaleWhileRevalidate, Strategy, StrategyHandler} from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import {cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute} from "workbox-precaching";

declare let self: ServiceWorkerGlobalScope & {__WB_DISABLE_DEV_LOGS?: boolean}

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting()
    }
})


// TODO: comment this line if you want to debug workbox (very verbose!) logs in the console
self.__WB_DISABLE_DEV_LOGS = true

const wbManifest = self.__WB_MANIFEST
precacheAndRoute(wbManifest);

cleanupOutdatedCaches()

// To allow working offline
if(!import.meta.env.DEV) {
    registerRoute(new NavigationRoute(
        createHandlerBoundToURL(import.meta.env.BASE_URL+'index.html')
    ))
}

// A new route that matches same-origin image requests and handles
// them with the cache-first, falling back to network strategy:
const imageRoute = new Route(({ request, sameOrigin }) => {
    const matches = !sameOrigin && request.destination === 'image'
    return matches;
}, new StaleWhileRevalidate({
    cacheName: 'external-images',
    plugins: [
        // keeping pictures in cache for 1 month
        new ExpirationPlugin({ maxAgeSeconds: 60 * 60 * 24 * 30, })
    ]
}));

// Register the new route
registerRoute(imageRoute);

setDefaultHandler(new NetworkOnly())
setCatchHandler(async (event) => {
    const headers: Record<string, string> = {};
    event.request.headers.forEach((v, k) => { headers[k] = v; })
    console.warn(`CatchHandler called for: ${JSON.stringify({
        destination: event.request.destination,
        url: event.request.url,
        method: event.request.method,
        mode: event.request.mode,
        cache: event.request.cache,
        credentials: event.request.credentials,
        headers,
        redirect: event.request.redirect,
        bodyUsed: event.request.bodyUsed
    })}`)
    return Response.error();
})
