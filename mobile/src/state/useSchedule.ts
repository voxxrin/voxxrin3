import {computed, unref} from "vue";
import {DailySchedule} from "../../../shared/dayly-schedule.firestore";
import {
    createVoxxrinDailyScheduleFromFirestore,
} from "@/models/VoxxrinSchedule";
import {DayId} from "@/models/VoxxrinDay";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {DocumentReference, doc, collection, getDoc} from "firebase/firestore";
import {db} from "@/state/firebase";
import {Unreffable} from "@/views/vue-utils";
import {useDocument} from "vuefire";
import {EventId} from "@/models/VoxxrinEvent";
import {prepareEventTalks} from "@/state/useEventTalk";
import {prepareTalkStats} from "@/state/useEventTalkStats";
import {prepareUserTalkNotes} from "@/state/useUserTalkNotes";
import {TalkId} from "@/models/VoxxrinTalk";

export function useSchedule(
            conferenceDescriptorRef: Unreffable<VoxxrinConferenceDescriptor | undefined>,
            dayIdRef: Unreffable<DayId | undefined>) {

    const firestoreDailyScheduleSource = computed(() => {
        const conferenceDescriptor = unref(conferenceDescriptorRef),
            dayId = unref(dayIdRef);

        if(!conferenceDescriptor || !dayId) {
            return undefined;
        }

        return dailyScheduleDocument(conferenceDescriptor.id, dayId);
    });

    const firestoreDailyScheduleRef = useDocument(firestoreDailyScheduleSource)

    return {
        schedule: computed(() => {
            const conferenceDescriptor = unref(conferenceDescriptorRef),
                firestoreDailySchedule = unref(firestoreDailyScheduleRef);

            if(!conferenceDescriptor || !firestoreDailySchedule) {
                return undefined;
            }

            const schedule = createVoxxrinDailyScheduleFromFirestore(conferenceDescriptor, firestoreDailySchedule)
            return schedule;
        })
    };
}

function dailyScheduleDocument(eventId: EventId, dayId: DayId) {
    return doc(collection(doc(collection(db, 'events'), eventId.value), 'days'), dayId.value) as DocumentReference<DailySchedule>;
}

export function prepareSchedules(
    conferenceDescriptor: VoxxrinConferenceDescriptor,
    dayIds: Array<DayId>
) {
    dayIds.forEach(async dayId => {
        useSchedule(conferenceDescriptor, dayId);

        if(navigator.onLine) {
            const dailyScheduleDoc = dailyScheduleDocument(conferenceDescriptor.id, dayId);
            const dailyScheduleSnapshot = await getDoc(dailyScheduleDoc);

            const dayAndTalkIds = dailyScheduleSnapshot.data()?.timeSlots.reduce((dayAndTalkIds, timeslot) => {
                if(timeslot.type === 'talks') {
                    timeslot.talks.forEach(talk => {
                        talk.speakers.forEach(speaker => {
                            if(speaker.photoUrl) {
                                const avatarImage = new Image();
                                avatarImage.src = speaker.photoUrl;
                            }
                            // avatarImage.onload = () => {
                            //     console.log(`Avatar ${speaker.photoUrl} pre-loaded !`)
                            // };
                        })

                        dayAndTalkIds.push({dayId, talkId: new TalkId(talk.id)})
                    })
                }

                return dayAndTalkIds;
            }, [] as Array<{dayId: DayId, talkId: TalkId}>) || [];

            prepareEventTalks(conferenceDescriptor, dayAndTalkIds.map(dat => dat.talkId));
            prepareTalkStats(conferenceDescriptor.id, dayAndTalkIds);
            prepareUserTalkNotes(conferenceDescriptor.id, dayAndTalkIds);
        }
    })


}
