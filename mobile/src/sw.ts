import {
    NavigationRoute,
    registerRoute,
    Route,
    setCatchHandler,
    setDefaultHandler
} from 'workbox-routing';
import { ExpirationPlugin } from 'workbox-expiration';
import {cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute} from "workbox-precaching";
import {cacheOkAndOpaquePlugin} from "workbox-strategies/plugins/cacheOkAndOpaquePlugin";
import {assert} from 'workbox-core/_private/assert.js';
import {logger} from 'workbox-core/_private/logger.js';
import {WorkboxError} from 'workbox-core/_private/WorkboxError.js';

import {NetworkOnly, StaleWhileRevalidate, Strategy, StrategyOptions} from 'workbox-strategies';
import {StrategyHandler} from 'workbox-strategies/StrategyHandler';
import {messages} from 'workbox-strategies/utils/messages';


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

class DeferredStaleWhileRevalidate extends Strategy {
    constructor(options: StrategyOptions = {}) {
        super(options);

        // If this instance contains no plugins with a 'cacheWillUpdate' callback,
        // prepend the `cacheOkAndOpaquePlugin` plugin to the plugins list.
        if (!this.plugins.some((p) => 'cacheWillUpdate' in p)) {
            this.plugins.unshift(cacheOkAndOpaquePlugin);
        }
    }

    /**
     * @private
     * @param {Request|string} request A request to run this strategy for.
     * @param {workbox-strategies.StrategyHandler} handler The event that
     *     triggered the request.
     * @return {Promise<Response>}
     */
    async _handle(request: Request, handler: StrategyHandler): Promise<Response> {
        const logs = [];

        if (process.env.NODE_ENV !== 'production') {
            assert!.isInstance(request, Request, {
                moduleName: 'workbox-strategies',
                className: this.constructor.name,
                funcName: 'handle',
                paramName: 'request',
            });
        }

        const fetchAndCachePromise = (async () => {
            return handler.fetchAndCachePut(request).catch(() => {
                // Swallow this error because a 'no-response' error will be thrown in
                // main handler return flow. This will be in the `waitUntil()` flow.
            });
        });

        let response = await handler.cacheMatch(request);

        let error;
        if (response) {
            if (process.env.NODE_ENV !== 'production') {
                logs.push(
                    `Found a cached response in the '${this.cacheName}'` +
                    ` cache. Will update with the network response in the background.`,
                );
            }

            void handler.waitUntil(new Promise(async resolve => {
                await new Promise(tr => setTimeout(tr, 15000));
                return fetchAndCachePromise();
            }));
        } else {
            if (process.env.NODE_ENV !== 'production') {
                logs.push(
                    `No response found in the '${this.cacheName}' cache. ` +
                    `Will wait for the network response.`,
                );
            }
            try {
                const fetchPromise = fetchAndCachePromise()
                handler.waitUntil(fetchPromise);
                // NOTE(philipwalton): Really annoying that we have to type cast here.
                // https://github.com/microsoft/TypeScript/issues/20006
                response = (await fetchPromise) as Response | undefined;
            } catch (err) {
                if (err instanceof Error) {
                    error = err;
                }
            }
        }

        if (process.env.NODE_ENV !== 'production') {
            logger.groupCollapsed(
                messages.strategyStart(this.constructor.name, request),
            );
            for (const log of logs) {
                logger.log(log);
            }
            messages.printFinalResponse(response);
            logger.groupEnd();
        }

        if (!response) {
            throw new WorkboxError('no-response', {url: request.url, error});
        }
        return response;
    }
}


setDefaultHandler(new NetworkOnly())
// setDefaultHandler(new DeferredStaleWhileRevalidate({
//     cacheName: 'default',
//     plugins: [
//         // considering cache should be expired after 1 month
//         new ExpirationPlugin({ maxAgeSeconds: 60 * 60 * 24 * 30, })
//     ],
// }))
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
