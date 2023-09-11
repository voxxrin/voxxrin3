<template>
  <div v-if="pinnedEvents.length > 0" class="pinnedEventsContainer">
    <ion-list class="pinnedEvents">
      <!-- TODO Add class sticky-divider when element is sticky -->
      <div v-if="pastEvents.length > 0 && ongoingAndFutureEvents.length > 0" class="pinnedEventsDivider"
           :class="{ 'sticky-divider': isStickyFuture }">
        <span>events <strong>Future</strong></span>
        <ion-icon src="/assets/icons/line/arrow-left-line.svg"></ion-icon>
      </div>

      <pinned-event :pinned-event="pinnedEvent" @click="$emit('event-selected', pinnedEvent)"
                    v-for="(pinnedEvent, index) in ongoingAndFutureEvents" :key="pinnedEvent.id.value"></pinned-event>

      <!-- TODO Add class sticky-divider when element is sticky -->
      <div v-if="pastEvents.length > 0 && ongoingAndFutureEvents.length > 0" class="pinnedEventsDivider"
           :class="{ 'sticky-divider': isStickyOngoing }">
        <span>events <strong>Ongoing</strong></span>
        <ion-icon src="/assets/icons/line/arrow-left-line.svg"></ion-icon>
      </div>

      <pinned-event :pinned-event="pinnedEvent" @click="$emit('event-selected', pinnedEvent)"
                    v-for="(pinnedEvent, index) in pastEvents" :key="pinnedEvent.id.value"></pinned-event>
    </ion-list>
  </div>
  <div v-else>
    <slot name="no-pinned-events"></slot>
  </div>
</template>

<script setup lang="ts">
import { computed, PropType } from "vue";
import { ListableVoxxrinEvent } from "@/models/VoxxrinEvent";
import PinnedEvent from "@/components/events/PinnedEvent.vue";
import { conferenceStatusOf } from "@/models/VoxxrinConferenceDescriptor";

const props = defineProps({
  pinnedEvents: {
    required: true,
    type: Object as PropType<Array<ListableVoxxrinEvent>>,
  },
});

defineEmits<{
  (e: "event-selected", event: ListableVoxxrinEvent): void;
}>()

const pastEvents = computed(() =>
    props.pinnedEvents.filter(
        (e) => conferenceStatusOf(e.start, e.end, e.timezone) === "past"
    )
);
const ongoingAndFutureEvents = computed(() =>
    props.pinnedEvents
        .filter(
            (e) => conferenceStatusOf(e.start, e.end, e.timezone) !== "past"
        )
        .reverse()
);
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

.pinnedEventsDivider {
  display: inline-flex;
  justify-content: space-between;
  column-gap: 8px;
  position: sticky;
  left: 0;
  top: 0;
  width: 34px;
  height: 268px;
  margin: 16px 4px;
  line-height: 0.9;
  border-radius: 34px 0 16px 16px;
  background-color: var(--app-white);
  padding: 24px 8px 8px 8px;
  border: 1px solid var(--app-beige-line);
  writing-mode: vertical-rl;
  text-orientation: mixed;
  z-index: 4;
  transition: 140ms ease-in-out;

  ion-icon {
    color: var(--app-grey-medium);
  }

  &.sticky-divider {
    transition: 140ms ease-in-out;
    border-radius: 0 0 0 0;
    box-shadow: rgba(0, 0, 0, 0.15) 7px 0 7px;
  }

  &:first-child {
    margin-left: 0;
  }

  strong { color: var(--app-voxxrin)}
}

@keyframes scale-up-center {
  0% { transform: scale(0.5);}
  100% { transform: scale(1);}
}
</style>
