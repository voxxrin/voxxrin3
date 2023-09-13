
export type PublicToken = FamilyEventsStatsAccessToken | FamilyEventsFeedbacksAccessToken

export type FamilyEventsStatsAccessToken = {
    type: "FamilyEventsStatsAccess",
    eventFamilies: string[]
}

export type FamilyEventsFeedbacksAccessToken = {
    type: "FamilyEventsFeedbacksAccess",
    eventFamilies: string[]
}

