
export type PublicToken = FamilyEventsStatsAccessToken | FamilyOrganizerToken | FamilyRoomStatsContributorToken

export type FamilyEventsStatsAccessToken = {
    type: "FamilyEventsStatsAccess",
    eventFamilies: string[]
}

export type FamilyOrganizerToken = {
    type: "FamilyOrganizerToken",
    eventFamilies: string[]
}

export type FamilyRoomStatsContributorToken = {
    type: "FamilyRoomStatsContributorToken",
    eventFamilies: string[]
}
