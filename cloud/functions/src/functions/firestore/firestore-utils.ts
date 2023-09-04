import * as functions from "firebase-functions";
import {db} from "../../firebase";
import {ConferenceOrganizerSpace} from "../../../../../shared/conference-organizer-space.firestore";
import {TalkAttendeeFeedback} from "../../../../../shared/talk-feedbacks.firestore";
import {TalkStats} from "../../../../../shared/feedbacks.firestore";
import {EventLastUpdates, ListableEvent} from "../../../../../shared/event-list.firestore";
import {ISODatetime} from "../../../../../shared/type-utils";
import {sortBy} from "lodash";
import {firestore} from "firebase-admin";
import {DocumentReference} from "firebase-admin/firestore";

export type EventFamilyToken = {
    families: string[],
    token: string;
}

export type EventNotificationSubscriptions = {
    talkNotifications: {
        pushNotificationsTriggered: Array<{ on: ISODatetime, by: string, notifiedUserIds: string[] }>,
        userIdsForNextNotification: string[]
    }
}

export async function getSecretTokenRef(path: string) {
    const list = await db.collection(path).listDocuments()
    if(list.length !== 1) {
        throw new Error(`Unexpected size=${list.length} for path [${path}] (expected=1)`)
    }

    const secretTokenRef: DocumentReference = db.doc(`${path}/${list[0].id}`);
    return secretTokenRef;
}
export async function getSecretTokenDoc<T>(path: string) {
    return (await (await getSecretTokenRef(path)).get()).data() as T;
}

export async function getOrganizerSpaceByToken(
   eventId: string,
   tokenType: 'organizerSecretToken'|'familyToken',
   secretToken: string
) {
    const organizerSpace: ConferenceOrganizerSpace = await getSecretTokenDoc(`events/${eventId}/organizer-space`);

    if(tokenType === 'organizerSecretToken' && organizerSpace.organizerSecretToken !== secretToken) {
        throw new Error(`Invalid organizer token for eventId=${eventId}: ${secretToken}`);
    }

    if(tokenType === 'familyToken') {
        const familyTokenValid = await checkEventFamilyTokenIsValid(eventId, secretToken);
        if(!familyTokenValid) {
            throw new Error(`Invalid family token for eventId=${eventId}: ${secretToken}`);
        }
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

export async function eventLastUpdateRefreshed(eventId: string, fields: Array<keyof EventLastUpdates>) {
    if(!fields.length) {
        return;
    }

    const now = new Date().toISOString() as ISODatetime;
    const fieldUpdates: Partial<EventLastUpdates> = fields.reduce((fieldUpdates, field) => {
        fieldUpdates[field] = now;
        return fieldUpdates;
    }, {} as Partial<EventLastUpdates>)

    const existingLastUpdates = await db
        .collection("events").doc(eventId)
        .collection("last-updates").doc("self")
        .get();

    if(existingLastUpdates.exists) {
        existingLastUpdates.ref.update(fieldUpdates);
    } else {
        existingLastUpdates.ref.set(fieldUpdates);
    }
}

export async function checkEventLastUpdate(
    eventId: string, lastUpdateFieldNames: Array<keyof EventLastUpdates>,
    request: functions.https.Request, response: functions.Response
): Promise<{ cachedHash: string|undefined, updatesDetected: boolean }> {
    const eventLastUpdatesDoc = await db
        .collection("events").doc(eventId)
        .collection("last-updates").doc("self")
        .get();

    const cachedHash = sortBy(
        lastUpdateFieldNames.map(lastUpdateFieldName => (eventLastUpdatesDoc.data() as EventLastUpdates|undefined)?.[lastUpdateFieldName])
            .filter(v => !!v),
        isoDate => -Date.parse(isoDate!)
    )[0] || undefined;

    const ifNoneMatchHeader = request.header("If-None-Match")
    if(ifNoneMatchHeader) {
        if(eventLastUpdatesDoc.exists && cachedHash && cachedHash === ifNoneMatchHeader) {
            return { cachedHash, updatesDetected: false }
        }
    }

    return { cachedHash, updatesDetected: true };
}

export async function checkEventFamilyTokenIsValid(eventId: string, token: string) {
    const listableEvent = (await db.collection("events").doc(eventId).get())?.data() as ListableEvent|undefined;

    if(!listableEvent || !listableEvent.eventFamily) {
        return false;
    }

    const familyTokenSnapshots = await db.collection("event-family-tokens")
        .where('families', 'array-contains', listableEvent.eventFamily)
        .where("token", '==', token)
        .get()

    return !familyTokenSnapshots.empty;
}

export async function createEmptyEventNotificationSubscriptions(eventId: string) {
    const initialEventNotificationSubscriptions: EventNotificationSubscriptions = {
        talkNotifications: {
            pushNotificationsTriggered: [],
            userIdsForNextNotification: []
        }
    };

    const organizerSpaceRef = await getSecretTokenRef(`events/${eventId}/organizer-space`);
    await organizerSpaceRef
        .collection('event-notification-subscriptions').doc('self')
        .create(initialEventNotificationSubscriptions);
}
