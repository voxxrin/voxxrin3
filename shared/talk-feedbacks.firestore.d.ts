import {ISODatetime} from "./type-utils";

export type FeedbackRatings = {
    'linear-rating': number | null,
    'bingo': string[],
    'custom-rating': string | null
}

export type TalkAttendeeFeedback = {
    talkId: string,
    attendeePublicToken: string;
    createdOn: ISODatetime,
    lastUpdatedOn: ISODatetime,
    ratings: FeedbackRatings,
    comment: string | null,
}
