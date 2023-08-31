<template>
  <div v-if="pinnedEvents.length>0" class="pinnedEventsContainer">
    <ion-list class="pinnedEvents">
      <pinned-event :pinned-event="pinnedEvent" @click="$emit('event-selected', pinnedEvent)"
                    v-for="(pinnedEvent, index) in pinnedEvents" :key="pinnedEvent.id.value"></pinned-event>

    </ion-list>
  </div>
  <div v-else>
    <slot name="no-pinned-events"></slot>
  </div>
</template>

<script setup lang="ts">
import {PropType} from "vue";
import {ListableVoxxrinEvent} from "@/models/VoxxrinEvent";
import PinnedEvent from "@/components/events/PinnedEvent.vue";

const props = defineProps({
    pinnedEvents: {
        required: true,
        type: Object as PropType<Array<ListableVoxxrinEvent>>
    }
})

defineEmits<{
    (e: 'event-selected', event: ListableVoxxrinEvent): void
}>()

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
