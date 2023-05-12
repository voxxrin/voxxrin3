import {EventId} from "@/models/VoxxrinEvent";
import {DayId} from "@/models/VoxxrinDay";
import {
    createVoxxrinDetailedTalkFromFirestore,
    TalkId,
    VoxxrinDetailedTalk,
} from "@/models/VoxxrinTalk";
import {ref, Ref} from "vue";
import {DetailedTalk, Talk} from "../../../shared/dayly-schedule.firestore";
import {useCurrentConferenceDescriptor} from "@/state/CurrentConferenceDescriptor";
import {fetchSchedule} from "@/state/CurrentSchedule";


export type TalkHook = {
    talk: Ref<VoxxrinDetailedTalk|undefined>,
}

const CACHED_TALKS_HOOKS = new Map<string, TalkHook>()

export function useEventTalk(eventId: EventId, day: DayId, talkId: TalkId): TalkHook {
    const cacheKey = `${eventId.value}||${day.value}||${talkId.value}`
    if(!CACHED_TALKS_HOOKS.has(cacheKey)) {
        let talkRef: TalkHook['talk'] = ref();

        const hook: TalkHook = {
            talk: talkRef,
        };

        fetch(`/data/events/${eventId.value}/talks/${talkId.value}.json`)
            .then(resp => resp.json())
            .then(async (firestoreTalk: DetailedTalk) => {
                const confDescriptor = useCurrentConferenceDescriptor(eventId);
                if(confDescriptor.value) {
                    const schedule = await fetchSchedule(confDescriptor.value, day);
                    talkRef.value = createVoxxrinDetailedTalkFromFirestore(confDescriptor.value, schedule, firestoreTalk);
                }
            })

        CACHED_TALKS_HOOKS.set(cacheKey, hook);
    }

    return CACHED_TALKS_HOOKS.get(cacheKey)!;
}
