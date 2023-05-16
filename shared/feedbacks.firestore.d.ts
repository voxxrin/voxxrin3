export type TalkStats = {
    id: string,
    totalFavoritesCount: number
}

export type UserTalkNotes = {
    talkId: string,
    isFavorite: boolean,
    watchLater?: boolean,
    ratings: {
        bingo?: string[],
        scale?: number
    },
    comment?: string
}

export type DayTalksStats = {
    day: string,
    stats: TalkStats[]
}

export type UserDayTalksNotes = {
    userId: string,
    day: string,
    notes: UserTalkNotes[]
}
