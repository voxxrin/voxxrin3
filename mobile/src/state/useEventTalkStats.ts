import {EventId} from "@/models/VoxxrinEvent";
import {DayId} from "@/models/VoxxrinDay";
import {TalkId} from "@/models/VoxxrinTalk";
import {ref, Ref} from "vue";


export type TalkEventStatsHook = {
    eventTalkStats: Ref<{
        readonly talkId: TalkId,
        readonly totalFavoritesCount: number|undefined
    }>,
    incrementTotalFavoritesCount: () => void,
    decrementTotalFavoritesCount: () => void,
}

const CACHED_EVENTS_STATS_HOOKS = new Map<string, TalkEventStatsHook>()

export function useEventTalkStats(eventId: EventId, day: DayId, talkId: TalkId): TalkEventStatsHook {
    const cacheKey = `${eventId.value}||${day.value}||${talkId.value}`
    if(!CACHED_EVENTS_STATS_HOOKS.has(cacheKey)) {
        let eventTalkStatsRef: TalkEventStatsHook['eventTalkStats'] = ref({
            talkId,
            totalFavoritesCount: Math.ceil(Math.random()*50)
        });

        const incrementTotalFavoritesCount = () => {
            eventTalkStatsRef.value = {
                ...eventTalkStatsRef.value,
                totalFavoritesCount: (eventTalkStatsRef.value.totalFavoritesCount || 0)+1
            }
        }
        const decrementTotalFavoritesCount = () => {
            eventTalkStatsRef.value = {
                ...eventTalkStatsRef.value,
                totalFavoritesCount: (eventTalkStatsRef.value.totalFavoritesCount || 0)-1
            }
        }

        const hook: TalkEventStatsHook = {
            eventTalkStats: eventTalkStatsRef,
            incrementTotalFavoritesCount,
            decrementTotalFavoritesCount
        };

        CACHED_EVENTS_STATS_HOOKS.set(cacheKey, hook);
    }

    return CACHED_EVENTS_STATS_HOOKS.get(cacheKey)!;
}
