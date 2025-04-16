import {Unreffable} from "@/views/vue-utils";
import {SpacedEventId, stringifySpacedEventId} from "@/models/VoxxrinEvent";
import {computed, reactive, unref} from "vue";
import {DayId} from "@/models/VoxxrinDay";
import {createSharedComposable} from "@vueuse/core";
import {PERF_LOGGER} from "@/services/Logger";
import {resolvedSpacedEventFieldName} from "@shared/utilities/event-utils";


const perEventIdSelectedDayIdRef = reactive(new Map<string, string>());

function useEventSelectedDay(
    spacedEventIdRef: Unreffable<SpacedEventId|undefined>
) {
    PERF_LOGGER.debug(() => `useEventSelectedDay(${stringifySpacedEventId(unref(spacedEventIdRef))})`)

    return {
        setSelectedDayId: (dayIdRef: Unreffable<DayId>) => {
            const spacedEventId = unref(spacedEventIdRef),
                  dayId = unref(dayIdRef),
                  perEventIdSelectedDayId = unref(perEventIdSelectedDayIdRef);

            if(!spacedEventId || !spacedEventId.eventId || !dayId) {
                return;
            }

            perEventIdSelectedDayId.set(resolvedSpacedEventFieldName(spacedEventId.eventId.value, spacedEventId.spaceToken?.value), dayId.value);
        },
        selectedDayId: computed((): DayId|undefined => {
            const spacedEventId = unref(spacedEventIdRef),
                perEventIdSelectedDayId = unref(perEventIdSelectedDayIdRef);

            if(!spacedEventId || !spacedEventId.eventId) {
                return undefined;
            }

            const rawDayId = perEventIdSelectedDayId.get(resolvedSpacedEventFieldName(spacedEventId.eventId.value, spacedEventId.spaceToken?.value));
            if(rawDayId) {
                return new DayId(rawDayId);
            } else {
                return undefined;
            }
        })
    }
}

export const useSharedEventSelectedDay = createSharedComposable(useEventSelectedDay);
