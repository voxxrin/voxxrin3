<template>
  <ion-page>
    <ion-content>
      <ion-header class="conferenceWelcome">
        <div class="conferenceWelcome-title">
          <span class="name">{{ LL.Hello_xxx({name:'World'}) }}</span>
          <span class="welcome">{{ LL.Welcome_to() }} <strong>{{ appTitle }}</strong></span>
        </div>
        <global-user-actions-button />
      </ion-header>

      <ion-header class="conferenceHeader stickyHeader" collapse="condense">
        <ion-input :placeholder="`${LL.Search_a_conference()}`"
                   aria-label="Custom input"
                   :debounce="300"
                   @ionInput="(ev) => searchTextUpdated(''+ev.target.value)"
                   class="searchInput">
          <ion-icon aria-hidden="true" src="/assets/icons/line/search-line.svg"></ion-icon>
        </ion-input>

      </ion-header>

      <div class="conferenceContent">
        <ion-item-divider class="no-border-top">{{ LL.Pinned_events() }}</ion-item-divider>
        <pinned-event-selector
            class="pinnedEventSelector"
            :pinned-events="filteredPinnedEvents" @event-selected="(event) => selectEvent(event.id)">
          <template #no-pinned-events>
            <no-results illu-path="images/svg/illu-list-pinned.svg">
              <template #title>{{ LL.No_pinned_events_available_yet() }}</template>
              <template #subTitle>{{ LL.Add_from_the_list_below() }}</template>
            </no-results>
          </template>
        </pinned-event-selector>

        <available-events-list
            :events="filteredAvailableEvents" @event-clicked="(event) => selectEvent(event.id)"
            :pinned-events="pinnedEventIdsRef" @event-pin-toggled="eventPinToggled">
          <template #no-event>
            <no-results illu-path="images/svg/illu-no-result.svg">
              <template #title>{{ LL.No_conference_registered_yet() }}</template>
            </no-results>
          </template>
        </available-events-list>
      </div>
      <PoweredVoxxrin></PoweredVoxxrin>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
    ActionSheetButton,
    IonInput,
    IonItemDivider,
    useIonRouter
} from '@ionic/vue';
import {EventFamily, EventId, ListableVoxxrinEvent, searchEvents} from "@/models/VoxxrinEvent";
import {computed, onMounted, Ref, watch} from "vue";
import AvailableEventsList from "@/components/events/AvailableEventsList.vue";
import {presentActionSheetController, managedRef as ref} from "@/views/vue-utils";
import {Browser} from "@capacitor/browser";
import {typesafeI18n} from "@/i18n/i18n-vue";
import PinnedEventSelector from "@/components/events/PinnedEventSelector.vue";
import {useAvailableEvents} from "@/state/useAvailableEvents";
import {useSharedUserPreferences} from "@/state/useUserPreferences";
import GlobalUserActionsButton from "@/components/user/GlobalUserActionsButton.vue";
import NoResults from "@/components/ui/NoResults.vue";
import PoweredVoxxrin from "@/components/ui/PoweredVoxxrin.vue";

const appTitle = import.meta.env.VITE_WHITE_LABEL_NAME;

const router = useIonRouter();
const { LL } = typesafeI18n()

const filteredEventFamilies = (import.meta.env.VITE_WHITE_LABEL_FILTERING_EVENT_FAMILIES||"")
    .split(",")
    .filter(family => !!family)
    .map(rawFamily => new EventFamily(rawFamily));
const { listableEvents: availableEventsRef } = useAvailableEvents(filteredEventFamilies);

const { userPreferences, pinEvent, unpinEvent } = useSharedUserPreferences();

const pinnedEventIdsRef = computed(() => {
    return userPreferences.value?.pinnedEventIds || [];
})

const searchTerms = ref<string|undefined>(undefined);

