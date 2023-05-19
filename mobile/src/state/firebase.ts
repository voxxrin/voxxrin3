import {initializeApp} from "firebase/app";
import {
    CACHE_SIZE_UNLIMITED,
    getFirestore,
    initializeFirestore,
    connectFirestoreEmulator,
    persistentLocalCache,
    persistentMultipleTabManager,
} from "firebase/firestore";
import {firestoreDefaultConverter, globalFirestoreOptions} from "vuefire";


export const app = initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
});

initializeFirestore(app,
    {
        localCache:
            persistentLocalCache({
                tabManager: persistentMultipleTabManager(),
                cacheSizeBytes: CACHE_SIZE_UNLIMITED
            }),
    });

export const db = getFirestore(app);

if (location.hostname === "localhost" && import.meta.env.DEV && import.meta.env.VITE_USE_LOCAL_FIREBASE_INSTANCE === 'true') {
    connectFirestoreEmulator(db, 'localhost', 8080);
}

globalFirestoreOptions.converter = {
    // the default converter just returns the data: (data) => data
    toFirestore: firestoreDefaultConverter.toFirestore,
    fromFirestore: (snapshot, options) => {
        const data = firestoreDefaultConverter.fromFirestore(snapshot, options);
        if(data && snapshot.data()?.id !== undefined && snapshot.data()?.id !== data.id) {
            data.__initialId = snapshot.data().id
        }
        return data
    },
};

