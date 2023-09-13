
export type PublicToken = FamilyEventsStatsAccessToken | FamilyOrganizerToken

export type FamilyEventsStatsAccessToken = {
    type: "FamilyEventsStatsAccess",
    eventFamilies: string[]
}

export type FamilyOrganizerToken = {
    type: "FamilyOrganizerToken",
    eventFamilies: string[]
}

