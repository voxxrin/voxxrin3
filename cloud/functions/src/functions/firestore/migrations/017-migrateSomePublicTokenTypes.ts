import {db} from "../../../firebase";


export async function migrateFamilyEventsStatsAccessTokenTypes(): Promise<"OK"|"Error"> {
  const legacyFamilyEventsStatsAccessTokens = (
    await db.collection("public-tokens")
      .where("type", "==", "FamilyEventsStatsAccess")
      .get()
  ).docs

  await Promise.all(legacyFamilyEventsStatsAccessTokens.map(async legacyFamilyEventsStatsAccessToken => {
    return legacyFamilyEventsStatsAccessToken.ref.update({
      // renaming type=FamilyEventsStatsAccess to type=FamilyEventsStatsAccessToken
      type: "FamilyEventsStatsAccessToken"
    })
  }))

  return "OK"
}
