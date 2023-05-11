import {EventId} from "@/models/VoxxrinEvent";
import {DayId} from "@/models/VoxxrinDay";
import {TalkId} from "@/models/VoxxrinTalk";
import {ref, Ref} from "vue";
import {useTalkEventStats} from "@/state/EventTalkStats";


export type TalkNotesHook = {
    talkNotes: Ref<{
        readonly talkId: TalkId,
        readonly isFavorite: boolean,
        readonly watchLater: boolean
    }>,
    toggleFavorite: () => void,
    toggleWatchLater: () => void,
}

const CACHED_TALK_NOTES_HOOKS = new Map<string, TalkNotesHook>()

export function useTalkNotes(eventId: EventId, day: DayId, talkId: TalkId): TalkNotesHook {
    const { incrementTotalFavoritesCount, decrementTotalFavoritesCount } = useTalkEventStats(eventId, day, talkId)
    const cacheKey = `${eventId.value}||${day.value}||${talkId.value}`
    if(!CACHED_TALK_NOTES_HOOKS.has(cacheKey)) {
        let talkNotesRef = ref({
            talkId,
            isFavorite: false,
            watchLater: false
        });

        const toggleFavorite = () => {
            talkNotesRef.value = {
                ...talkNotesRef.value,
                isFavorite: !talkNotesRef.value.isFavorite
            }

            if(talkNotesRef.value.isFavorite) {
                incrementTotalFavoritesCount();
            } else {
                decrementTotalFavoritesCount();
            }
        }
        const toggleWatchLater = () => {
            talkNotesRef.value = {
                ...talkNotesRef.value,
                watchLater: !talkNotesRef.value.watchLater
            }
        }

        const hook: TalkNotesHook = {
            talkNotes: talkNotesRef,
            toggleFavorite,
            toggleWatchLater
        };

        CACHED_TALK_NOTES_HOOKS.set(cacheKey, hook);
    }

    return CACHED_TALK_NOTES_HOOKS.get(cacheKey)!;
}
