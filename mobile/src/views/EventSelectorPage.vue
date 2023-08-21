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

        <ion-toggle :enable-on-off-labels="true"
                    labelPlacement="end"
                    @ionChange="(ev) => includePastEventUpdated(ev.target.checked)"
                    :checked="userPreferences?.showPastEvents"
                   class="conferenceToggle">
          <span class="conferenceToggle-label">{{ LL.Past_events() }}</span>
        </ion-toggle>
      </ion-header>

      <div class="conferenceContent">
        <ion-item-divider class="no-border-top">{{ LL.Pinned_events() }}</ion-item-divider>
        <pinned-event-selector
            class="pinnedEventSelector"
            :pinned-events="filteredPinnedEvents" @event-selected="(event) => selectEvent(event.id)">
          <template #no-pinned-events>
            <div class="infoMessage ion-text-center">
              <ion-icon class="infoMessage-iconIllu" src="/assets/images/svg/illu-list-pinned.svg"></ion-icon>
              <span class="infoMessage-title">{{ LL.No_pinned_events_available_yet() }}</span>
              <span class="infoMessage-subTitle">{{ LL.Add_from_the_list_below() }}</span>
            </div>
          </template>
        </pinned-event-selector>

        <ion-item-divider class="stickyDivider" sticky>All conferences</ion-item-divider>
        <available-events-list
            class="availableEventsList"
            :events="filteredAvailableEvents" @event-clicked="(event) => showEventActions(event)"
            :pinned-events="pinnedEventIdsRef" @event-pin-toggled="eventPinToggled">
          <template #no-event>
            <div class="infoMessage ion-text-center">
              <ion-icon class="infoMessage-iconIllu" src="/assets/images/svg/illu-no-result.svg"></ion-icon>
              <span class="infoMessage-title">{{ LL.No_conference_registered_yet() }}</span>
            </div>
          </template>
        </available-events-list>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
    IonToggle,
    IonInput,
    IonItemDivider,
    useIonRouter
} from '@ionic/vue';
import {EventId, ListableVoxxrinEvent, searchEvents} from "@/models/VoxxrinEvent";
import {computed, ref, Ref, watch} from "vue";
import AvailableEventsList from "@/components/events/AvailableEventsList.vue";
import {presentActionSheetController} from "@/views/vue-utils";
import {Browser} from "@capacitor/browser";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {
    ActionSheetButton
} from "@ionic/core/dist/types/components/action-sheet/action-sheet-interface";
import PinnedEventSelector from "@/components/events/PinnedEventSelector.vue";
import {useAvailableEvents} from "@/state/useAvailableEvents";
import {useSharedUserPreferences} from "@/state/useUserPreferences";
import GlobalUserActionsButton from "@/components/user/GlobalUserActionsButton.vue";

const appTitle = import.meta.env.VITE_WHITE_LABEL_NAME;

const router = useIonRouter();
const { LL } = typesafeI18n()

const { listableEvents: availableEventsRef } = useAvailableEvents();

const { userPreferences, pinEvent, unpinEvent, togglePastEvent } = useSharedUserPreferences();

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
            includePastEvents: !!userPreferences?.showPastEvents
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

function includePastEventUpdated(includePastEvents: boolean) {
    togglePastEvent(includePastEvents);
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

    .conferenceToggle {
      display: flex;
      --track-background-checked: var(--app-voxxrin);

      @media (prefers-color-scheme: dark) {
        --handle-background-checked: var(--app-light-contrast);
      }

      &-label {
        font-weight: bold;
        font-size: 13px;
        width: 54px;
        display: flex;
        white-space: break-spaces;
        color: var(--app-primary-shade);
        line-height: 1;

        @media (prefers-color-scheme: dark) {
          color: var(--app-white);
        }
      }
    }
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
        top: 68px;
      }

      @media (prefers-color-scheme: dark) {
        --background: var(--app-dark-contrast);
        border-top: none;
        border-bottom: 1px solid var(--app-line-contrast);
      }
    }
  }
</style>
