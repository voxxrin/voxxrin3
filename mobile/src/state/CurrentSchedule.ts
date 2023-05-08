import {ref, watch} from "vue";
import {
    DailySchedule,
} from "../../../shared/dayly-schedule.firestore";
import {
    createVoxxrinDailyScheduleFromFirestore,
    VoxxrinDailySchedule
} from "@/models/VoxxrinSchedule";
import {DayId} from "@/models/VoxxrinDay";
import {findVoxxrinDay, VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {useFetchJsonDebouncer} from "@/state/state-utilities";
import {storeDailyCachedSchedule, useDailyCachedSchedule} from "@/state/CachedSchedules";
import {match} from "ts-pattern";


const CURRENT_SCHEDULE = ref<VoxxrinDailySchedule|undefined>(undefined);

export const useCurrentSchedule = () => CURRENT_SCHEDULE.value;

export const watchCurrentSchedule = (callback: (currentSchedule: (VoxxrinDailySchedule | undefined)) => void,) => {
    watch(CURRENT_SCHEDULE, callback, {immediate: true});
}

export function unsetCurrentSchedule() {
    CURRENT_SCHEDULE.value = undefined;
}

export const fetchSchedule = async (conferenceDescriptor: VoxxrinConferenceDescriptor, dayId: DayId) => {
    // Avoiding to fetch schedule if the one already loaded matches the one expected
    if(
        !CURRENT_SCHEDULE.value?.eventId.isSameThan(conferenceDescriptor.id)
        || !CURRENT_SCHEDULE.value?.day.isSameThan(dayId)
    ) {
        const day = findVoxxrinDay(conferenceDescriptor, dayId)
        const voxxrinDailySchedule = await match(useDailyCachedSchedule(conferenceDescriptor.id, dayId))
            .with(undefined, async () => {
                const firestoreDailySchedule: DailySchedule = await useFetchJsonDebouncer(
                    'daily-schedule',
                    `events/${conferenceDescriptor.id.value}/days/${day.id.value}`,
                    `/data/events/${conferenceDescriptor.id.value}/days/${day.id.value}.json`
                );
                console.debug(`timeslots fetched:`, firestoreDailySchedule.timeSlots)
                const voxxrinSchedule = createVoxxrinDailyScheduleFromFirestore(conferenceDescriptor, firestoreDailySchedule);

                // Caching schedule
                storeDailyCachedSchedule(conferenceDescriptor.id, dayId, voxxrinSchedule);

                return voxxrinSchedule;
            })
            .otherwise(async cachedDailySchedule =>
                Promise.resolve(cachedDailySchedule.schedule())
            )

        CURRENT_SCHEDULE.value = voxxrinDailySchedule;
    }
}
