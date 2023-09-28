import {TalkStats} from "../../../shared/feedbacks.firestore";
import {TalkId} from "@/models/VoxxrinTalk";
import {Replace} from "../../../shared/type-utils";

export type VoxxrinTalkStats = Replace<TalkStats, {
    id: TalkId
}>

export function createVoxxrinTalkStatsFromFirestore(firestoreTalkStats: TalkStats): VoxxrinTalkStats {
    return {
        ...firestoreTalkStats,
        id: new TalkId(firestoreTalkStats.id)
    };
}
