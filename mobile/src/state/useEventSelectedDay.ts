import {Unreffable} from "@/views/vue-utils";
import {EventId} from "@/models/VoxxrinEvent";
import {computed, reactive, unref} from "vue";
import {DayId} from "@/models/VoxxrinDay";
import {createSharedComposable} from "@vueuse/core";
import {PERF_LOGGER} from "@/services/Logger";


const perEventIdSelectedDayIdRef = reactive(new Map<string, string>());

function useEventSelectedDay(
    eventIdRef: Unreffable<EventId|undefined>
) {
    PERF_LOGGER.debug(() => `useEventSelectedDay(${unref(eventIdRef)?.value})`)

    return {
        setSelectedDayId: (dayIdRef: Unreffable<DayId>) => {
            const eventId = unref(eventIdRef),
                  dayId = unref(dayIdRef),
                  perEventIdSelectedDayId = unref(perEventIdSelectedDayIdRef);

            if(!eventId || !dayId) {
                return;
            }

            perEventIdSelectedDayIdRef.set(eventId.value, dayId.value);
        },
        selectedDayId: computed((): DayId|undefined => {
            const eventId = unref(eventIdRef),
                perEventIdSelectedDayId = unref(perEventIdSelectedDayIdRef);

            if(!eventId) {
                return undefined;
            }

            const rawDayId = perEventIdSelectedDayId.get(eventId.value);
            if(rawDayId) {
                return new DayId(rawDayId);
            } else {
                return undefined;
            }
        })
    }
}

export const useSharedEventSelectedDay = createSharedComposable(useEventSelectedDay);
