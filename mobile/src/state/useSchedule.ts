import {computed, Ref, unref, watch} from "vue";
import {deferredVuefireUseDocument, managedRef as ref} from "@/views/vue-utils";
import {DailySchedule} from "../../../shared/daily-schedule.firestore";
import {
    createVoxxrinDailyScheduleFromFirestore,
    getTimeslotLabel,
    VoxxrinDailySchedule,
    VoxxrinScheduleTimeSlot,
} from "@/models/VoxxrinSchedule";
import {DayId} from "@/models/VoxxrinDay";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {DocumentReference, doc, collection, getDoc} from "firebase/firestore";
import {db} from "@/state/firebase";
import {prepareEventTalks} from "@/state/useEventTalk";
import {prepareTalkStats} from "@/state/useEventTalkStats";
import {prepareUserTalkNotes} from "@/state/useUserTalkNotes";
import {filterTalksMatching, TalkId, VoxxrinTalk} from "@/models/VoxxrinTalk";
import {findTimeslotFeedback, VoxxrinTimeslotFeedback} from "@/models/VoxxrinFeedback";
import {UserDailyFeedbacks} from "../../../shared/feedbacks.firestore";
import {PERF_LOGGER} from "@/services/Logger";
import { User } from 'firebase/auth';

export function useSchedule(
            conferenceDescriptorRef: Ref<VoxxrinConferenceDescriptor | undefined>,
            dayIdRef: Ref<DayId | undefined>) {

    PERF_LOGGER.debug(() => `useSchedule(${unref(conferenceDescriptorRef)?.id.value}, ${unref(dayIdRef)?.value})`)
    watch(() => unref(conferenceDescriptorRef), (newVal, oldVal) => {
        PERF_LOGGER.debug(() => `useSchedule[conferenceDescriptorRef] updated from [${oldVal?.id.value}] to [${newVal?.id.value}]`)
    }, {immediate: true})
    watch(() => unref(dayIdRef), (newVal, oldVal) => {
        PERF_LOGGER.debug(() => `useSchedule[dayIdRef] updated from [${oldVal?.value}] to [${newVal?.value}]`)
    }, {immediate: true})

    const firestoreDailyScheduleRef = deferredVuefireUseDocument([conferenceDescriptorRef, dayIdRef],
        ([conferenceDescriptor, dayId]) => dailyScheduleDocument(conferenceDescriptor, dayId));

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

export function dailyScheduleDocument(eventDescriptor: VoxxrinConferenceDescriptor|undefined, dayId: DayId|undefined) {
    if(!eventDescriptor || !eventDescriptor.id || !eventDescriptor.id.value || !dayId || !dayId.value) {
        return undefined;
    }

    return doc(collection(doc(collection(db, 'events'), eventDescriptor.id.value), 'days'), dayId.value) as DocumentReference<DailySchedule>;
}

async function loadTalkSpeakerUrls(talk: { speakers: Array<{ photoUrl?: VoxxrinTalk['speakers'][number]['photoUrl'] }> }) {
    return Promise.all(talk.speakers.map(async speaker => {
        return new Promise(resolve => {
            if (speaker.photoUrl) {
                const avatarImage = new Image();
                avatarImage.src = speaker.photoUrl;

                avatarImage.onload = resolve;
            } else {
                resolve(null);
            }
        })
    }));
}

export function prepareSchedules(
    user: User,
    conferenceDescriptor: VoxxrinConferenceDescriptor,
    currentDayId: DayId,
    currentTalks: Array<VoxxrinTalk>,
    otherDayIds: Array<DayId>
) {
    PERF_LOGGER.debug(() => `prepareSchedules(userId=${user.uid}, eventId=${conferenceDescriptor.id.value}, currentDayId=${currentDayId.value}, currentTalkIds=${JSON.stringify(currentTalks.map(talk => talk.id.value))}, otherDayIds=${JSON.stringify(otherDayIds.map(id => id.value))})`);

    [currentDayId, ...otherDayIds].reduce(async (previousDayPromise, dayId) => {
        await previousDayPromise;

        let talkIds: TalkId[]|undefined = undefined;
        if(dayId === currentDayId) {
            currentTalks.map(loadTalkSpeakerUrls)

            talkIds = currentTalks.map(talk => talk.id);
        } else {
            const dailyScheduleDoc = dailyScheduleDocument(conferenceDescriptor, dayId)

            if(navigator.onLine && dailyScheduleDoc) {
                const dailyScheduleSnapshot = await getDoc(dailyScheduleDoc);
                PERF_LOGGER.debug(`getDoc(${dailyScheduleDoc.path})`)

                talkIds = dailyScheduleSnapshot.data()?.timeSlots.reduce((talkIds, timeslot) => {
                    if (timeslot.type === 'talks') {
                        timeslot.talks.forEach(talk => {
                            loadTalkSpeakerUrls(talk);

                            talkIds.push(new TalkId(talk.id))
                        })
                    }

                    return talkIds;
                }, [] as Array<TalkId>) || [];
            }
        }

        if(navigator.onLine && talkIds) {
            const preparations: Array<Promise<any>> = [];
            if(dayId !== currentDayId) {
                preparations.push(prepareTalkStats(conferenceDescriptor.id, dayId, talkIds));
                preparations.push(prepareUserTalkNotes(user, conferenceDescriptor.id, dayId, talkIds));
            }

            preparations.push(prepareEventTalks(conferenceDescriptor, dayId, talkIds));

            await Promise.all(preparations);
        }
    }, Promise.resolve());
}

export type LabelledTimeslotWithFeedback = VoxxrinScheduleTimeSlot & {
    label: ReturnType<typeof getTimeslotLabel>,
    feedback: VoxxrinTimeslotFeedback
};

export function useLabelledTimeslotWithFeedbacks(
    dailyScheduleRef: Ref<VoxxrinDailySchedule|undefined>,
    dailyUserFeedbacksRef: Ref<UserDailyFeedbacks|undefined>,
    searchTermsRef: Ref<string|undefined>
) {
    const timeslotsRef = ref<LabelledTimeslotWithFeedback[]>([]);

    watch([dailyScheduleRef, searchTermsRef, dailyUserFeedbacksRef], ([dailySchedule, searchTerms, dailyUserFeedbacks]) => {
        if (dailySchedule) {
            timeslotsRef.value = dailySchedule.timeSlots.map((ts: VoxxrinScheduleTimeSlot): LabelledTimeslotWithFeedback => {
                const label = getTimeslotLabel(ts);
                if (ts.type === 'break') {
                    return {...ts, label, feedback: {status: 'missing'}};
                } else {
                    const feedback = findTimeslotFeedback(dailyUserFeedbacks, ts.id);
                    const filteredTalks = filterTalksMatching(ts.talks, searchTerms);
                    return {...ts, label, talks: filteredTalks, feedback};
                }
            }).filter(ts => ts.type === 'break' || (ts.type === 'talks' && ts.talks.length !== 0));
        }
    })

    return { timeslotsRef }
}
