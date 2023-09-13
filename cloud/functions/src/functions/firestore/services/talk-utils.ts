import {db} from "../../../firebase";
import {ConferenceDescriptor} from "../../../../../../shared/conference-descriptor.firestore";
import {DetailedTalk} from "../../../../../../shared/daily-schedule.firestore";
import {getSecretTokenRef} from "../firestore-utils";
import {
    ConferenceOrganizerAllRatings
} from "../../../../../../shared/conference-organizer-space.firestore";


export async function getTalkDetails(eventId: string) {
    const talkRefs = await db
        .collection("events").doc(eventId)
        .collection("talks")
        .listDocuments();

    const talks  = await Promise.all(talkRefs.map(async talkRef => (await talkRef.get()).data() as DetailedTalk))

    return talks;
}

class ConfOrganizerAllRatingsModel {
    constructor(private allRatings: ConferenceOrganizerAllRatings) {}

    ratingsForTalk(talkId: string) {
        return this.allRatings[talkId]?Object.values(this.allRatings[talkId]):[];
    }

    userRating(talkId: string, publicUserId: string) {
        return this.allRatings[talkId] ? this.allRatings[talkId][publicUserId] : undefined;
    }
}

export async function getEveryRatingsForEvent(eventId: string) {
    const organizerSpaceRef = await getSecretTokenRef(`/events/${eventId}/organizer-space`)
    const eventAllRatings = (await organizerSpaceRef.collection('ratings').doc('self').get()).data() as ConferenceOrganizerAllRatings

    return new ConfOrganizerAllRatingsModel(eventAllRatings);
}

export async function getTalksDetailsWithRatings(eventId: string) {
    const talks = await getTalkDetails(eventId);
    const everyRatings = await getEveryRatingsForEvent(eventId);
    return talks.map(talk => ({
        talk,
        ratings: everyRatings.ratingsForTalk(talk.id)
    }))
}
