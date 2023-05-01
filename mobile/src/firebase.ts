import {initializeApp} from "firebase/app";
import {
    CACHE_SIZE_UNLIMITED,
    getFirestore,
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
} from "firebase/firestore";

const config = {
    apiKey: "AIzaSyAW9jE7KrFM0FTzWa2CPl-NHQen-IwPKYs",
    authDomain: "voxxrin-v3-poc.firebaseapp.com",
    projectId: "voxxrin-v3-poc",
    storageBucket: "voxxrin-v3-poc.appspot.com",
    messagingSenderId: "20680838449",
    appId: "1:20680838449:web:9049ca9161983d0b0d3410"
};

export const app = initializeApp(config);

initializeFirestore(app,
    {
        localCache:
            persistentLocalCache({
                tabManager: persistentMultipleTabManager(),
                cacheSizeBytes: CACHE_SIZE_UNLIMITED
            }),
    });

export const db = getFirestore(app);