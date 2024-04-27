import * as functions from "firebase-functions";
import {db} from "../../firebase";
import {ConferenceOrganizerSpace} from "../../../../../shared/conference-organizer-space.firestore";
import {TalkAttendeeFeedback} from "../../../../../shared/talk-feedbacks.firestore";
import {EventLastUpdates, ListableEvent} from "../../../../../shared/event-list.firestore";
import {ISODatetime} from "../../../../../shared/type-utils";
import {sortBy} from "lodash";
import {firestore} from "firebase-admin";
import DocumentReference = firestore.DocumentReference;
import {logPerf} from "../http/utils";
import {TalkStats} from "../../../../../shared/event-stats";
import * as express from "express";

export type EventFamilyToken = {
    families: string[],
    token: string;
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

export async function ensureTalkFeedbackViewerTokenIsValidThenGetFeedbacks(eventId: string, talkId: string, talkViewerToken: string) {
    const feedbacksRefs = await db.collection(
        `events/${eventId}/talks/${talkId}/feedbacks-access/${talkViewerToken}/feedbacks`
    ).listDocuments()

    if(!feedbacksRefs) {
        return [];
    }

    // const feedbacksRefs = await talkFeedbacksViewerDoc.ref.collection('feedbacks').listDocuments()
    const feedbackSnapshots = await Promise.all(feedbacksRefs.map(ref => ref.get()))
    const feedbacks = feedbackSnapshots.map(snap => snap.data() as TalkAttendeeFeedback)

    return feedbacks;
}

export async function eventTalkStatsFor(eventId: string): Promise<TalkStats[]> {
    return logPerf(`eventTalkStatsFor(${eventId})`, async () => {
        const eventTalkStatsPerTalkId = (await db.doc(`events/${eventId}/talksStats-allInOne/self`).get()).data() as Record<string, Omit<TalkStats, 'id'>>;
        return Object.entries(eventTalkStatsPerTalkId).map(([id, talkStats]) => ({
          id,
          ...talkStats
        }))
    })
}

export async function eventLastUpdateRefreshed<T extends {[field in keyof T]: ISODatetime|null}>(
    eventId: string, fields: Array<keyof T>,
    parentNodeToUpdate: (root: Partial<EventLastUpdates>) => ({ pathPrefix: string, parentNode: T }) = (root: Partial<EventLastUpdates>) => ({ pathPrefix: "", parentNode: root as T})
) {
    if(!fields.length) {
        return;
    }

    const now = new Date().toISOString() as ISODatetime;
    const rootObj = {} as Partial<EventLastUpdates>;
    const {pathPrefix, parentNode} = parentNodeToUpdate(rootObj);
    const fieldUpdates = fields.reduce((fieldUpdates, field) => {
        (parentNode[field] as unknown) = now;
        fieldUpdates.push({ path: `${pathPrefix}${String(field)}`, value: now })
        return fieldUpdates;
    }, [] as Array<{ path: string, value: ISODatetime }>)

    const existingLastUpdates = await db
        .collection("events").doc(eventId)
        .collection("last-updates").doc("self")
        .get();

    if(existingLastUpdates.exists) {
        fieldUpdates.forEach(fieldUpdate => {
            existingLastUpdates.ref.update(fieldUpdate.path, fieldUpdate.value);
        })
    } else {
        existingLastUpdates.ref.set(parentNode);
    }
}

export async function checkEventLastUpdate(
    eventId: string, lastUpdateFieldExtractors: Array<(root: EventLastUpdates) => ISODatetime|undefined|null>,
    request: express.Request, response: functions.Response
): Promise<{ cachedHash: string|undefined, updatesDetected: boolean }> {
    const eventLastUpdatesDoc = await db
        .collection("events").doc(eventId)
        .collection("last-updates").doc("self")
        .get();

    const eventLastUpdates = eventLastUpdatesDoc.data() as EventLastUpdates|undefined
    const cachedHash = sortBy(
        lastUpdateFieldExtractors.map(lastUpdateFieldExtractor => eventLastUpdates?lastUpdateFieldExtractor(eventLastUpdates):undefined)
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
