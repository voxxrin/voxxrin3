
export type PublicToken = FamilyEventsStatsAccessToken

export type FamilyEventsStatsAccessToken = {
    type: "FamilyEventsStatsAccess",
    eventFamilies: string[]
}
