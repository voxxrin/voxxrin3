
export type ISOLocalDate = `${number}-${number}-${number}`;

export type ISODatetime = `${ISOLocalDate}T${number}:${number}:${number}${'Z'|`${'+'|'-'}${number}:${number}`}`;
// To ease debug in TS compiler messages, uncomment this
// export type ISODatetime = string
