import {registerRoute, Route, setDefaultHandler} from 'workbox-routing';
import {NetworkOnly, StaleWhileRevalidate} from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import {clientsClaim} from "workbox-core";
import {precacheAndRoute} from "workbox-precaching";

declare let self: ServiceWorkerGlobalScope

// TODO: comment this line if you want to debug workbox (very verbose!) logs in the console
self.__WB_DISABLE_DEV_LOGS = true

precacheAndRoute(self.__WB_MANIFEST);
setDefaultHandler(new NetworkOnly())

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

// this is necessary, since the new service worker will keep on skipWaiting state
// and then, caches will not be cleared since it is not activated
self.skipWaiting()
clientsClaim()
