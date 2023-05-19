import {TalkStats} from "../../../shared/feedbacks.firestore";
import {Replace} from "@/models/type-utils";
import {TalkId} from "@/models/VoxxrinTalk";

export type VoxxrinTalkStats = Replace<TalkStats, {
    id: TalkId
}>

export function createVoxxrinTalkStatsFromFirestore(firestoreTalkStats: TalkStats): VoxxrinTalkStats {
    return {
        ...firestoreTalkStats,
        id: new TalkId(firestoreTalkStats.id)
    };
}
