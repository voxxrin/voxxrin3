<template>
  <div v-if="pinnedEvents.length>0" class="pinnedEventsContainer">
    <ion-list class="pinnedEvents">
      <pinned-event :pinned-event="pinnedEvent" @click="$emit('event-selected', pinnedEvent)"
                    v-for="(pinnedEvent, index) in ongoingAndFutureEvents" :key="pinnedEvent.id.value"></pinned-event>

      <div v-if="pastEvents.length>0 && ongoingAndFutureEvents.length>0" style="width: 2px; background-color: var(--app-voxxrin);"></div>

      <pinned-event :pinned-event="pinnedEvent" @click="$emit('event-selected', pinnedEvent)"
                    v-for="(pinnedEvent, index) in pastEvents" :key="pinnedEvent.id.value"></pinned-event>
    </ion-list>
  </div>
  <div v-else>
    <slot name="no-pinned-events"></slot>
  </div>
</template>

<script setup lang="ts">
import {computed, PropType} from "vue";
import {ListableVoxxrinEvent} from "@/models/VoxxrinEvent";
import PinnedEvent from "@/components/events/PinnedEvent.vue";
import {conferenceStatusOf} from "@/models/VoxxrinConferenceDescriptor";

const props = defineProps({
    pinnedEvents: {
        required: true,
        type: Object as PropType<Array<ListableVoxxrinEvent>>
    }
})

defineEmits<{
    (e: 'event-selected', event: ListableVoxxrinEvent): void
}>()

const pastEvents = computed(() => props.pinnedEvents
    .filter(e => conferenceStatusOf(e.start, e.end, e.timezone) === 'past')
)
const ongoingAndFutureEvents = computed(() => props.pinnedEvents
    .filter(e => conferenceStatusOf(e.start, e.end, e.timezone) !== 'past')
    .reverse()
)

</script>

<style lang="scss" scoped>

.pinnedEventsContainer {
  overflow-y: auto;
}

.pinnedEvents {
  display: inline-flex;
  flex-direction: row;
  column-gap: var(--app-gutters);
  padding: 0 var(--app-gutters);
  background: transparent;
  contain: initial;
}

@keyframes scale-up-center {
  0% { transform: scale(0.5);}
  100% { transform: scale(1);}
}
</style>
