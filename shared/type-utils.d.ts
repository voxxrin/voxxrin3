
export type ISOLocalDate = `${number}-${number}-${number}`;

export type ISODatetime = `${ISOLocalDate}T${number}:${number}:${number}${'Z'|`${'+'|'-'}${number}:${number}`}`;
// To ease debug in TS compiler messages, uncomment this
// export type ISODatetime = string

export type HexColor = `#${string}`

export type Replace<T, REPLACEMENT> = Omit<T, keyof REPLACEMENT> & REPLACEMENT;
export type ArrayReplace<T, FIELDNAME extends keyof T, REPLACEMENT> =
    T[FIELDNAME] extends Array<infer ITEM> ?
        Array<Replace<ITEM, REPLACEMENT>>:never;
