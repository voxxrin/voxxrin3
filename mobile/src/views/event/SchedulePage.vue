<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Schedule</ion-title>
        </ion-toolbar>
      </ion-header>

      Schedule here !

      <ul>
        <li><ion-button @click="changeDayTo('monday')">Monday</ion-button></li>
        <li><ion-button @click="changeDayTo('tuesday')">Tuesday</ion-button></li>
        <li><ion-button @click="changeDayTo('wednesday')">Wednesday</ion-button></li>
        <li><ion-button @click="changeDayTo('thursday')">Thursday</ion-button></li>
        <li><ion-button @click="changeDayTo('friday')">Friday</ion-button></li>
      </ul>

      Size: {{timeslots?.length}}<br/>

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
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonFabButton, IonFab, IonAlert, IonLabel, IonFabList } from '@ionic/vue';
import { chatbubble, addCircle } from 'ionicons/icons';
import {useRoute, useRouter} from "vue-router";
import {onMounted, onUnmounted, ref, watch} from "vue";
import {
    Day,
    EventId,
    fetchSchedule,
    useCurrentSchedule,
    VoxxrinScheduleTimeSlot,
    watchCurrentSchedule
} from "@/state/VoxxrinSchedule";
import {DeepReadonly} from "ts-essentials";
import {getRouteParamsValue} from "@/views/vue-utils";

const router = useRouter();
const route = useRoute();
const eventId = ref(new EventId(getRouteParamsValue(route, 'eventId')!));

const currentSchedule = useCurrentSchedule();
const currentlySelectedDay = ref<Day>(new Day(currentSchedule?.day.value || 'unknown'))
const changeDayTo = (dayName: string) => {
    currentlySelectedDay.value = new Day(dayName);
}

const timeslots = ref<DeepReadonly<VoxxrinScheduleTimeSlot[]>>(currentSchedule?.timeSlots || []);

onMounted(async () => {
    console.log(`EventPage mounted !`)
})

watchCurrentSchedule((currentSchedule) => {
    if(currentSchedule) {
        timeslots.value = currentSchedule.timeSlots;
        currentlySelectedDay.value = currentSchedule.day
    }
}, onUnmounted);

watch([currentlySelectedDay], async ([selectedDay]) => {
    fetchSchedule(eventId.value, selectedDay);
})
// TODO: we should handle this in a better way
if(currentlySelectedDay.value.isSameThan(new Day('unknown'))) {
    changeDayTo('monday');
}


</script>

<style scoped>
</style>
