
export type PublicToken = FamilyEventsStatsAccessToken
  | FamilyOrganizerToken
  | FamilyRoomStatsContributorToken
  | EventOrganizerToken

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

export type EventOrganizerToken = {
    type: "EventOrganizerToken",
    eventNames: string[]
}
