
export type PublicToken = FamilyEventsStatsAccessToken
  | FamilyOrganizerToken
  | FamilyRoomStatsContributorToken
  | EventStatsAccessToken
  | EventRoomStatsContributorToken
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

export type EventStatsAccessToken = {
    type: "EventStatsAccessToken",
    eventNames: string[]
}

export type EventRoomStatsContributorToken = {
    type: "EventRoomStatsContributorToken",
    eventNames: string[]
}

export type EventOrganizerToken = {
    type: "EventOrganizerToken",
    eventNames: string[]
}
