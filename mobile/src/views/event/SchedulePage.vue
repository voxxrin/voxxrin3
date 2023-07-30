<template>
  <ion-page>
    <ion-content :fullscreen="true" v-if="event">
      <current-event-header :event="event"/>
      <ion-header class="toolbarHeader">
        <ion-toolbar>
          <ion-title slot="start">{{ LL.Schedule() }}</ion-title>
          <div v-if="searchFieldDisplayed" class="search-input">
            <ion-input :size="10" ref="$searchInput"
                       :debounce="300"
                       :placeholder="`${LL.Search()}...`"
                       @ionInput="(ev) => searchTermsRef = ''+ev.target.value"
            />
            <ion-icon class="iconInput" src="/assets/icons/line/search-line.svg"></ion-icon>
            <ion-button shape="round" size="small" fill="outline" @click="toggleSearchField()">
              <ion-icon src="/assets/icons/line/close-line.svg"></ion-icon>
            </ion-button>
          </div>

          <ion-button class="ion-margin-end" slot="end" shape="round" size="small" fill="outline" @click="openSchedulePreferencesModal()" v-if="false">
            <ion-icon src="/assets/icons/solid/settings-cog.svg"></ion-icon>
          </ion-button>
          <ion-button slot="end" shape="round" size="small" @click="toggleSearchField()">
            <ion-icon src="/assets/icons/line/search-line.svg"></ion-icon>
          </ion-button>
        </ion-toolbar>
      </ion-header>

      <ion-header class="stickyHeader">
        <day-selector
            :selected-day-id="currentlySelectedDayId"
            :days="event?.days || []"
            @day-selected="(day) => changeDayTo(day)">
        </day-selector>
      </ion-header>

      <ion-accordion-group :multiple="true" v-if="event && currentlySelectedDayId" :value="expandedTimeslotIds">
        <timeslots-iterator :conf-descriptor="event" :day-id="currentlySelectedDayId"
            :daily-schedule="currentSchedule" :search-terms="searchTermsRef"
            @missing-feedback-past-timeslots-updated="updatedMissingTimeslots => missingFeedbacksPastTimeslots = updatedMissingTimeslots">
          <template #iterator="{ timeslot }">
            <time-slot-accordion
                :timeslot-feedback="timeslot.feedback" :timeslot="timeslot" :event="event"
                @add-timeslot-feedback-clicked="(ts) => navigateToTimeslotFeedbackCreation(ts)"
                @click="() => toggleExpandedTimeslot(timeslot)">
              <template #accordion-content="{ timeslot }">
                <schedule-break v-if="timeslot.type==='break'" :event="event" :talk-break="timeslot.break"></schedule-break>
                <talk-format-groups-breakdown  :event="event" v-if="timeslot.type==='talks'" :talks="timeslot.talks">
                  <template #talk="{ talk }">
                    <ion-item class="listTalks-item">
                      <schedule-talk :talk="talk" @talkClicked="openTalkDetails($event)" :is-highlighted="(talk, talkNotes) => talkNotes.isFavorite" :event="event">
                        <template #upper-right="{ talk, talkNotesHook }">
                          <talk-room :talk="talk" :conf-descriptor="event" />
                        </template>
                        <template #footer-actions="{ talk, talkNotesHook }">
                          <talk-watch-later-button v-if="event" :event-descriptor="event" :user-talk-notes="talkNotesHook" />
                          <talk-favorite-button v-if="event" :event-descriptor="event" :user-talk-notes="talkNotesHook" />
                        </template>
                      </schedule-talk>
                    </ion-item>
                  </template>
                </talk-format-groups-breakdown>
              </template>
            </time-slot-accordion>
          </template>
        </timeslots-iterator>
      </ion-accordion-group>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed" v-if="(areFeedbacksEnabled(event) || missingFeedbacksPastTimeslots.length>0)">
        <ion-fab-button @click="(ev) => fixAnimationOnFabClosing(ev.target)">
          <ion-icon src="/assets/icons/line/comment-line-add.svg"></ion-icon>
        </ion-fab-button>
        <ion-fab-list side="top" class="listFeedbackSlot">
          <div class="listFeedbackSlot-item" v-for="(missingFeedbacksPastTimeslot, index) in missingFeedbacksPastTimeslots" :key="missingFeedbacksPastTimeslot.timeslot.id.value"
               @click="() => navigateToTimeslotFeedbackCreation(missingFeedbacksPastTimeslot.timeslot)">
            <ion-label>{{ missingFeedbacksPastTimeslot.start }} <ion-icon aria-hidden="true" src="assets/icons/line/chevron-right-line.svg"></ion-icon>
              {{ missingFeedbacksPastTimeslot.end }}</ion-label>
            <ion-icon class="plusIndicator" aria-hidden="true" src="assets/icons/solid/plus.svg"></ion-icon>
          </div>
        </ion-fab-list>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
    IonFabButton,
    IonFab,
    IonFabList,
    IonAccordionGroup,
    IonInput, modalController,
} from '@ionic/vue';
import {useRoute} from "vue-router";
import {ref, watch} from "vue";
import {prepareSchedules, useSchedule} from "@/state/useSchedule";
import CurrentEventHeader from "@/components/events/CurrentEventHeader.vue";
import {getRouteParamsValue, isRefDefined} from "@/views/vue-utils";
import {EventId} from "@/models/VoxxrinEvent";
import {DayId, VoxxrinDay} from "@/models/VoxxrinDay";
import {
    filterTimeslotsToAutoExpandBasedOn,
    VoxxrinScheduleTimeSlot
} from "@/models/VoxxrinSchedule";
import DaySelector from "@/components/schedule/DaySelector.vue";
import {
    areFeedbacksEnabled,
    findBestAutoselectableConferenceDay,
    findVoxxrinDay
} from "@/models/VoxxrinConferenceDescriptor";
import TimeSlotAccordion from "@/components/schedule/TimeSlotAccordion.vue";
import {useCurrentClock} from "@/state/useCurrentClock";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
import SchedulePreferencesModal from '@/components/modals/SchedulePreferencesModal.vue'
import {useTabbedPageNav} from "@/state/useTabbedPageNav";
import TimeslotsIterator, {MissingFeedbackPastTimeslot} from "@/components/timeslots/TimeslotsIterator.vue";
import ScheduleBreak from "@/components/schedule/ScheduleBreak.vue";
import TalkWatchLaterButton from "@/components/talk-card/TalkWatchLaterButton.vue";
import ScheduleTalk from "@/components/talk-card/ScheduleTalk.vue";
import TalkRoom from "@/components/talk-card/TalkRoom.vue";
import TalkFavoriteButton from "@/components/talk-card/TalkFavoriteButton.vue";
import TalkFormatGroupsBreakdown from "@/components/schedule/TalkFormatGroupsBreakdown.vue";
import {VoxxrinTalk} from "@/models/VoxxrinTalk";

