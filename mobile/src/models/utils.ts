import { DayTalksStats, TalkDetails, UserDayTalksNotes } from "../../../shared/models/feedbacks";
import { ScheduleTalk } from "../../../shared/models/schedule";

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