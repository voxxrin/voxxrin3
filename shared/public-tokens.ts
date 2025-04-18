
export type PublicToken =
  | FamilyEventsStatsAccessToken
  | FamilyOrganizerToken
  | FamilyRoomStatsContributorToken
  | EventStatsAccessToken
  | EventRoomStatsContributorToken
  | EventOrganizerToken
  | PrivateSpaceAccessToken

export type FamilyEventsStatsAccessToken = {
    type: "FamilyEventsStatsAccessToken",
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

export type PrivateSpaceAccessToken = {
    type: "PrivateSpaceAccessToken",
    spaceTokens: string[],
}
