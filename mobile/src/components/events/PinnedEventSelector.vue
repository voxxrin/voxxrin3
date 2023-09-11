<template>
  <div v-if="pinnedEvents.length > 0" class="pinnedEventsContainer">
    <ion-list class="pinnedEvents">
      <div v-if="pastEvents.length > 0 && ongoingAndFutureEvents.length > 0" class="pinnedEventsDivider">
        <span>events <strong>Ongoing</strong></span>
      </div>

      <pinned-event :pinned-event="pinnedEvent" @click="$emit('event-selected', pinnedEvent)"
                    v-for="(pinnedEvent, index) in pastEvents" :key="pinnedEvent.id.value"></pinned-event>

      <div v-if="pastEvents.length > 0 && ongoingAndFutureEvents.length > 0" class="pinnedEventsDivider">
        <span>events <strong>Future</strong></span>
      </div>

      <pinned-event :pinned-event="pinnedEvent" @click="$emit('event-selected', pinnedEvent)"
                    v-for="(pinnedEvent, index) in ongoingAndFutureEvents" :key="pinnedEvent.id.value"></pinned-event>
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
  padding: 0;
  background: transparent;
  contain: initial;
}

.pinnedEventsDivider {
  display: inline-flex;
  align-items: end;
  justify-content: space-between;
  column-gap: 8px;
  position: sticky;
  left: 0;
  top: 0;
  width: 40px;
  height: 296px;
  line-height: 0.9;
  background: linear-gradient(180deg, rgba(238,238,238,1) 46%, rgba(238,238,238,0) 100%);
  padding: 24px 8px 8px 12px;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  z-index: 4;
  transition: 140ms ease-in-out;
  backdrop-filter: blur(2px);

  &:after {
    position: absolute;
    top: 0;
    right: -1px;
    width: 1px;
    height: 100%;
    background: linear-gradient(180deg, var(--app-beige-line) 46%, rgba(0,0,0,0) 100%);
    content: '';
  }

  @media (prefers-color-scheme: dark) {
    background: linear-gradient(180deg, var(--app-primary) 46%, rgba(0,0,0,0) 100%);
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
