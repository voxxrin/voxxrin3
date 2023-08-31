<template>
  <div v-if="events.length>0">
    <ion-list>
      <available-event-item :pinned-events="pinnedEvents" v-for="(event, index) in ongoingAndFutureEvents" :key="event.id.value"
              :event="event"
              @event-pin-toggled="(ev, transitionType) => $emit('event-pin-toggled', ev, transitionType)"
              @event-clicked="$emit('event-clicked', $event)">
      </available-event-item>
      <div v-if="pastEvents.length>0" style="height: 2px; background-color: var(--app-voxxrin)"></div>
      <available-event-item :pinned-events="pinnedEvents" v-for="(event, index) in pastEvents" :key="event.id.value"
              :event="event"
              @event-pin-toggled="(ev, transitionType) => $emit('event-pin-toggled', ev, transitionType)"
              @event-clicked="$emit('event-clicked', $event)">
      </available-event-item>
    </ion-list>
  </div>
  <div v-else>
    <slot name="no-event"></slot>
  </div>
</template>

<script setup lang="ts">
import {computed, PropType} from "vue";
import {EventId, ListableVoxxrinEvent} from "@/models/VoxxrinEvent";
import AvailableEventItem from "@/components/events/AvailableEventItem.vue";
import {conferenceStatusOf} from "@/models/VoxxrinConferenceDescriptor";

const props = defineProps({
    events: {
        required: true,
        type: Object as PropType<Array<ListableVoxxrinEvent>>
    },
    pinnedEvents: {
        required: true,
        type: Object as PropType<Array<EventId>>
    },
})

defineEmits<{
    (e: 'event-clicked', event: ListableVoxxrinEvent): void,
    (e: 'event-pin-toggled', event: ListableVoxxrinEvent, transitionType: 'unpinned-to-pinned'|'pinned-to-unpinned'): void,
}>()

const pastEvents = computed(() => props.events
    .filter(e => conferenceStatusOf(e.start, e.end, e.timezone) === 'past')
)
const ongoingAndFutureEvents = computed(() => props.events
    .filter(e => conferenceStatusOf(e.start, e.end, e.timezone) !== 'past')
    .reverse()
)

</script>

<style lang="scss" scoped>

</style>
