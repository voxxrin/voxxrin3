export interface TalkStats {
    id: string,
    totalFavoritesCount: number
}

export interface UserTalkNotes {
    talkId: string,
    isFavorite: boolean,
    watchLater?: boolean,
    ratings: {
        bingo?: string[],
        scale?: number
    },
    comment?: string
}

export interface DayTalksStats {
    day: string,
    stats: TalkStats[]
}

export interface UserDayTalksNotes {
    userId: string,
    day: string,
    notes: UserTalkNotes[]
}