const route = useRoute();
const eventId = ref(new EventId(getRouteParamsValue(route, 'eventId')));
const {conferenceDescriptor: event} = useSharedConferenceDescriptor(eventId);

const { LL } = typesafeI18n()

const currentlySelectedDayId = ref<DayId|undefined>(undefined)
const changeDayTo = (day: VoxxrinDay) => {
    currentlySelectedDayId.value = day.id;

    autoExpandTimeslotsRequested.value = true;
}

const { schedule: currentSchedule } = useSchedule(event, currentlySelectedDayId)

const missingFeedbacksPastTimeslots = ref<MissingFeedbackPastTimeslot[]>([])
const expandedTimeslotIds = ref<string[]>([])
const searchFieldDisplayed = ref(false);
const searchTermsRef = ref<string|undefined>(undefined);
const $searchInput = ref<{ $el: HTMLIonInputElement }|undefined>(undefined);

watch([event, currentlySelectedDayId], ([confDescriptor, selectedDayId]) => {
  console.debug(`current conf descriptor changed`, confDescriptor, selectedDayId)
  if (confDescriptor && !selectedDayId) {
      currentlySelectedDayId.value = findBestAutoselectableConferenceDay(confDescriptor).id;

      // Pre-loading other days data in the background, for 2 main reasons :
      // - navigation to other days will be quickier
      // - if user switches to offline without navigating to these days, information will be in his cache anyway
      setTimeout(() => {
          if(isRefDefined(currentlySelectedDayId)) {
              const otherDayIds = confDescriptor.days.filter(day => !day.id.isSameThan(currentlySelectedDayId.value)).map(d => d.id);
              console.log(`Preparing schedule data for other days than currently selected one (${otherDayIds.map(id => id.value).join(", ")})`)
              prepareSchedules(confDescriptor, currentlySelectedDayId.value, otherDayIds);
          }
      }, 5000)
  }
}, {immediate: true})

