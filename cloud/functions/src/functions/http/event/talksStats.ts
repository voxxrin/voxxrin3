import {logPerf, sendResponseMessage} from "../utils";
import {checkEventLastUpdate, eventTalkStatsFor} from "../../firestore/firestore-utils";
import {Request, Response} from "express";
import {ConferenceDescriptor} from "../../../../../../shared/conference-descriptor.firestore";
import {getTimeslottedTalks} from "../../firestore/services/schedule-utils";

export async function eventTalksStats(response: Response, pathParams: {eventId: string}, queryParams: {token: string }, request: Request, eventDescriptor: ConferenceDescriptor) {

    const eventId = pathParams.eventId;
    const { cachedHash, updatesDetected } = await logPerf("cached hash", async () => {
        return await checkEventLastUpdate(eventId, [
            root => root.favorites,
            root => root.talkListUpdated
        ], request, response)
    });

    if(!updatesDetected) {
        return sendResponseMessage(response, 304)
    }

    try {
        const [talkStats, timeslottedTalks] = await logPerf("eventTalkStats + getTimeslottedTalks", () => {
            return Promise.all([
                eventTalkStatsFor(eventId),
                getTimeslottedTalks(eventId),
            ]);
        })

        const {perTalkStats} = await logPerf("Post processing", async () => {
            const perTalkStats = timeslottedTalks.filter(tt => !tt.isOverflow).map(talk => ({
                talkId: talk.id,
                talkTitle: talk.title,
                speakers: talk.speakers.map(sp => sp.fullName),
                totalFavoritesCount: talkStats.find(ts => ts.id === talk.id)?.totalFavoritesCount || 0
            }))

            return { perTalkStats }
        })

        sendResponseMessage(response, 200, {
            perTalkStats,
        }, cachedHash?{
            'ETag': cachedHash
        }:{});
    } catch(error) {
        sendResponseMessage(response, 500, ""+error)
    }
}
