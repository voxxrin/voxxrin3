import { DayTalksStats, TalkDetails, UserDayTalksNotes } from "./feedbacks";
import { ScheduleTalk } from "./schedule";

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