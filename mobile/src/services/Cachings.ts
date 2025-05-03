import {ISODatetime} from "@shared/type-utils";
import {Temporal} from "temporal-polyfill";
import {Logger} from "@/services/Logger";

const LOGGER = Logger.named("caching");

type CacheEntry = {
    expiresOn: ISODatetime;
    cacheKey: string;
}

const LOCALSTORAGE_CACHE_ENTRIES_KEY = "_cacheEntries";

function isExpired(entry: CacheEntry) {
    return new Date(entry.expiresOn).getTime() < Date.now();
}
function storeEntries(cachedEntries: CacheEntry[]) {
    localStorage.setItem(LOCALSTORAGE_CACHE_ENTRIES_KEY, JSON.stringify(cachedEntries));
}

function loadCacheEntries(): CacheEntry[] {
    const entries: CacheEntry[] = JSON.parse(localStorage.getItem(LOCALSTORAGE_CACHE_ENTRIES_KEY) || "[]");
    const withoutExpiredEntries = entries.filter(cachedEntry => !isExpired(cachedEntry));
    if(entries.length !== withoutExpiredEntries.length) {
        storeEntries(withoutExpiredEntries);
    }
    return withoutExpiredEntries;
}

function appendCacheEntry(cacheEntry: CacheEntry) {
    const entries = loadCacheEntries()
    entries.push(cacheEntry);
    storeEntries(entries);
}

type CheckCacheOutcome = "cache-still-valid" | "expired-cache";
export async function checkCache(cacheKey: string, newCacheValidityDuration: Temporal.Duration, doSomethingIfExpired: () => Promise<void>): Promise<{ outcome: CheckCacheOutcome }> {
    const cacheEntries = loadCacheEntries();

    const matchingCache = cacheEntries.find(ce => ce.cacheKey === cacheKey);
    let outcome: CheckCacheOutcome;
    if(!matchingCache || isExpired(matchingCache)) {
        outcome = "expired-cache";
    } else {
        outcome = "cache-still-valid"
    }

    if(outcome === "expired-cache") {
        try {
            await doSomethingIfExpired();
            appendCacheEntry({ cacheKey, expiresOn: Temporal.Now.zonedDateTimeISO().add(newCacheValidityDuration).toInstant().toString() as ISODatetime })
            LOGGER.debug(`Cache updated for ${cacheKey} (it was expired)`)
        }catch(error) {
            LOGGER.error(`Unexpected error during checkCache's [${cacheKey}] processing: ${error}`);
        }
    } else {
        LOGGER.debug(`Skipping process for cache ${cacheKey} (cache still valid)`)
    }

    return {outcome};
}

export function preloadPicture(pictureUrl: string) {
  return new Promise((resolve) => {
    const picture = new Image();
    picture.src = pictureUrl;

    picture.onload = resolve;
    picture.onerror = () => {
      LOGGER.debug(`Error while preloading picture [${pictureUrl}] => picture won't be available offline !`)
      resolve(null);
    };
  });
}
