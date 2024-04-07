<template>
  <ion-segment :value="currentCategoryRef"
               class="tabsSelection _sticky"
               scrollable
               @ion-change="(event) => categoryUpdated(event.detail.value)">
    <ion-segment-button v-for="(categorizedEvents, index) in perCategoryEventsRef" :key="index"
                        :value="categorizedEvents.category">
      <ion-label>{{ categorizedEvents.label }} <span class="count">{{categorizedEvents.eventsCount}}</span></ion-label>
    </ion-segment-button>
  </ion-segment>

  <template v-if="currentCategoryEventsRef && currentCategoryEventsRef.eventsCount > 0">
    <ion-list class="availableEventsList">
      <template v-for="(categorySection, index) in currentCategoryEventsRef.sections" :key="currentCategoryEventsRef.category+index">
        <div class="eventsDivider" v-if="categorySection.events.length > 0 && !!categorySection.label">{{categorySection.label}}</div>
        <available-event-item :pinned-events="pinnedEvents" v-for="(event, index) in categorySection.events" :key="event.id.value"
                              :event="event"
                              @event-pin-toggled="(ev, transitionType) => $emit('event-pin-toggled', ev, transitionType)"
                              @event-clicked="$emit('event-clicked', $event)">
        </available-event-item>
      </template>
    </ion-list>
  </template>
  <div v-else>
    <slot name="no-event"></slot>
  </div>
</template>

<script setup lang="ts">
import {computed, PropType, unref, watch} from "vue";
import {managedRef as ref, toManagedRef as toRef} from "@/views/vue-utils";
import {EventId, ListableVoxxrinEvent} from "@/models/VoxxrinEvent";
import AvailableEventItem from "@/components/events/AvailableEventItem.vue";
import {conferenceStatusOf} from "@/models/VoxxrinConferenceDescriptor";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {IonSegment, IonSegmentButton} from "@ionic/vue";

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

const { LL } = typesafeI18n()

type CategoryEvents = {
  category: "future"|"past",
  label: string,
  eventsCount: number,
  sections: Array<{
    label?: string|undefined,
    events: Array<ListableVoxxrinEvent>
  }>
}

const currentCategoryRef = ref<"future"|"past">("future");
const eventsRef = toRef(props, 'events');

const perCategoryEventsRef = computed(() => {
  const events = unref(eventsRef);
  const pastEvents = events.filter(e => conferenceStatusOf(e.start, e.end, e.timezone) === 'past');
  const ongoingEvents = events.filter(e => conferenceStatusOf(e.start, e.end, e.timezone) === 'ongoing').reverse();
  const futureEvents = events.filter(e => conferenceStatusOf(e.start, e.end, e.timezone) === 'future').reverse();

  const categories: CategoryEvents[] = [{
    category: 'future',
    label: LL.value.Future_events(),
    eventsCount: ongoingEvents.length + futureEvents.length,
    sections: [{
      label: LL.value.ConfStatus_ongoing(),
      events: ongoingEvents
    }, {
      label: LL.value.ConfStatus_future(),
      events: futureEvents
    }]
  }, {
    category: 'past',
    label: LL.value.Past_events(),
    eventsCount: pastEvents.length,
    sections: [{
      events: pastEvents
    }]
  }]

  return categories;
})

const currentCategoryEventsRef = ref<CategoryEvents|undefined>(undefined)
function categoryUpdated(category: string|undefined) {
  if(!!category) {
    currentCategoryRef.value = category as "future"|"past";
  }
}

watch([currentCategoryRef, perCategoryEventsRef], ([currentCategory, perCategoryEvents]) => {
  currentCategoryEventsRef.value = perCategoryEvents.find(c => c.category === currentCategory)!;
})

</script>

<style lang="scss" scoped>
  .eventsDivider {
    position: sticky;
    top: 120px;
    background-color: var(--app-beige-medium);
    border-bottom: 1px solid  var(--app-beige-line);
    padding: var(--app-gutters-medium) var(--app-gutters);
    font-weight: 900;
    z-index: 5;

    @media (prefers-color-scheme: dark) {
      background-color: var(--app-primary);
    }
  }

  .tabsSelection {
    &._sticky {
      position: sticky;
      top: 68px;
      z-index: 4;
    }

    ion-label {
      display: flex;
      justify-content: space-between;
      width: 100%;
    }
  }
  ion-list {
    padding-top: 0;
    padding-bottom: 0;
  }
</style>
