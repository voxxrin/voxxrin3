import {initializeApp} from "firebase/app";
import {
    CACHE_SIZE_UNLIMITED,
    getFirestore,
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
} from "firebase/firestore";
import {config} from "@/state/firebase-config";


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