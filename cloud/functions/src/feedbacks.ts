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