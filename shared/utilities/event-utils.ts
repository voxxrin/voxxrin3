

export function resolvedSpaceFirestorePath(maybeSpaceId: string|undefined, withEndingSlash: boolean, withStartingSlash: boolean) {
  return maybeSpaceId ? `${withStartingSlash ? '/':''}spaces/${maybeSpaceId}${withEndingSlash?'/':''}`:'';
}

export function resolvedEventsFirestorePath(maybeSpaceId: string|undefined) {
  return `${resolvedSpaceFirestorePath(maybeSpaceId, true, false)}events`
}

export function resolvedEventFirestorePath(eventId: string, maybeSpaceId: string|undefined) {
  return `${resolvedSpaceFirestorePath(maybeSpaceId, true, false)}events/${eventId}`
}

export function resolvedSpacedEventFieldName(eventId: string, maybeSpaceToken: string|undefined) {
  return `${maybeSpaceToken ? `${maybeSpaceToken}:`:``}${eventId}`
}

export function eventsFirestorePath<SPACE_ID extends string|undefined>(maybeSpaceId: SPACE_ID) {
  return `${maybeSpaceId ? `spaces/{spaceId}/`:''}events` as const
}

export function eventFirestorePath<SPACE_ID extends string|undefined>(maybeSpaceId: SPACE_ID) {
  return `${maybeSpaceId ? `spaces/{spaceId}/`:''}events/{eventId}` as const
}
