import {ISODatetime} from "./type-utils";

export type TalkAttendeeFeedback = {
    talkId: string,
    attendeePublicToken: string;
    createdOn: ISODatetime,
    lastUpdatedOn: ISODatetime,
    ratings: {
        'linear-rating': number | null,
        'bingo': string[],
        'custom-rating': string | null
    },
    comment: string | null,
}
