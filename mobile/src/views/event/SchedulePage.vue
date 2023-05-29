<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <current-event-header v-if="event" :event="event"/>
      <ion-header class="stickyHeader">
        <ion-toolbar>
          <ion-title class="stickyHeader-title" slot="start">{{ LL.Schedule() }}</ion-title>
          <ion-button class="ion-margin-end" slot="end" shape="round" size="small" fill="outline">
            <ion-icon src="/assets/icons/solid/settings-cog.svg"></ion-icon>
          </ion-button>
          <ion-button slot="end" shape="round" size="small">
            <ion-icon src="/assets/icons/line/search-line.svg"></ion-icon>
          </ion-button>
        </ion-toolbar>
      </ion-header>

      <day-selector
          :selected-day-id="currentlySelectedDayId"
          :days="event?.days || []"
          @day-selected="(day) => changeDayTo(day)">
      </day-selector>

      <ion-accordion-group :multiple="true" v-if="event && currentlySelectedDayId" :value="expandedTimeslotIds">
          <time-slot-accordion
              v-for="(timeslot, index) in timeslots" :key="timeslot.id.value"
              :timeslot-feedback="timeslot.feedback" :timeslot="timeslot"
              :event="event"
              @add-timeslot-feedback-clicked="(ts) => showAlertForTimeslot(ts)"
              @click="() => toggleExpandedTimeslot(timeslot)">
          </time-slot-accordion>
      </ion-accordion-group>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed" v-if="missingFeedbacksPastTimeslots.length>0">
        <ion-fab-button @click="(ev) => fixAnimationOnFabClosing(ev.target)">
          <ion-icon src="/assets/icons/line/comment-line-add.svg"></ion-icon>
        </ion-fab-button>
        <ion-fab-list side="top" class="listFeedbackSlot">
          <div class="listFeedbackSlot-item" v-for="(missingFeedbacksPastTimeslot, index) in missingFeedbacksPastTimeslots" :key="missingFeedbacksPastTimeslot.timeslot.id.value"
               @click="() => showAlertForTimeslot(missingFeedbacksPastTimeslot.timeslot)">
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
} from '@ionic/vue';
import {useRoute} from "vue-router";
import {computed, onMounted, ref, watch} from "vue";
import {prepareSchedules, useSchedule} from "@/state/useSchedule";
import CurrentEventHeader from "@/components/CurrentEventHeader.vue";
import {getRouteParamsValue, isRefDefined, useInterval} from "@/views/vue-utils";
import {EventId} from "@/models/VoxxrinEvent";
import {DayId, VoxxrinDay} from "@/models/VoxxrinDay";
import {
    filterTimeslotsToAutoExpandBasedOn,
    getTimeslotLabel,
    getTimeslotTimingProgress,
    VoxxrinScheduleTimeSlot
} from "@/models/VoxxrinSchedule";
import DaySelector from "@/components/DaySelector.vue";
import {findBestAutoselectableConferenceDay, findVoxxrinDay} from "@/models/VoxxrinConferenceDescriptor";
import TimeSlotAccordion from "@/components/TimeSlotAccordion.vue";
import {VoxxrinTimeslotFeedback} from "@/models/VoxxrinFeedback";
import {useCurrentClock} from "@/state/useCurrentClock";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
import {useTabbedPageNav} from "@/state/useTabbedPageNav";

const route = useRoute();
const eventId = computed(() => new EventId(getRouteParamsValue(route, 'eventId')));
const {conferenceDescriptor: event} = useSharedConferenceDescriptor(eventId);

const { LL } = typesafeI18n()

const currentlySelectedDayId = ref<DayId|undefined>(undefined)
const changeDayTo = (day: VoxxrinDay) => {
    currentlySelectedDayId.value = day.id;
}

const { schedule: currentSchedule } = useSchedule(event, currentlySelectedDayId)

type TalkTimeslotWithFeedback = VoxxrinScheduleTimeSlot & {label: ReturnType<typeof getTimeslotLabel>} & {feedback: VoxxrinTimeslotFeedback|undefined};
const timeslots = ref<TalkTimeslotWithFeedback[]>([]);
const missingFeedbacksPastTimeslots = ref<Array<{start: string, end: string, timeslot: VoxxrinScheduleTimeSlot}>>([])
const expandedTimeslotIds = ref<string[]>([])

onMounted(async () => {
    console.log(`SchedulePage mounted !`)
    useInterval(recomputeMissingFeedbacksList, {seconds:10}, {immediate: true})
})

watch([event, currentlySelectedDayId], ([confDescriptor, selectedDayId]) => {
  console.debug(`current conf descriptor changed`, confDescriptor, selectedDayId)
  if (confDescriptor && !selectedDayId) {
      currentlySelectedDayId.value = findBestAutoselectableConferenceDay(confDescriptor).id;

      // Pre-loading other days data in the background, for 2 main reasons :
      // - navigation to other days will be quickier
      // - if user switches to offline without navigating to these days, information will be in his cache anyway
      setTimeout(() => {
          const otherDayIds = confDescriptor.days.filter(day => !day.id.isSameThan(currentlySelectedDayId.value)).map(d => d.id);
          console.log(`Preparing schedule data for other days than currently selected one (${otherDayIds.map(id => id.value).join(", ")})`)
          prepareSchedules(confDescriptor, otherDayIds);
      }, 5000)
  }
}, {immediate: true})

watch([event, currentSchedule], ([confDescriptor, currentSchedule]) => {
    if(currentSchedule && confDescriptor) {
        timeslots.value = currentSchedule.timeSlots.map((ts: VoxxrinScheduleTimeSlot, idx): TalkTimeslotWithFeedback => {
            const label = getTimeslotLabel(ts);
            const feedback: VoxxrinTimeslotFeedback|undefined = idx%2===0?{id: ts.id}:undefined;
            // yes that's weird ... but looks like TS is not very smart here 🤔
            if(ts.type === 'talks') {
                return { ...ts, label, feedback };
            } else {
                return { ...ts, label, feedback };
            }
        });
        recomputeMissingFeedbacksList();

        currentlySelectedDayId.value = findVoxxrinDay(confDescriptor, currentSchedule.day).id

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
        }, 1200)
    }
}, {immediate: true});

function recomputeMissingFeedbacksList() {
    missingFeedbacksPastTimeslots.value = timeslots.value.filter(ts => {
        return ts.type === 'talks'
            && !ts.feedback
            && getTimeslotTimingProgress(ts, useCurrentClock().zonedDateTimeISO()).status === 'past'
    }).map(timeslot => {
        const labels = getTimeslotLabel(timeslot)
        return {timeslot, start: labels.start, end: labels.end };
    });
}

const { triggerTabbedPageNavigate } = useTabbedPageNav();

async function showAlertForTimeslot(timeslot: VoxxrinScheduleTimeSlot) {
    triggerTabbedPageNavigate(`/events/${eventId.value.value}/new-feedback-for-day/${currentlySelectedDayId.value?.value}/and-timeslot/${timeslot.id.value}`, "forward", "push");
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
</style>
