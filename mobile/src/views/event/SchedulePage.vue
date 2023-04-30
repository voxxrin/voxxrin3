<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Schedule</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-list>
        <ion-item v-for="(day, index) in currentConferenceDescriptor?.days || []" :key="index">
          <ion-button @click="changeDayTo(day)">{{day.value}}</ion-button>
        </ion-item>
      </ion-list>

      Schedule here !<br/>
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
    IonItem,
    IonList
} from '@ionic/vue';
import { chatbubble, addCircle } from 'ionicons/icons';
import {useRoute, useRouter} from "vue-router";
import {onMounted, onUnmounted, ref, watch} from "vue";
import {
    fetchSchedule,
    useCurrentSchedule,
    watchCurrentSchedule
} from "@/state/CurrentSchedule";
import {DeepReadonly} from "ts-essentials";
import {getRouteParamsValue} from "@/views/vue-utils";
import {EventId} from "@/models/VoxxrinEvent";
import {Day} from "@/models/VoxxrinDay";
import {VoxxrinScheduleTimeSlot} from "@/models/VoxxrinSchedule";
import {
    fetchConferenceDescriptor,
    useCurrentConferenceDescriptor
} from "@/state/CurrentConferenceDescriptor";

const router = useRouter();
const route = useRoute();
const eventId = new EventId(getRouteParamsValue(route, 'eventId')!);

const currentSchedule = useCurrentSchedule();
const currentlySelectedDay = ref<Day>(new Day(currentSchedule?.day.value || 'unknown'))
const changeDayTo = (day: Day) => {
    currentlySelectedDay.value = day;
}

const currentConferenceDescriptor = ref(useCurrentConferenceDescriptor());
const timeslots = ref<DeepReadonly<VoxxrinScheduleTimeSlot[]>>(currentSchedule?.timeSlots || []);

onMounted(async () => {
    console.log(`EventPage mounted !`)
    fetchConferenceDescriptor(eventId)
        .then(confDesc => currentConferenceDescriptor.value = confDesc);
})

watchCurrentSchedule((currentSchedule) => {
    if(currentSchedule) {
        timeslots.value = currentSchedule.timeSlots;
        currentlySelectedDay.value = currentSchedule.day
    }
}, onUnmounted);

watch([currentlySelectedDay], async ([selectedDay]) => {
    fetchSchedule(eventId, selectedDay);
})
// TODO: we should handle this in a better way
if(currentlySelectedDay.value.isSameThan(new Day('unknown'))) {
    changeDayTo(new Day('2022-10-10'));
}
</script>

<style scoped>
</style>
