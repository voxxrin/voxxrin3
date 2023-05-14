<template>
  <div v-if="events.length>0">
    <ion-list>
      <available-event-item :pinned-events="pinnedEvents" v-for="(event, index) in events" :key="index"
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
import {PropType} from "vue";
import {EventId, ListableVoxxrinEvent} from "@/models/VoxxrinEvent";
import AvailableEventItem from "@/components/AvailableEventItem.vue";

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

</script>

<style lang="scss" scoped>

</style>
