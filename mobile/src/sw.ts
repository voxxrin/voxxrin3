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

// 1/ Nothing
// => RUNTIME: firebase is not defined

// 2/
// import 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js';
// import 'https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js';
// => RUNTIME: Uncaught SyntaxError: Cannot use import statement outside a module (at sw.js:1:1)

// 3/
// import "firebase/firebase-app-compat"
// import "firebase/firebase-messaging-compat"
// => BUILD TIME: Missing "./firebase-app-compat" specifier in "firebase" package

// 4/
// import "firebase/compat/app"
// import "firebase/compat/messaging"
// => RUNTIME: firebase is not defined

// 5/
// import "firebase/app"
// import "firebase/messaging"
// => RUNTIME: firebase is not defined

// 6/
// import * as firebase from "firebase/app";
// import "firebase/messaging";
// => RUNTIME execution error on messaging() row

// 7/
// const firebaseImportedPromise = Promise.resolve().then(() => Promise.all([
//     // @ts-ignore
//     import('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js'),
//     // @ts-ignore
//     import('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js'),
// ]))
// => RUNTIME: TypeError: import() is disallowed on ServiceWorkerGlobalScope by the HTML specification. See https://github.com/w3c/ServiceWorker/issues/1356.

// 8/
import {initializeApp} from "firebase/app";
import {getMessaging, onMessage} from "firebase/messaging";
import {onBackgroundMessage} from "firebase/messaging/sw";

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

// declare let firebase: any;
const firebaseApp = initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
});

try {
    const messaging = getMessaging(firebaseApp);

    onMessage(messaging, (payload: any) => {
        console.log('Message received. ', payload);
    });
    onBackgroundMessage(messaging, (payload: any) => {
        self.registration.showNotification(payload.notification.title, {
            body: payload.notification.body,
            icon: '/assets/imgs/logo.png'
        });
    });
}catch(messagingErr) {
    console.warn(`Looks like we got an error during firebase messaging registration: ${messagingErr}`)
}
