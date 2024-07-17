

export function resolvedEventFirestorePath(eventId: string, spaceId?: string) {
  return `${spaceId ? `spaces/${spaceId}/`:''}events/${eventId}`
}

export function eventsFirestorePath<SPACE_ID extends string|undefined>(spaceId?: SPACE_ID) {
  return `${spaceId ? `spaces/{spaceId}/`:''}events` as const
}

export function eventFirestorePath<SPACE_ID extends string|undefined>(spaceId?: SPACE_ID) {
  return `${spaceId ? `spaces/{spaceId}/`:''}events/{eventId}` as const
}
