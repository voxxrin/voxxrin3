import {db} from "../../firebase";
import {ConferenceOrganizerSpace} from "../../../../../shared/conference-organizer-space.firestore";
import {TalkAttendeeFeedback} from "../../../../../shared/talk-feedbacks.firestore";
import {TalkStats} from "../../../../../shared/feedbacks.firestore";

export async function getSecretTokenDoc<T>(path: string) {
    const list = await db.collection(path).listDocuments()
    if(list.length !== 1) {
        throw new Error(`Unexpected size=${list.length} for path [${path}] (expected=1)`)
    }

    return (await db.doc(`${path}/${list[0].id}`).get()).data() as T;
}

export async function ensureOrganizerTokenIsValid(eventId: string, organizerToken: string) {
    const organizerSpace: ConferenceOrganizerSpace = await getSecretTokenDoc(`events/${eventId}/organizer-space`);

    if(organizerSpace.organizerSecretToken !== organizerToken) {
        throw new Error(`Invalid organizer token for eventId=${eventId}: ${organizerToken}`);
    }

    return organizerSpace;
}

export async function ensureTalkFeedbackViewerTokenIsValidThenGetFeedbacks(eventId: string, talkId: string, talkViewerToken: string, updatedSince: Date) {
    const feedbacksRefs = await db.collection(
        `events/${eventId}/talks/${talkId}/feedbacks-access/${talkViewerToken}/feedbacks`
    ).listDocuments()

    if(!feedbacksRefs) {
        return [];
    }

    // const feedbacksRefs = await talkFeedbacksViewerDoc.ref.collection('feedbacks').listDocuments()
    const feedbackSnapshots = await Promise.all(feedbacksRefs.map(ref => ref.get()))
    const feedbacks = feedbackSnapshots.map(snap => snap.data() as TalkAttendeeFeedback)

    return feedbacks.filter(feedback => Date.parse(feedback.lastUpdatedOn) > updatedSince.getTime());
}

export async function eventTalkStatsFor(eventId: string) {
    const eventTalkStatsDocs = await db.collection(`events/${eventId}/talksStats`).listDocuments();

    const talkStatsSnapshot = await Promise.all(eventTalkStatsDocs.map(ref => ref.get()))
    const talkStats = talkStatsSnapshot.map(snap => snap.data() as TalkStats);

    return talkStats;
}
