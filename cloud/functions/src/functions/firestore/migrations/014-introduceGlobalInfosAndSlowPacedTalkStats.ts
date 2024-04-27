import {getGlobalInfos, storeGlobalInfos} from "../services/globalInfos-utils";
import {refreshSlowPacedTalkStatsForOngoingEvents} from "../../../cron/slowPacedTalkStatsRefresh";


export async function introduceGlobalInfosAndSlowPacedTalkStats(): Promise<"OK"|"Error"> {
  const globalInfosDoc = await getGlobalInfos()

  if(!globalInfosDoc.exists) {
    await storeGlobalInfos({
      previousSlowPacedTalkStatsExecution: '1970-01-01T00:00:00Z'
    })
  }

  await refreshSlowPacedTalkStatsForOngoingEvents();

  return "OK"
}
