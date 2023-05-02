import { ScheduleTalk } from "./schedule"

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

export interface TalkDetails {
    talk: ScheduleTalk,
    talkStats: TalkStats,
    talkNotes: UserTalkNotes
}

export function getTalkDetails(
    talk: ScheduleTalk,
    stats?: DayTalksStats,
    talksNotes?: UserDayTalksNotes) {
    
    const talkStats = stats?.stats
        .find((t) => {return t.id == talk.id}) 
        ?? {id: talk.id, totalFavoritesCount: 0}

    const talkNotes = talksNotes?.notes
        .find((t) => {return t.talkId == talk.id}) 
        ?? undefined

    return {talk: talk, talkStats: talkStats, talkNotes: talkNotes} as TalkDetails;
  }