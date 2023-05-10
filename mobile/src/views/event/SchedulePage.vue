<template>
  <ion-page>
    <ion-content :fullscreen="true" >
      <current-event-header v-if="event" :event="event"/>
      <ion-header class="stickyHeader">
        <ion-toolbar>
          <ion-title class="stickyHeader-title" slot="start" >{{ LL.Schedule() }}</ion-title>
          <ion-button class="ion-margin-end" slot="end" shape="round" size="small" fill="outline" color="primary">
            <ion-icon src="/assets/icons/solid/settings-cog.svg"></ion-icon>
          </ion-button>
          <ion-button slot="end" shape="round" size="small">
            <ion-icon src="/assets/icons/line/search-line.svg"></ion-icon>
          </ion-button>
        </ion-toolbar>
      </ion-header>

      <day-selector
          :selected="currentlySelectedDay"
          :days="currentConferenceDescriptor?.days || []"
          @day-selected="(day) => changeDayTo(day)">
      </day-selector>

      <ion-accordion-group :multiple="true" v-if="currentConferenceDescriptor">
          <time-slot-accordion v-for="(timeslot, index) in timeslots" :key="timeslot.id.value"
                               :timeslot-feedback="timeslot.feedback" :timeslot="timeslot"
                               :event="currentConferenceDescriptor">
          </time-slot-accordion>
      </ion-accordion-group>

      <ion-button router-direction="forward" :router-link="`/events/${eventId.value}/talks/1/details`">
        Open talk 1
      </ion-button>
      <ion-button router-direction="forward" :router-link="`/events/${eventId.value}/talks/2/details`">
        Open talk 2
      </ion-button>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button color="tertiary">
          <ion-icon src="/assets/icons/line/comment-line-add.svg"></ion-icon>
        </ion-fab-button>
        <ion-fab-list side="top" class="listFeedbackSlot">
          <div class="listFeedbackSlot-item" v-for="(missingFeedbacksPastTimeslot, index) in missingFeedbacksPastTimeslots" :key="index"
               @click="showAlertForTimeslot(missingFeedbacksPastTimeslot)">
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
    alertController,
} from '@ionic/vue';
import {useRoute, useRouter} from "vue-router";
import {onMounted, ref, watch} from "vue";
import {
    fetchSchedule,
    watchCurrentSchedule
} from "@/state/CurrentSchedule";
import CurrentEventHeader from "@/components/CurrentEventHeader.vue";
import {getRouteParamsValue, isRefDefined, useInterval} from "@/views/vue-utils";
import {EventId} from "@/models/VoxxrinEvent";
import {VoxxrinDay} from "@/models/VoxxrinDay";
import {
    getTimeslotLabel,
    getTimeslotTimingProgress,
    VoxxrinScheduleTimeSlot
} from "@/models/VoxxrinSchedule";
import {
    useCurrentConferenceDescriptor
} from "@/state/CurrentConferenceDescriptor";
import DaySelector from "@/components/DaySelector.vue";
import {findVoxxrinDay} from "@/models/VoxxrinConferenceDescriptor";
import TimeSlotAccordion from "@/components/TimeSlotAccordion.vue";
import {VoxxrinTimeslotFeedback} from "@/models/VoxxrinFeedback";
import {useCurrentClock} from "@/state/CurrentClock";
import {typesafeI18n} from "@/i18n/i18n-vue";

const router = useRouter();
const route = useRoute();
const eventId = new EventId(getRouteParamsValue(route, 'eventId')!);
const event = useCurrentConferenceDescriptor(eventId);

const { LL } = typesafeI18n()

const currentConferenceDescriptor = useCurrentConferenceDescriptor(eventId);

const currentlySelectedDay = ref<VoxxrinDay|undefined>(currentConferenceDescriptor.value?.days[0])
const changeDayTo = (day: VoxxrinDay) => {
    currentlySelectedDay.value = day;
}

const timeslots = ref<Array<VoxxrinScheduleTimeSlot & {feedback: VoxxrinTimeslotFeedback|undefined}>>([]);
const missingFeedbacksPastTimeslots = ref<VoxxrinTimeslotFeedback[]>([])

onMounted(async () => {
    console.log(`SchedulePage mounted !`)
    useInterval(recomputeMissingFeedbacksList, import.meta.env.DEV?{seconds:5}:{minutes:3}, {immediate: true})
})

watchCurrentSchedule((currentSchedule) => {
    if(currentSchedule && isRefDefined(currentConferenceDescriptor)) {
        timeslots.value = currentSchedule.timeSlots.map((ts, idx) => {
            // yes that's weird ... but looks like TS is not very smart here 🤔
            if(ts.type === 'break') {
                return {...ts, feedback: idx%2===0?{}:undefined};
            } else {
                return {...ts, feedback: idx%2===0?{}:undefined};
            }
        });
        recomputeMissingFeedbacksList();

        currentlySelectedDay.value = findVoxxrinDay(currentConferenceDescriptor.value, currentSchedule.day)
    }
});

watch([currentlySelectedDay, currentConferenceDescriptor], async ([selectedDay, conferenceDescriptor]) => {
    if(conferenceDescriptor !== undefined) {
        fetchSchedule(conferenceDescriptor, (selectedDay || conferenceDescriptor.days[0]).id);
    }
}, {immediate: true})

function recomputeMissingFeedbacksList() {
    missingFeedbacksPastTimeslots.value = timeslots.value.filter(ts => {
        return ts.type === 'talks'
            && !ts.feedback
            && getTimeslotTimingProgress(ts, useCurrentClock().zonedDateTimeISO()).status === 'past'
    }).map(ts => getTimeslotLabel(ts));
}

async function showAlertForTimeslot(missingFeedbacksPastTimeslots: VoxxrinTimeslotFeedback) {
    const alert = await alertController.create({ header: 'Alert !', message: 'This is an alert !' });
    alert.present();
}
</script>

<style scoped lang="scss">
  ion-toolbar {
    position: sticky;
    top: 0;
  }

  .listFeedbackSlot {
    display: flex; /* TODO Delete */
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
      background-color: white;
      border: 1px solid var(--app-beige-line);
      filter: drop-shadow(-4px 0px 4px rgba(0, 0, 0, 0.15));

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
      }

      .plusIndicator {
        height: 24px;
        width: 24px;
        background-color: var(--app-theme-hightlight);
        border-radius: 24px;
        color: white;
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
