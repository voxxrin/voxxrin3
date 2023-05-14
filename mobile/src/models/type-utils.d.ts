
export type Replace<T, REPLACEMENT> = Omit<T, keyof REPLACEMENT> & REPLACEMENT;
export type ArrayReplace<T, FIELDNAME extends keyof T, REPLACEMENT> =
    T[FIELDNAME] extends Array<infer ITEM> ?
        Array<Replace<ITEM, REPLACEMENT>>:never;
