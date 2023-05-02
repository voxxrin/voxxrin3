<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Schedule</ion-title>
        </ion-toolbar>
      </ion-header>


      <day-selector
          :selected="currentlySelectedDay"
          :days="currentConferenceDescriptor?.days || []"
          @day-selected="(day) => changeDayTo(day)"
      ></day-selector>

      Schedule here !<br/>

      <ion-accordion-group :multiple="true" :value="[]" v-if="currentConferenceDescriptor">
        <time-slot-accordion v-for="(timeslot, index) in timeslots" :key="index"
                   :timeslot-feedback="index%2===0?undefined:{}" :timeslot="timeslot"
                   :event="currentConferenceDescriptor"
        ></time-slot-accordion>
      </ion-accordion-group>

      <ion-button router-direction="forward" :router-link="`/events/${eventId.value}/talks/1/details`">
        Open talk 1
      </ion-button>
      <ion-button router-direction="forward" :router-link="`/events/${eventId.value}/talks/2/details`">
        Open talk 2
      </ion-button>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button>
          <ion-icon :icon="chatbubble"></ion-icon>
        </ion-fab-button>
        <ion-fab-list side="top">
          <ion-fab-button id="testing-alert1">
            <ion-icon :icon="addCircle"></ion-icon>
          </ion-fab-button>
          <ion-label>test 1</ion-label>
          <ion-fab-button id="testing-alert2">
            <ion-icon :icon="addCircle"></ion-icon>
          </ion-fab-button>
          <ion-label>test 2</ion-label>
        </ion-fab-list>
        <ion-alert
            trigger="testing-alert1" header="Alert"
            subHeader="Testing message" message="This is alert 1 !"
        ></ion-alert>
        <ion-alert
            trigger="testing-alert2" header="Alert"
            subHeader="Testing message" message="This is alert 2 !"
        ></ion-alert>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonFabButton,
    IonFab,
    IonAlert,
    IonLabel,
    IonFabList,
    IonAccordionGroup,
} from '@ionic/vue';
import { chatbubble, addCircle } from 'ionicons/icons';
import {useRoute, useRouter} from "vue-router";
import {onMounted, ref, watch} from "vue";
import {
    fetchSchedule,
    useCurrentSchedule,
    watchCurrentSchedule
} from "@/state/CurrentSchedule";
import {DeepReadonly} from "ts-essentials";
import {getRouteParamsValue, isRefDefined} from "@/views/vue-utils";
import {EventId} from "@/models/VoxxrinEvent";
import {VoxxrinDay} from "@/models/VoxxrinDay";
import {VoxxrinScheduleTimeSlot} from "@/models/VoxxrinSchedule";
import {
    useCurrentConferenceDescriptor
} from "@/state/CurrentConferenceDescriptor";
import DaySelector from "@/components/DaySelector.vue";
import {findVoxxrinDayById} from "@/models/VoxxrinConferenceDescriptor";
import TimeSlot from "@/components/TimeSlotAccordion.vue";
import TimeSlotAccordion from "@/components/TimeSlotAccordion.vue";

const router = useRouter();
const route = useRoute();
const eventId = new EventId(getRouteParamsValue(route, 'eventId')!);

const currentConferenceDescriptor = useCurrentConferenceDescriptor(eventId);

const currentSchedule = useCurrentSchedule();
const currentlySelectedDay = ref<VoxxrinDay|undefined>(currentConferenceDescriptor.value?.days[0])
const changeDayTo = (day: VoxxrinDay) => {
    currentlySelectedDay.value = day;
}

const timeslots = ref<DeepReadonly<VoxxrinScheduleTimeSlot[]>>(currentSchedule?.timeSlots || []);

onMounted(async () => {
    console.log(`SchedulePage mounted !`)
})

watchCurrentSchedule((currentSchedule) => {
    if(currentSchedule && isRefDefined(currentConferenceDescriptor)) {
        timeslots.value = currentSchedule.timeSlots;
        currentlySelectedDay.value = findVoxxrinDayById(currentConferenceDescriptor.value, currentSchedule.day)
    }
});

watch([currentlySelectedDay, currentConferenceDescriptor], async ([selectedDay, conferenceDescriptor]) => {
    if(conferenceDescriptor !== undefined) {
        fetchSchedule(conferenceDescriptor, (selectedDay || conferenceDescriptor.days[0]).id);
    }
}, {immediate: true})
</script>

<style scoped>
</style>