const autoExpandTimeslotsRequested = ref(true);
watch([event, currentSchedule ], ([confDescriptor, currentSchedule]) => {
    if(currentSchedule && confDescriptor) {
        currentlySelectedDayId.value = findVoxxrinDay(confDescriptor, currentSchedule.day).id

        if(autoExpandTimeslotsRequested.value) {
            // Deferring expanded timeslots so that :
            // 1/ we don't load the DOM too much when opening a schedule
            // 2/ this allows to show the auto-expand animation to the user
            const autoExpandableTimeslotIds = filterTimeslotsToAutoExpandBasedOn(currentSchedule.timeSlots, useCurrentClock().zonedDateTimeISO())
                .map(ts => ts.id.value)
            setTimeout(() => {
                // Only expanding firt 2 auto-expandable timeslots first (no need to auto-expand others which
                // will be outside the viewport
                expandedTimeslotIds.value = autoExpandableTimeslotIds.slice(0, 3);
            }, 300)
            setTimeout(() => {
                // Waiting a little bit and expanding those timeslots outside the viewport...
                expandedTimeslotIds.value = autoExpandableTimeslotIds.slice(0);

                autoExpandTimeslotsRequested.value = false;
            }, 1200)
        }
    }
}, {immediate: true});

const { triggerTabbedPageNavigate } = useTabbedPageNav();

async function navigateToTimeslotFeedbackCreation(timeslot: VoxxrinScheduleTimeSlot) {
    triggerTabbedPageNavigate(`/events/${eventId.value.value}/new-feedback-for-timeslot/${timeslot.id.value}`, "forward", "push");
}

async function openTalkDetails(talk: VoxxrinTalk) {
    if(talk) {
        triggerTabbedPageNavigate(`/events/${eventId.value}/talks/${talk.id.value}/details`, "forward", "push");
    }
}


// Crappy hack in order to have a pretty ion-fab-list closing animation
// Basically, we need to avoid changing display:flex => none on ion-fab-list *as soon as* the ion-fab-button
// becomes inactive
// This workaround keeps the display:flex property, until the animation is finished, putting back the
// display:none after ~1s
function fixAnimationOnFabClosing($el: HTMLElement) {
    const $ionFab: HTMLIonFabElement|null = $el.closest('ion-fab');
    const $fabButton: HTMLIonFabButtonElement|null|undefined = $ionFab?.querySelector('ion-fab-button')
    const $missingFeedbacksList: HTMLIonFabListElement|null|undefined = $ionFab?.querySelector('ion-fab-list')
    if($fabButton && $missingFeedbacksList) {
        if($fabButton.classList.contains('fab-button-close-active')) {
            $missingFeedbacksList.classList.add('temporarily-displayed-during-inactive-animation')
            setTimeout(() => {
                $missingFeedbacksList.classList.remove('temporarily-displayed-during-inactive-animation')
            }, 1000)
        }
    }
}

