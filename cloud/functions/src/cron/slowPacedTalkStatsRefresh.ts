import {Temporal} from "@js-temporal/polyfill";
import {getAllEvents, getEventLastUpdates} from "../functions/firestore/services/event-utils";
import {getGlobalInfos, storeGlobalInfos} from "../functions/firestore/services/globalInfos-utils";
import {ISODatetime} from "../../../../shared/type-utils";
import {getEventTalkStats, storeEventTalkStats} from "../functions/firestore/services/stats-utils";
import {match, P} from "ts-pattern";


export async function refreshSlowPacedTalkStatsForOngoingEvents() {
  const startedOn = Temporal.Now.plainDateTimeISO()
  const maybeGlobalInfos = (await getGlobalInfos()).data();

  const results = match(maybeGlobalInfos)
    .with(P.nullish, () => [])
    .otherwise(async (globalInfos) => {
      const events = (await getAllEvents())
        .flatMap(queryResults => queryResults.docs.map(doc => doc.data()));

      const results = await Promise.all(events.map(async event => {
        const eventLastUpdates = (await getEventLastUpdates(event.id)).data()
        if(!eventLastUpdates || !eventLastUpdates.favorites) {
          return undefined;
        }

        if(Date.parse(eventLastUpdates.favorites) < Date.parse(globalInfos.previousSlowPacedTalkStatsExecution)) {
          return undefined;
        }

        const standardTalkStats = (await getEventTalkStats(event.id, 'standard')).docs.map(doc => doc.data());
        const slowPacedTalkStats = (await getEventTalkStats(event.id, 'slowPaced')).docs.map(doc => doc.data());

        const talkStatsToUpdate = standardTalkStats.filter(stdTalkStat => {
          const slowPacedTalkStat = slowPacedTalkStats.find(spts => spts.id === stdTalkStat.id);
          return !slowPacedTalkStat || slowPacedTalkStat.totalFavoritesCount !== stdTalkStat.totalFavoritesCount;
        })

        if(!talkStatsToUpdate.length) {
          return undefined;
        }

        await storeEventTalkStats(event.id, talkStatsToUpdate, 'slowPaced');
        return { eventId: event.id, count: talkStatsToUpdate.length };
      }))

      return results
        .filter(r => !!r)
        .map(r => r!)
    })

  storeGlobalInfos({
    previousSlowPacedTalkStatsExecution: startedOn.toString() as ISODatetime
  })

  return results;
}
