import {registerRoute, Route, setDefaultHandler} from 'workbox-routing';
import {NetworkOnly, StaleWhileRevalidate} from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import {clientsClaim} from "workbox-core";

declare let self: ServiceWorkerGlobalScope

setDefaultHandler(new NetworkOnly())

// this is necessary, since the new service worker will keep on skipWaiting state
// and then, caches will not be cleared since it is not activated
self.skipWaiting()
clientsClaim()
