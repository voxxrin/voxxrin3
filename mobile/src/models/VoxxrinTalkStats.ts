import {TalkId} from "@/models/VoxxrinTalk";
import {Replace} from "@shared/type-utils";
import {TalkStats} from "@shared/event-stats";

export type VoxxrinTalkStats = Replace<TalkStats, {
    id: TalkId
}>

export function createVoxxrinTalkStatsFromFirestore(firestoreTalkStats: TalkStats): VoxxrinTalkStats {
    return {
        ...firestoreTalkStats,
        id: new TalkId(firestoreTalkStats.id)
    };
}
