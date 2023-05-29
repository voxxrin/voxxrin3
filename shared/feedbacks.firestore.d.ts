export type TalkStats = {
    id: string,
    totalFavoritesCount: number
}

export type UserTalkNotes = {
    talkId: string,
    isFavorite: boolean,
    watchLater: boolean|null,
    ratings: {
        bingo: string[]|null,
        scale: number|null
    },
    comment: string|null
}

export type UserTalkNote = {
    userId: string,
    note: UserTalkNotes
    talkId: string,
}
