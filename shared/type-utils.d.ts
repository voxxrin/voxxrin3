
export type ISOLocalDate = `${number}-${number}-${number}`;

export type ISOZonedTime = `${number}:${number}:${number}${'Z'|`${'+'|'-'}${number}:${number}`}`
export type ISODatetime = `${ISOLocalDate}T${ISOZonedTime}`;
// To ease debug in TS compiler messages, uncomment this
// export type ISODatetime = string

export type HexColor = `#${string}`

export type Replace<T, REPLACEMENT> = Omit<T, keyof REPLACEMENT> & REPLACEMENT;
export type ArrayReplace<T, FIELDNAME extends keyof T, REPLACEMENT> =
    T[FIELDNAME] extends Array<infer ITEM> ?
        Array<Replace<ITEM, REPLACEMENT>>:never;

export type SocialMediaType = "website"|"twitter"|"linkedin"|"mastodon"|"instagram"|"youtube"|"twitch"|"github"|"facebook"|"flickr"|"bluesky";
