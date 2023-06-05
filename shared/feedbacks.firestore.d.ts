export type TalkStats = {
    id: string,
    totalFavoritesCount: number
}

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

export type UserFeedback = {
    timeslotId: string,
    talkId: string,
    ratings: {
        'linear-rating': number | null,
        'bingo': string[],
        'custom-rating': string | null
    },
    comment: string | null
}
