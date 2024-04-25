import * as functions from "firebase-functions";
import {extractMultiQueryParam, extractSingleQueryParam, sendResponseMessage} from "../../utils";
import {
    checkEventLastUpdate,
    getOrganizerSpaceByToken,
    ensureTalkFeedbackViewerTokenIsValidThenGetFeedbacks, getSecretTokenDoc
} from "../../../firestore/firestore-utils";
import {match, P} from "ts-pattern";
import {getEventDescriptor} from "../../../firestore/services/eventDescriptor-utils";
import {getFamilyOrganizerToken} from "../../../firestore/services/publicTokens-utils";
import {
    ConferenceOrganizerSpace
} from "../../../../../../../shared/conference-organizer-space.firestore";
import {EventLastUpdates} from "../../../../../../../shared/event-list.firestore";
import * as express from "express";

export async function legacyAttendeesFeedbacks(request: functions.https.Request, response: express.Response) {

    const organizerSecretToken = extractSingleQueryParam(request, 'organizerSecretToken');
    const talkIds = extractMultiQueryParam(request, 'talkIds');
    // deprecated
    const familyToken = extractSingleQueryParam(request, 'familyToken');
    const familyOrganizerSecretToken = extractSingleQueryParam(request, 'familyOrganizerSecretToken');
    const eventId = extractSingleQueryParam(request, 'eventId');
    let sinceTimestamp = Date.parse(extractSingleQueryParam(request, 'updatedSince') || "");

    // TODO: Remove me
    if(isNaN(sinceTimestamp)) {
        sinceTimestamp = Date.parse("1970-01-01T00:00:00Z")
    }

    if(!talkIds || !talkIds.length) { return sendResponseMessage(response, 400, `Missing [talkIds] (multi) query parameter !`) }
    if(!eventId) { return sendResponseMessage(response, 400, `Missing [eventId] query parameter !`) }
    if(!organizerSecretToken && !familyToken && !familyOrganizerSecretToken) { return sendResponseMessage(response, 400, `Missing either [organizerSecretToken] or [familyToken] or [familyOrganizerSecretToken] query parameter !`) }
    if(isNaN(sinceTimestamp)) { return sendResponseMessage(response, 400, `Missing valid [updatedSince] query parameter !`) }

    const eventDescriptor = await getEventDescriptor(eventId);
    if(familyOrganizerSecretToken) {
        const familyOrganizerToken = await getFamilyOrganizerToken(familyOrganizerSecretToken);

        if(!eventDescriptor.eventFamily || !familyOrganizerToken.eventFamilies.includes(eventDescriptor.eventFamily)) {
            return sendResponseMessage(response, 400, `Provided family organizer token doesn't match with event ${eventId} family: [${eventDescriptor.eventFamily}]`)
        }
    }

    const { cachedHash, updatesDetected } = await checkEventLastUpdate(eventId, [
        root => root.allFeedbacks,
        root => root.talkListUpdated,
        ...talkIds.map(talkId => {
            return (root: EventLastUpdates) => root.feedbacks?.[talkId]
        })
    ], request, response)
    // if(!updatesDetected) {
    //     return sendResponseMessage(response, 304)
    // }

    const updatedSince = new Date(sinceTimestamp);

    try {
        const organizerSpace = await match([organizerSecretToken, familyToken, familyOrganizerSecretToken])
            .with([ P.nullish, P.nullish, P.nullish ], async ([_1, _2]) => { throw new Error(`Unexpected state: (undefined,undefined)`); })
            .with([ P.not(P.nullish), P.any, P.any ], async ([organizerSecretToken, _]) => {
                return getOrganizerSpaceByToken(eventId, 'organizerSecretToken', organizerSecretToken);
            }).with([ P.any, P.not(P.nullish), P.any ], async ([_, familyToken]) => {
                return getOrganizerSpaceByToken(eventId, 'familyToken', familyToken);
            }).with([ P.any, P.any, P.not(P.nullish) ], async ([_1, _2, familyOrganizerSecretToken]) => {
                return getSecretTokenDoc<ConferenceOrganizerSpace>(`/events/${eventId}/organizer-space`);
            }).run()

        const perTalkFeedbacks = await Promise.all(organizerSpace.talkFeedbackViewerTokens
            .filter(talkFeedbacksViewerToken => talkIds.includes(talkFeedbacksViewerToken.talkId))
            .map(async (talkFeedbackViewerToken) => {

            const feedbacks = await ensureTalkFeedbackViewerTokenIsValidThenGetFeedbacks(talkFeedbackViewerToken.eventId, talkFeedbackViewerToken.talkId, talkFeedbackViewerToken.secretToken, updatedSince);

            // Enriching bingo entries with label
            const enrichedFeedbacks = feedbacks.map(feedback => ({
                ...feedback,
                ratings: {
                    ...feedback.ratings,
                    bingo: feedback.ratings.bingo.map(bingoId => {
                        const bingoEntry = eventDescriptor.features.ratings.bingo.choices.find(choice => choice.id === bingoId);
                        return bingoEntry || {id: bingoId, label: null};
                    })
                }
            }))

            return {
                eventId: talkFeedbackViewerToken.eventId,
                talkId: talkFeedbackViewerToken.talkId,
                feedbacks: enrichedFeedbacks
            };
        }))

        sendResponseMessage(response, 200, perTalkFeedbacks, cachedHash ? {
            // 'ETag': cachedHash
        }:{});
    } catch(error) {
        sendResponseMessage(response, 500, ""+error);
    }
}
