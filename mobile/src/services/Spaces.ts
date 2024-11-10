import {getOptionalTransformedRouteParamsValue, getRouteParamsValue, managedRef as ref} from "@/views/vue-utils";
import {EventId, SpacedEventId, SpaceToken} from "@/models/VoxxrinEvent";
import {useRoute} from "vue-router";
import {Ref, toValue} from "vue";

export function useCurrentSpaceEventIdRef() {
  const route = useRoute();

  const spacedEventIdRef = ref({
    spaceToken: getOptionalTransformedRouteParamsValue(route, 'spaceId', val => new SpaceToken(val)),
    eventId: new EventId(getRouteParamsValue(route, 'eventId')),
  } satisfies SpacedEventId)

  return spacedEventIdRef;
}

export function getResolvedEventRootPathFromSpacedEventIdRef(spacedEventIdRef: Ref<SpacedEventId>) {
  const spacedEventId = spacedEventIdRef.value;
  return getResolvedEventRootPath(spacedEventId.eventId, spacedEventId.spaceToken)
}
export function getResolvedEventRootPath(eventId: EventId, maybeSpaceToken: SpaceToken|undefined) {
  return `${maybeSpaceToken ? `/spaces/${maybeSpaceToken.value}`:``}/events/${eventId.value}`
}

export function getLocalStorageKeyCompound(spacedEventIdRef: Ref<SpacedEventId>) {
  const spacedEventId = toValue(spacedEventIdRef)
  return `${spacedEventId.eventId.value}${spacedEventId.spaceToken ? `@${spacedEventId.spaceToken.value}`:``}`
}
