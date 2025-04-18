<template>
  <ion-page>
    <ion-content :fullscreen="true" v-if="confDescriptor">
      <current-event-header v-if="!hideHeader" :conf-descriptor="confDescriptor"/>
      <ion-toast position="top" style="--max-width: 70%; --button-color: var(--color)"
           :message="preparingOfflineScheduleToastMessageRef"
           :is-open="preparingOfflineScheduleToastIsOpenRef"
           :buttons="[{text: 'Dismiss', role: LL.Cancel() }]"
           layout="stacked"
           @didDismiss="preparingOfflineScheduleToastIsOpenRef = false"
      ></ion-toast>
      <ion-header class="toolbarHeader">
        <ion-toolbar>
          <ion-title slot="start">{{ LL.Schedule() }}</ion-title>
          <transition name="searchBar">
            <div v-if="searchFieldDisplayed" class="search-input">
              <ion-input :size="10" ref="$searchInput"
                         :debounce="300"
                         :placeholder="`${LL.Search()}...`"
                         @ionInput="(ev) => searchTermsRef = ''+ev.target.value"
              />
              <ion-icon class="iconInput" src="/assets/icons/line/search-line.svg"></ion-icon>
              <ion-button shape="round" size="small" fill="outline" @click="toggleSearchField()"
                          :aria-label="LL.Search_close()">
                <ion-icon src="/assets/icons/line/close-line.svg"></ion-icon>
              </ion-button>
            </div>
          </transition>

          <ion-button class="ion-margin-end" slot="end" shape="round" size="small" fill="outline" @click="openSchedulePreferencesModal()"
                      v-if="false"   :aria-label="LL.Filters()">
            <ion-icon src="/assets/icons/solid/settings-cog.svg"></ion-icon>
          </ion-button>
          <ion-button slot="end" shape="round" size="small" @click="toggleSearchField()"
                      :aria-label="LL.Search()">
            <ion-icon src="/assets/icons/line/search-line.svg"></ion-icon>
          </ion-button>
        </ion-toolbar>
      </ion-header>

      <ion-header class="stickyHeader daySelectorContainer">
        <day-selector
            :conf-descriptor="confDescriptor"
            @once-initialized-with-day="(day, days) => onceDayInitializedTo(day, days)">
        </day-selector>
      </ion-header>

      <ion-accordion-group :multiple="true" v-if="confDescriptor && selectedDayId" :value="expandedTimeslotIds">
        <timeslots-iterator :conf-descriptor="confDescriptor" :day-id="selectedDayId"
                            :daily-schedule="currentSchedule" :search-terms="searchTermsRef"
                            @timeslots-list-updated="(displayedTimeslots) => displayedTimeslotsRef = displayedTimeslots"
                            @missing-feedback-past-timeslots-updated="updatedMissingTimeslots => missingFeedbacksPastTimeslots = updatedMissingTimeslots">
          <template #iterator="{ timeslot, index: timeslotIndex, progress, upcomingRawTalkIds }">
            <time-slot-accordion
                :animation-delay="timeslotIndex*TimeslotAnimations.ANIMATION_BASE_DELAY.total('milliseconds')"
                :timeslot-feedback="timeslot.feedback" :timeslot="timeslot" :conf-descriptor="confDescriptor"
                :elements-shown="['add-feedback-btn']"
                :progress="progress"
                @add-timeslot-feedback-clicked="(ts) => navigateToTimeslotFeedbackCreation(ts)"
                @click="() => toggleExpandedTimeslot(timeslot)">
              <template #accordion-content="{ timeslot, progressStatus, feedback }">
                <schedule-break v-if="timeslot.type==='break'" :conf-descriptor="confDescriptor" :talk-break="timeslot.break"></schedule-break>
                <talk-format-groups-breakdown :conf-descriptor="confDescriptor" v-if="timeslot.type==='talks'"
                                              :talks="timeslot.talks">
                  <template #talk="{ talk }">
                    <ion-item class="listTalks-item" role="listitem">
                      <schedule-talk :talk="talk" :talk-stats="talkStatsRefByTalkId.get(talk.id.value)"
                                     :room-stats="roomsStatsRefByRoomId?.[talk.room.id.value]" :is-upcoming-talk="upcomingRawTalkIds.includes(talk.id.value)"
                                     :talk-notes="userEventTalkNotesRef.get(talk.id.value)" @talkClicked="openTalkDetails($event)" :is-highlighted="(talk, talkNotes) => talkNotes.isFavorite" :conf-descriptor="confDescriptor">
                        <template #upper-right="{ talk }">
                          <talk-room :talk="talk" :conf-descriptor="confDescriptor" />
                        </template>
                        <template #footer-actions="{ talk, talkStats, talkNotes }">
                          <provide-feedback-talk-button v-if="!talk.isOverflow"
                            :conf-descriptor="confDescriptor" :timeslot-progress-status="progressStatus"
                            :timeslot-feedback="feedback" @click.stop="navigateToTalkRatingScreenFor(talk)" />
                          <talk-watch-later-button v-if="confDescriptor && !hideWatchLater && !talk.isOverflow"
                            :conf-descriptor="confDescriptor" :user-talk-notes="talkNotes"
                            @talk-note-updated="updatedTalkNote => userEventTalkNotesRef.set(talk.id.value, updatedTalkNote) " />
                          <talk-favorite-button v-if="confDescriptor && !talk.isOverflow"
                            :conf-descriptor="confDescriptor" :user-talk-notes="talkNotes" :talk-stats="talkStats"
                            :local-favorite="localEventTalkNotesRef.get(talk.id.value)"
                            @talk-note-updated="updatedTalkNote => userEventTalkNotesRef.set(talk.id.value, updatedTalkNote) " />
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

      <ion-fab vertical="bottom" horizontal="end" slot="fixed" v-if="(areFeedbacksEnabled(confDescriptor) && missingFeedbacksPastTimeslots.length>0)">
        <ion-fab-button @click="(ev) => fixAnimationOnFabClosing(ev.target)"
                        :aria-label="LL.Open_List_Slot_Feedback()">
          <ion-icon src="/assets/icons/line/comment-line-add.svg"></ion-icon>
        </ion-fab-button>
        <ion-fab-list side="top" class="listFeedbackSlot">
          <div class="listFeedbackSlot-item"
               :aria-label="LL.Add_Feedback_On_Slot()"
               v-for="(missingFeedbacksPastTimeslot, index) in missingFeedbacksPastTimeslots"
               :key="missingFeedbacksPastTimeslot.timeslot.id.value"
               @click="() => navigateToTimeslotFeedbackCreation(missingFeedbacksPastTimeslot.timeslot)">
            <ion-label>{{ missingFeedbacksPastTimeslot.start }} <ion-icon aria-hidden="true" src="assets/icons/line/chevron-right-line.svg"></ion-icon>
              {{ missingFeedbacksPastTimeslot.end }}</ion-label>
            <ion-icon class="plusIndicator" aria-hidden="true" src="assets/icons/solid/plus.svg"></ion-icon>
          </div>
        </ion-fab-list>
      </ion-fab>
      <PoweredVoxxrin></PoweredVoxxrin>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {IonAccordionGroup, IonFab, IonFabButton, IonFabList, IonInput, IonToast, modalController} from '@ionic/vue';
