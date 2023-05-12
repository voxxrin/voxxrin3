<template>
  <ion-page>
    <ion-content>
      <ion-header class="conferenceWelcome">
        <div class="conferenceWelcome-title">
          <span class="name">{{ LL.Hello_xxx({name:'World'}) }}</span>
          <span class="welcome">{{ LL.Welcome_to() }} <strong>Voxxrin</strong></span>
        </div>
        <ion-button class="btnUser" shape="round" size="large">
          <ion-icon src="/assets/icons/line/user-line.svg"></ion-icon>
          <ion-ripple-effect type="unbounded"></ion-ripple-effect>
        </ion-button>
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
                    :checked="searchCriteriaRef.includePastEvents"
                   class="conferenceToggle">
          <span class="conferenceToggle-label">{{ LL.Past_events() }}</span>
        </ion-toggle>
      </ion-header>

      <div class="conferenceContent">
        <ion-item-divider>{{ LL.Favorited_conferences() }}</ion-item-divider>
        <favorited-event-selector
            class="favoritedEventSelector"
            :favoritedEvents="filteredFavoritedEvents" @event-selected="(event) => selectEvent(event.id)">
          <template #no-favorites>
            <div class="infoMessage ion-text-center">
              <img class="infoMessage-illustration" src="/assets/images/svg/illu-list-favorite.svg">
              <span class="infoMessage-title">{{ LL.No_favorites_available_yet() }}</span>
              <span class="infoMessage-subTitle">Add from the list below</span>
            </div>
          </template>
        </favorited-event-selector>

        <ion-item-divider class="stickyDivider" sticky>All conferences</ion-item-divider>
        <available-events-list
            class="availableEventsList"
            :events="filteredAvailableEvents" @event-clicked="(event) => showEventActions(event)">
          <template #no-event>
            <div class="infoMessage ion-text-center">
              <ion-icon class="infoMessage-icon" aria-hidden="true" src="/assets/icons/solid/checkbox-list-detail.svg"></ion-icon>
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
import {fetchConferenceDescriptor} from "@/state/CurrentConferenceDescriptor";
import {fetchAvailableEvents, watchCurrentAvailableEvents} from "@/state/CurrentAvailableEvents";
import {ref, Ref, watch} from "vue";
import FavoritedEventSelector from "@/components/FavoritedEventSelector.vue";
import AvailableEventsList from "@/components/AvailableEventsList.vue";
import {presentActionSheetController} from "@/views/vue-utils";
import {Browser} from "@capacitor/browser";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {
    ActionSheetButton
} from "@ionic/core/dist/types/components/action-sheet/action-sheet-interface";

const router = useIonRouter();
const { LL } = typesafeI18n()

const availableEventsRef: Ref<ListableVoxxrinEvent[]> = ref([]);
watchCurrentAvailableEvents(updatedAvailableEvents => {
    availableEventsRef.value = updatedAvailableEvents;
})
fetchAvailableEvents();

const favoritedTalksRef = ref<EventId[]>([]);

const searchCriteriaRef = ref<{ terms: string|undefined, includePastEvents: boolean}>({ terms: undefined, includePastEvents: false });

const filteredFavoritedEvents: Ref<ListableVoxxrinEvent[]> = ref([]);
const filteredAvailableEvents: Ref<ListableVoxxrinEvent[]> = ref([]);
watch([availableEventsRef, searchCriteriaRef, favoritedTalksRef], ([availableEvents, searchCriteria, favoritedTalks]) => {
    const {events, favorites} = searchEvents(availableEvents, searchCriteria, favoritedTalks)
    filteredAvailableEvents.value = events;
    filteredFavoritedEvents.value = favorites;
}, {immediate: true})

async function selectEvent(eventId: EventId) {
    await fetchConferenceDescriptor(eventId);

    router.push(`/events/${eventId.value}`);
}

function searchTextUpdated(searchText: string) {
    searchCriteriaRef.value = {...searchCriteriaRef.value, terms: searchText}
}

function includePastEventUpdated(includePastEvents: boolean) {
    searchCriteriaRef.value = {...searchCriteriaRef.value, includePastEvents }
}

async function showEventActions(event: ListableVoxxrinEvent) {
    const result = await presentActionSheetController({
        header: 'Actions',
        buttons: ([favoritedTalksRef.value.includes(event.id)?{
            text: LL.value.Remove_from_favorites(),
            data: {action: 'remove-from-favs'},
        }:{
            text: LL.value.Add_to_my_favorites(),
            data: {action: 'add-to-favs'},
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
    } else if(result?.action === 'add-to-favs') {
        favoritedTalksRef.value = [...favoritedTalksRef.value, event.id];
    } else if(result?.action === 'remove-from-favs') {
        favoritedTalksRef.value = favoritedTalksRef.value.filter(ev => !ev.isSameThan(event.id));
    } else if(result?.action === 'cancel') {

    } else {
        // popup closed
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
        }
      }
    }

    .btnUser {
      height: 58px;
      width: 58px;
      border: 1px solid var(--app-beige-line);
      --padding-end: 0;
      --padding-start: 0;
      --background: var(--app-beige-medium);
      --color: var(--app-beige-dark);
      --background-activated-opacity: 0.2;
      --background-focused-opacity: 0.2;
      --background-hover-opacity: 0.2;
      border-radius: 58px;

      @media (prefers-color-scheme: dark) {
        --background: var(--app-dark-contrast);
        --color: var(--app-white);
        border: none;
      }
    }
  }

  .conferenceHeader {
    display: flex;
    flex-direction: row;
    column-gap: 12px;
    padding: 12px var( --app-gutters-medium);
    background-color: var(--app-background);
    backdrop-filter: blur(2px);
    border-bottom: none;
    z-index: 1;

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
