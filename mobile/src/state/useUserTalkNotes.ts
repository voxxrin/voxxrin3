import {EventId} from "@/models/VoxxrinEvent";
import {DayId} from "@/models/VoxxrinDay";
import {TalkId} from "@/models/VoxxrinTalk";
import {ref, Ref} from "vue";
import {useTalkStats} from "@/state/useEventTalkStats";
import {VoxxrinTalkStats} from "@/models/VoxxrinTalkStats";

export type TalkNotesHook = {
    eventTalkStats: Ref<VoxxrinTalkStats | undefined>,
    talkNotes: Ref<{
        readonly talkId: TalkId,
        readonly isFavorite: boolean,
        readonly watchLater: boolean
    }>,
    toggleFavorite: () => void,
    toggleWatchLater: () => void,
}

const CACHED_TALK_NOTES_HOOKS = new Map<string, TalkNotesHook>()

export function useUserTalkNotes(eventId: EventId, day: DayId, talkId: TalkId): TalkNotesHook {
    const { eventTalkStats, incrementInMemoryTotalFavoritesCount, decrementInMemoryTotalFavoritesCount } = useTalkStats(eventId, day, talkId)
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
                incrementInMemoryTotalFavoritesCount();
            } else {
                decrementInMemoryTotalFavoritesCount();
            }
        }
        const toggleWatchLater = () => {
            talkNotesRef.value = {
                ...talkNotesRef.value,
                watchLater: !talkNotesRef.value.watchLater
            }
        }

        const hook: TalkNotesHook = {
            eventTalkStats,
            talkNotes: talkNotesRef,
            toggleFavorite,
            toggleWatchLater
        };

        CACHED_TALK_NOTES_HOOKS.set(cacheKey, hook);
    }

    return CACHED_TALK_NOTES_HOOKS.get(cacheKey)!;
}