function toggleExpandedTimeslot(timeslot: VoxxrinScheduleTimeSlot) {
    const expandedTimeslotIdsIndex = expandedTimeslotIds.value.indexOf(timeslot.id.value)
    if(expandedTimeslotIdsIndex === -1) {
        expandedTimeslotIds.value.push(timeslot.id.value);
    } else {
        expandedTimeslotIds.value.splice(expandedTimeslotIdsIndex, 1);
    }
}

function toggleSearchField() {
    searchFieldDisplayed.value = !searchFieldDisplayed.value
    if(searchFieldDisplayed.value) {
        if(isRefDefined($searchInput)) {
            setTimeout(() => $searchInput.value.$el.setFocus(), 200);
        }
    } else {
        searchTermsRef.value = '';
    }
}

async function openSchedulePreferencesModal() {
    const modal = await modalController.create({
        component: SchedulePreferencesModal,
    });
    modal.present();

    const { data, role } = await modal.onWillDismiss();
    console.log(`TODO: Update schedule local preferences`)
}
</script>

<style scoped lang="scss">

  $ion-fab-button-height: 56px;

  ion-fab-button {
    --background: var(--voxxrin-event-theme-colors-secondary-hex);
    --color: var(--voxxrin-event-theme-colors-secondary-contrast-hex);

    height: $ion-fab-button-height;
  }

  ion-accordion-group {
    margin-bottom: $ion-fab-button-height;
  }

  ion-toolbar {
    position: sticky;
    top: 0;
  }

  .listFeedbackSlot {
    &.temporarily-displayed-during-inactive-animation {
      display: flex;
    }
    flex-direction: column;
    row-gap: 12px;
    right: 2px;
    pointer-events: none;

    &.fab-list-active {
      pointer-events: inherit;

      .listFeedbackSlot-item {
        visibility: visible;

        @for $i from 0 through 1000 {
          animation: slide-left 140ms cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
          animation-timing-function: ease-in-out;

          &:nth-child(#{$i}) {
            animation-delay: $i * calc(80ms / 6);
          }
        }
      }
    }

    &-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 164px;
      padding: 8px 12px;
      border-radius: 8px;
      background-color: var(--voxxrin-event-theme-colors-secondary-contrast-hex);
      border: 1px solid var(--app-beige-line);
      filter: drop-shadow(-4px 0px 4px rgba(0, 0, 0, 0.15));

      @media (prefers-color-scheme: dark) {
        background-color: var(--voxxrin-event-theme-colors-tertiary-hex);
        border: none;
      }

      @for $i from 0 through 1000 {
        animation: slide-left-revert 140ms cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
        animation-timing-function: ease-in-out;

        &:nth-child(#{$i}) {
          animation-delay: $i * calc(-80ms / 6);
        }
      }

      ion-label {
        display: flex;
        align-items: center;
        font-weight: bold;
        color: var(--app-primary-shade);

        @media (prefers-color-scheme: dark) {
          color: var(--app-white);
        }
      }

      .plusIndicator {
        height: 24px;
        width: 24px;
        background-color: var(--voxxrin-event-theme-colors-secondary-hex);
        border-radius: 24px;
        color: var(--voxxrin-event-theme-colors-secondary-contrast-hex);
      }
    }
  }

  @keyframes slide-left {
    0% { transform: translateX(120%);}
    100% { transform: translateX(0);}
  }

  @keyframes slide-left-revert {
    0% {transform: translateX(0);}
    100% { transform: translateX(120%);}
  }

  :deep(.listTalks-item) {
    overflow: visible !important;
    --padding-start: 0;
    --inner-padding-end: 0;
    --background: transparent;
    --border-style: none;

    &:last-child {
      margin-bottom: var(--app-gutters);
    }
  }
</style>