import {computed, nextTick, Ref, toValue, watch} from "vue";
import {isRefDefined, managedRef as ref} from "@/views/vue-utils";
import {LabelledTimeslotWithFeedback, useSchedule} from "@/state/useSchedule";
import CurrentEventHeader from "@/components/events/CurrentEventHeader.vue";
import {VoxxrinDay} from "@/models/VoxxrinDay";
import {
  extractTalksFromSchedule,
  filterTimeslotsToAutoExpandBasedOn,
  VoxxrinScheduleTimeSlot
} from "@/models/VoxxrinSchedule";
import DaySelector from "@/components/schedule/DaySelector.vue";
import {areFeedbacksEnabled,} from "@/models/VoxxrinConferenceDescriptor";
import TimeSlotAccordion from "@/components/timeslots/TimeSlotAccordion.vue";
import {useCurrentClock} from "@/state/useCurrentClock";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {useOfflineEventPreparation, useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
import SchedulePreferencesModal from '@/components/modals/SchedulePreferencesModal.vue'
import {useTabbedPageNav} from "@/state/useTabbedPageNav";
import TimeslotsIterator, {MissingFeedbackPastTimeslot} from "@/components/timeslots/TimeslotsIterator.vue";
import ScheduleBreak from "@/components/schedule/ScheduleBreak.vue";
import ScheduleTalk from "@/components/talk-card/ScheduleTalk.vue";
import TalkRoom from "@/components/talk-card/TalkRoom.vue";
import TalkFavoriteButton from "@/components/talk-card/TalkFavoriteButton.vue";
import TalkFormatGroupsBreakdown from "@/components/schedule/TalkFormatGroupsBreakdown.vue";
import {VoxxrinTalk} from "@/models/VoxxrinTalk";
import {useSharedEventSelectedDay} from "@/state/useEventSelectedDay";
import {Logger} from "@/services/Logger";
import {useCurrentUser} from "vuefire";
import {TimeslotAnimations} from "@/services/Animations";
import {useEventTalkStats} from "@/state/useEventTalkStats";
import TalkWatchLaterButton from "@/components/talk-card/TalkWatchLaterButton.vue";
import {useLocalEventTalkFavsStorage, useUserEventTalkNotes} from "@/state/useUserTalkNotes";
import ProvideFeedbackTalkButton from "@/components/talk-card/ProvideFeedbackTalkButton.vue";
import PoweredVoxxrin from "@/components/ui/PoweredVoxxrin.vue";
import {useRoomsStats} from "@/state/useRoomsStats";
import {getResolvedEventRootPathFromSpacedEventIdRef, useCurrentSpaceEventIdRef} from "@/services/Spaces";

const LOGGER = Logger.named("SchedulePage");

const props = defineProps({
    hideHeader: {
        required: false,
        type: Boolean,
        default: false
    },
    hideWatchLater: {
        require: false,
        type: Boolean,
        default: false
    },
    emitEventOnTalkClicked: {
        required: false,
        type: Boolean,
        default: false,
    }
})

const emits = defineEmits<{
  (event: 'talk-clicked', talk: VoxxrinTalk): void,
}>()

const spacedEventId = useCurrentSpaceEventIdRef()
const {conferenceDescriptor: confDescriptor} = useSharedConferenceDescriptor(spacedEventId);

const { LL } = typesafeI18n()

const {selectedDayId} = useSharedEventSelectedDay(spacedEventId);

const user = useCurrentUser()

const availableDaysRef = ref<VoxxrinDay[]|undefined>(undefined);
function onceDayInitializedTo(day: VoxxrinDay, availableDays: VoxxrinDay[]) {
  availableDaysRef.value = availableDays;
}

const { schedule: currentSchedule } = useSchedule(confDescriptor, selectedDayId)

const preparingOfflineScheduleToastMessageRef = ref<string | undefined>(undefined);
const preparingOfflineScheduleToastIsOpenRef = ref<boolean>(false);
useOfflineEventPreparation(user, confDescriptor, currentSchedule, availableDaysRef, preparingOfflineScheduleToastMessageRef, preparingOfflineScheduleToastIsOpenRef);

const talkIdsRef = computed(() => {
    const schedule = toValue(currentSchedule);
    return schedule ? extractTalksFromSchedule(schedule).map(talk => talk.id) : [];
})

const {firestoreEventTalkStatsRef: talkStatsRefByTalkId} = useEventTalkStats(spacedEventId, talkIdsRef)
const {userEventTalkNotesRef} = useUserEventTalkNotes(spacedEventId, talkIdsRef)
const localEventTalkNotesRef = useLocalEventTalkFavsStorage(spacedEventId)
const {firestoreRoomsStatsRef: roomsStatsRefByRoomId } = useRoomsStats(spacedEventId)

const displayedTimeslotsRef = ref<LabelledTimeslotWithFeedback[]>([]) as Ref<LabelledTimeslotWithFeedback[]>;

// const {talkFeedbackViewerTokensRefForEvent} = useUserTokensWallet();
// const talkFeedbackViewerTokensRef = talkFeedbackViewerTokensRefForEvent(spacedEventId);

const missingFeedbacksPastTimeslots = ref<MissingFeedbackPastTimeslot[]>([])
const expandedTimeslotIds = ref<string[]>([])
const searchFieldDisplayed = ref(false);
const searchTermsRef = ref<string|undefined>(undefined);
const $searchInput = ref<{ $el: HTMLIonInputElement }|undefined>(undefined);

const autoExpandTimeslotsRequested = ref(true);
watch([confDescriptor, displayedTimeslotsRef ], ([confDescriptor, displayedTimeslots]) => {
    if(displayedTimeslots && displayedTimeslots.length && confDescriptor) {
        if(autoExpandTimeslotsRequested.value) {
            // Deferring expanded timeslots so that this shows the auto-expand animation to the user
            const autoExpandableTimeslotIds = filterTimeslotsToAutoExpandBasedOn(displayedTimeslots, useCurrentClock().zonedDateTimeISO())
                .map(ts => ts.id.value)
            setTimeout(() => {
                expandedTimeslotIds.value = autoExpandableTimeslotIds.slice(0);
            }, TimeslotAnimations.ANIMATION_BASE_DELAY.total('milliseconds')*displayedTimeslots.length
                + TimeslotAnimations.ANIMATION_DURATION.total('milliseconds')
                + 200
            )
        }
    }
}, {immediate: true});
watch([selectedDayId], ([updatedDayId]) => {
    autoExpandTimeslotsRequested.value = updatedDayId !== undefined;
})

const { triggerTabbedPageNavigate } = useTabbedPageNav();

async function navigateToTimeslotFeedbackCreation(timeslot: VoxxrinScheduleTimeSlot) {
    triggerTabbedPageNavigate(`${getResolvedEventRootPathFromSpacedEventIdRef(spacedEventId)}/new-feedback-for-timeslot/${timeslot.id.value}`, "forward", "push");
}

async function navigateToTalkRatingScreenFor(talk: VoxxrinTalk) {
    triggerTabbedPageNavigate(`${getResolvedEventRootPathFromSpacedEventIdRef(spacedEventId)}/rate-talk/${talk.id.value}`, "forward", "push");
}

async function openTalkDetails(talk: VoxxrinTalk) {
    if(talk) {
        if(props.emitEventOnTalkClicked) {
          emits('talk-clicked', talk);
        } else {
          // TODO: Re-enable this once *tabbed* talk details as feedback viewer routing has been fixed
          // const talkFeedbackViewerToken = toValue(talkFeedbackViewerTokensRef)?.find(t => t.talkId.isSameThan(talk.id));
          // const url = talkFeedbackViewerToken
          //   ?`/events/${eventId.value.value}/talks/${talk.id.value}/asFeedbackViewer/${talkFeedbackViewerToken.secretToken}/details`
          //   :`/events/${eventId.value.value}/talks/${talk.id.value}/details`
          const url = `${getResolvedEventRootPathFromSpacedEventIdRef(spacedEventId)}/talks/${talk.id.value}/details`

          triggerTabbedPageNavigate(url, "forward", "push");
        }
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

async function toggleSearchField() {
  searchFieldDisplayed.value = !searchFieldDisplayed.value
  if(searchFieldDisplayed.value) {
    await nextTick(); // Wait for Vue to update the DOM
    if(isRefDefined($searchInput)) {
      setTimeout(() => $searchInput.value.$el.setFocus(), 100);
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
    LOGGER.debug(() => `TODO: Update schedule local preferences`)
}
</script>

<style scoped lang="scss">

  .searchBar-enter-active, .searchBar-leave-active {
    transition: width 120ms cubic-bezier(0.250, 0.460, 0.450, 0.940);
  }

  .searchBar-enter-from, .searchBar-leave-to {
    width: 0;
  }

  .searchBar-enter-to, .searchBar-leave-from {
    width: 100%;
  }


  .daySelectorContainer {
    overflow-y: auto;
  }

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

  .listTalks {
    padding: 0;
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

  .talkCard {
    margin-top: 8px;
    margin-bottom: 4px;
  }
</style>