const filteredPinnedEvents: Ref<ListableVoxxrinEvent[]> = ref([]);
const filteredAvailableEvents: Ref<ListableVoxxrinEvent[]> = ref([]);
watch([availableEventsRef, searchTerms, pinnedEventIdsRef, userPreferences], ([availableEvents, searchTerms, pinnedEventIds, userPreferences]) => {
    if(availableEvents) {
        const {events, pinnedEvents} = searchEvents(availableEvents, {
            terms: searchTerms,
            includePastEvents: true
        }, pinnedEventIds)
        filteredAvailableEvents.value = events;
        filteredPinnedEvents.value = pinnedEvents;
    }
}, {immediate: true})

async function selectEvent(eventId: EventId) {
    router.push(`/events/${eventId.value}`);
}

function searchTextUpdated(searchText: string) {
    searchTerms.value = searchText;
}

async function showEventActions(event: ListableVoxxrinEvent) {
    const result = await presentActionSheetController({
        header: 'Actions',
        buttons: ([event.id.isIncludedIntoArray(pinnedEventIdsRef.value)?{
            text: LL.value.Remove_from_pinned_events(),
            data: {action: 'remove-from-pinned-events'},
        }:{
            text: LL.value.Add_to_my_pinned_events(),
            data: {action: 'add-to-pinned-events'},
        }] as ActionSheetButton[]).concat(event.websiteUrl?[{
            text: LL.value.Visit_website(),
            data: {action: 'visit-website'},
        }]:[]).concat([{
            text: LL.value.Cancel(), role: 'cancel',
            data: {action: 'cancel'},
        }])
    });

    // Not sure why, but ts-pattern's match() doesn't work here 🤔
    if(result?.action === 'visit-website') {
        Browser.open({url: event.websiteUrl})
    } else if(result?.action === 'add-to-pinned-events') {
        pinEvent(event.id);
    } else if(result?.action === 'remove-from-pinned-events') {
        unpinEvent(event.id);
    } else if(result?.action === 'cancel') {

    } else {
        // popup closed
    }
}

function eventPinToggled(event: ListableVoxxrinEvent, transitionType: 'unpinned-to-pinned'|'pinned-to-unpinned') {
    if(transitionType === 'unpinned-to-pinned') {
        pinEvent(event.id);
    } else {
        unpinEvent(event.id);
    }
}

onMounted(() => {
  setTimeout(() => {
    // Pre-loading all pages required for attendees in the background, once first rendering
    // of the app has been performed
    import('@/router/preloaded-pages');

    // Note: we're not preloading preloaded-admin-pages on purpose, waiting for a first access to
    // administration pages prior to loading these page in one batch of files
  }, 1000)
})
</script>

<style lang="scss" scoped>
  .conferenceWelcome {
    display: flex;
    flex-direction: row;
    align-items: end;
    justify-content: space-between;
    padding: 24px var( --app-gutters-medium) 0 var( --app-gutters-medium);
    background: var(--app-background);
    z-index: 9999;

    &:after {
      display: none;
    }

    &-title {
      display: flex;
      flex-direction: column;
      row-gap: 4px;

      .name {
        font-size: 14px;
        color: var(--app-beige-dark);
      }

      .welcome {
        font-size: 24px;
        font-weight: bold;

        strong {
          color: var(--app-voxxrin);
          font-weight: 900;
        }
      }
    }
  }

  .conferenceHeader {
    display: flex;
    flex-direction: row;
    column-gap: 12px;
    padding: 12px var( --app-gutters-medium);
    border-bottom: 1px solid var(--app-beige-line);
    background-color: var(--app-background);
    backdrop-filter: blur(2px);
    z-index: 999;
  }

  .conferenceContent {

    ion-item-divider {
      --padding-top: var( --app-gutters-medium);
      --padding-bottom: var( --app-gutters-medium);
      --color: var(--app-voxxrin);
      --background: var(--app-white);
      border-top: 1px solid var(--app-beige-line);
      border-bottom: 1px solid var(--app-beige-line);
      font-size: 18px;
      font-weight: bold;

      &.stickyDivider {
        top: 128px;
      }

      @media (prefers-color-scheme: dark) {
        --background: var(--app-dark-contrast);
        border-top: none;
        border-bottom: 1px solid var(--app-line-contrast);
      }
    }
  }
</style>
