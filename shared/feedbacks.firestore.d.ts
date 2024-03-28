import {ISODatetime} from "./type-utils";

export type TalkNote = {
    talkId: string,
    isFavorite: boolean,
    watchLater: boolean|null
}

export type UserTalkNote = {
    userId: string,
    note: TalkNote,
}

export type UserComputedEventInfos = {
    favoritedTalkIds: string[];
}

export type UserDailyFeedbacks = {
    dayId: string,
    feedbacks: Array<UserFeedback>
}

export type BaseUserFeedback = {
    timeslotId: string,
    alsoConcernsOverlappingTimeslotIds: string[]
    createdOn: ISODatetime,
    lastUpdatedOn: ISODatetime,
}

export type ProvidedUserFeedback = BaseUserFeedback & {
    status: 'provided',
    talkId: string,
    ratings: {
        'linear-rating': number | null,
        'bingo': string[],
        'custom-rating': string | null
    },
    comment: string | null,
}
export type SkippedUserFeedback = BaseUserFeedback & { status: 'skipped' }

export type UserFeedback = ProvidedUserFeedback | SkippedUserFeedback;
